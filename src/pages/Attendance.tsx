import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import dayjs from 'dayjs'
import { db } from '../lib/db'
import type { AttendanceStatus, Task } from '../types'

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'half-day', label: 'Half Day', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-300' },
]

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  const workers = useLiveQuery(() =>
    db.workers.where('status').equals('active').toArray()
  )

  const workDays = useLiveQuery(
    () => db.workDays.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  )

  const workDayMap = new Map(workDays?.map((wd) => [wd.workerId, wd]))

  const tasks = useLiveQuery(
    () => db.tasks.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  )

  const workDayTasks = useLiveQuery(
    async () => {
      const wdIds = workDays?.map((wd) => wd.id!) ?? []
      if (wdIds.length === 0) return []
      return db.workDayTasks.where('workDayId').anyOf(wdIds).toArray()
    },
    [workDays]
  )

  function getWorkerTasks(workDayId: number | undefined): Task[] {
    if (!workDayId || !workDayTasks || !tasks) return []
    const taskIds = workDayTasks
      .filter((wdt) => wdt.workDayId === workDayId)
      .map((wdt) => wdt.taskId)
    return tasks.filter((t) => taskIds.includes(t.id!))
  }

  async function setAttendance(
    workerId: number,
    attendance: AttendanceStatus
  ) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await db.workDays.update(existing.id!, { attendance })
    } else {
      await db.workDays.add({
        workerId,
        date: selectedDate,
        attendance,
        overtimeHours: 0,
        notes: '',
      })
    }
  }

  async function setOvertime(workerId: number, hours: number) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await db.workDays.update(existing.id!, { overtimeHours: hours })
    }
  }

  async function setNotes(workerId: number, notes: string) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await db.workDays.update(existing.id!, { notes })
    }
  }

  async function markAllPresent() {
    const ops = (workers || []).map(async (worker) => {
      const existing = workDayMap.get(worker.id!)
      if (!existing) {
        await db.workDays.add({
          workerId: worker.id!,
          date: selectedDate,
          attendance: 'present',
          overtimeHours: 0,
          notes: '',
        })
      }
    })
    await Promise.all(ops)
  }

  const presentCount =
    workDays?.filter(
      (wd) => wd.attendance === 'present' || wd.attendance === 'half-day'
    ).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-900">Attendance</h2>
        <span className="text-sm text-gray-500">
          {presentCount}/{workers?.length ?? 0} present
        </span>
      </div>

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-green-700 font-medium">
          {dayjs(selectedDate).format('dddd, MMM D, YYYY')}
        </p>
        <button
          onClick={markAllPresent}
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          Mark All Present
        </button>
      </div>

      {workers?.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No active workers. Add workers first.
        </p>
      )}

      <div className="space-y-3">
        {workers?.map((worker) => {
          const wd = workDayMap.get(worker.id!)
          return (
            <div
              key={worker.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-green-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900">{worker.name}</p>
                  <p className="text-xs text-gray-400">{worker.role}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAttendance(worker.id!, opt.value)}
                    className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                      wd?.attendance === opt.value
                        ? opt.color
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {wd && wd.attendance !== 'absent' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Overtime (hrs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={wd.overtimeHours || ''}
                      onChange={(e) =>
                        setOvertime(worker.id!, Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Notes</label>
                    <input
                      value={wd.notes}
                      onChange={(e) => setNotes(worker.id!, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Assigned tasks */}
              {wd && (() => {
                const workerTasks = getWorkerTasks(wd.id)
                if (workerTasks.length === 0) return null
                return (
                  <div className="pt-1">
                    <p className="text-xs text-gray-500 mb-1">Tasks</p>
                    <div className="flex flex-wrap gap-1">
                      {workerTasks.map((task) => (
                        <span
                          key={task.id}
                          className={`text-xs rounded-full px-2 py-0.5 ${
                            task.status === 'done'
                              ? 'bg-green-100 text-green-700 line-through'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
