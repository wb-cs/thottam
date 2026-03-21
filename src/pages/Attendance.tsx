import { useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabase'
import {
  useWorkers,
  useWorkDaysByDate,
  useTasksByDate,
  useWorkDayTasksByWorkDayIds,
} from '../lib/useSupabaseQuery'
import type { AttendanceStatus } from '../types'

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'half-day', label: 'Half Day', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-300' },
]

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  const { data: workers } = useWorkers('active')
  const { data: workDays, refetch: refetchWorkDays } = useWorkDaysByDate(selectedDate)
  const { data: tasks } = useTasksByDate(selectedDate)

  const workDayIds = workDays?.map((wd: any) => wd.id) ?? []
  const { data: workDayTasks } = useWorkDayTasksByWorkDayIds(workDayIds)

  const workDayMap = new Map(workDays?.map((wd: any) => [wd.worker_id, wd]))

  function getWorkerTasks(workDayId: number | undefined) {
    if (!workDayId || !workDayTasks || !tasks) return []
    const taskIds = workDayTasks
      .filter((wdt: any) => wdt.work_day_id === workDayId)
      .map((wdt: any) => wdt.task_id)
    return tasks.filter((t: any) => taskIds.includes(t.id))
  }

  async function setAttendance(workerId: number, attendance: AttendanceStatus) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await supabase
        .from('work_days')
        .update({ attendance })
        .eq('id', existing.id)
    } else {
      await supabase.from('work_days').insert({
        worker_id: workerId,
        date: selectedDate,
        attendance,
        overtime_hours: 0,
        notes: '',
      })
    }
    refetchWorkDays()
  }

  async function setOvertime(workerId: number, hours: number) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await supabase
        .from('work_days')
        .update({ overtime_hours: hours })
        .eq('id', existing.id)
      refetchWorkDays()
    }
  }

  async function setNotes(workerId: number, notes: string) {
    const existing = workDayMap.get(workerId)
    if (existing) {
      await supabase
        .from('work_days')
        .update({ notes })
        .eq('id', existing.id)
      refetchWorkDays()
    }
  }

  async function markAllPresent() {
    const inserts = (workers || [])
      .filter((w: any) => !workDayMap.has(w.id))
      .map((w: any) => ({
        worker_id: w.id,
        date: selectedDate,
        attendance: 'present' as const,
        overtime_hours: 0,
        notes: '',
      }))
    if (inserts.length > 0) {
      await supabase.from('work_days').insert(inserts)
      refetchWorkDays()
    }
  }

  const presentCount =
    workDays?.filter(
      (wd: any) => wd.attendance === 'present' || wd.attendance === 'half-day'
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
        {workers?.map((worker: any) => {
          const wd = workDayMap.get(worker.id)
          const workerTasks = getWorkerTasks(wd?.id)

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
                    onClick={() => setAttendance(worker.id, opt.value)}
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
                      value={wd.overtime_hours || ''}
                      onChange={(e) =>
                        setOvertime(worker.id, Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Notes</label>
                    <input
                      value={wd.notes}
                      onChange={(e) => setNotes(worker.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}

              {workerTasks.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-1">Tasks</p>
                  <div className="flex flex-wrap gap-1">
                    {workerTasks.map((task: any) => (
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
