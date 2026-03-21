import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import dayjs from 'dayjs'
import { db } from '../lib/db'

export default function Tasks() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null)

  const tasks = useLiveQuery(
    () => db.tasks.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  )

  const workers = useLiveQuery(() =>
    db.workers.where('status').equals('active').toArray()
  )

  const workDays = useLiveQuery(
    () => db.workDays.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  )

  const allWorkDayTasks = useLiveQuery(
    async () => {
      const taskIds = tasks?.map((t) => t.id!) ?? []
      if (taskIds.length === 0) return []
      const wdts = await db.workDayTasks.toArray()
      return wdts.filter((wdt) => taskIds.includes(wdt.taskId))
    },
    [tasks]
  )

  const presentWorkerIds = new Set(
    workDays
      ?.filter((wd) => wd.attendance === 'present' || wd.attendance === 'half-day')
      .map((wd) => wd.workerId)
  )

  function getAssignedWorkerIds(taskId: number): number[] {
    return (
      allWorkDayTasks
        ?.filter((wdt) => wdt.taskId === taskId)
        .map((wdt) => {
          const wd = workDays?.find((w) => w.id === wdt.workDayId)
          return wd?.workerId ?? 0
        })
        .filter(Boolean) ?? []
    )
  }

  async function addTask() {
    if (!newTitle.trim()) return
    await db.tasks.add({
      date: selectedDate,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'pending',
    })
    setNewTitle('')
    setNewDesc('')
  }

  async function toggleTaskStatus(taskId: number, current: string) {
    await db.tasks.update(taskId, {
      status: current === 'done' ? 'pending' : 'done',
    })
  }

  async function deleteTask(taskId: number) {
    await db.workDayTasks.where('taskId').equals(taskId).delete()
    await db.tasks.delete(taskId)
  }

  async function toggleWorkerAssignment(taskId: number, workerId: number) {
    const wd = workDays?.find((w) => w.workerId === workerId)
    if (!wd) return

    const existing = allWorkDayTasks?.find(
      (wdt) => wdt.taskId === taskId && wdt.workDayId === wd.id
    )

    if (existing) {
      await db.workDayTasks.delete(existing.id!)
    } else {
      await db.workDayTasks.add({ workDayId: wd.id!, taskId })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-green-900">Tasks</h2>

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))
          }
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          ←
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
        />
        <button
          onClick={() =>
            setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))
          }
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          →
        </button>
      </div>

      <p className="text-sm text-green-700 font-medium">
        {dayjs(selectedDate).format('dddd, MMM D, YYYY')}
      </p>

      {/* Add task form */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 space-y-2">
        <input
          placeholder="Task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={addTask}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 w-full"
        >
          Add Task
        </button>
      </div>

      {tasks?.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No tasks for this date.
        </p>
      )}

      <div className="space-y-3">
        {tasks?.map((task) => {
          const assignedIds = getAssignedWorkerIds(task.id!)
          const isAssigning = assigningTaskId === task.id

          return (
            <div
              key={task.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-green-100 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id!, task.status)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                      task.status === 'done'
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {task.status === 'done' && '✓'}
                  </button>
                  <div>
                    <p
                      className={`font-medium ${
                        task.status === 'done'
                          ? 'line-through text-gray-400'
                          : 'text-green-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-500">{task.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id!)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Assigned workers */}
              <div className="flex flex-wrap gap-1">
                {assignedIds.map((wid) => {
                  const worker = workers?.find((w) => w.id === wid)
                  return worker ? (
                    <span
                      key={wid}
                      className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5"
                    >
                      {worker.name}
                    </span>
                  ) : null
                })}
              </div>

              <button
                onClick={() =>
                  setAssigningTaskId(isAssigning ? null : task.id!)
                }
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                {isAssigning ? 'Done assigning' : '+ Assign workers'}
              </button>

              {isAssigning && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {presentWorkerIds.size === 0 && (
                    <p className="text-xs text-gray-400">
                      No workers marked present for this date.
                    </p>
                  )}
                  {workers
                    ?.filter((w) => presentWorkerIds.has(w.id!))
                    .map((worker) => {
                      const isAssigned = assignedIds.includes(worker.id!)
                      return (
                        <button
                          key={worker.id}
                          onClick={() =>
                            toggleWorkerAssignment(task.id!, worker.id!)
                          }
                          className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                            isAssigned
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {worker.name}
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
