import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import {
  useWorkers,
  useWorkDaysByDate,
  useTasksByDate,
  useWorkDayTasksByTaskIds,
} from '../lib/useSupabaseQuery'
import WeeklyCalendar from '../components/WeeklyCalendar'

export default function Dashboard() {
  const today = dayjs().format('YYYY-MM-DD')

  const { data: workers } = useWorkers('active')
  const { data: workDays } = useWorkDaysByDate(today)
  const { data: tasks } = useTasksByDate(today)

  const taskIds = tasks?.map((t: any) => t.id) ?? []
  const { data: allWorkDayTasks } = useWorkDayTasksByTaskIds(taskIds)

  const activeCount = workers?.length ?? 0
  const presentCount =
    workDays?.filter(
      (wd: any) => wd.attendance === 'present' || wd.attendance === 'half-day'
    ).length ?? 0
  const attendanceCount = workDays?.length ?? 0
  const totalTasks = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t: any) => t.status === 'done').length ?? 0

  function getAssignedWorkers(taskId: number) {
    if (!allWorkDayTasks || !workDays || !workers) return []
    const wdIds = allWorkDayTasks
      .filter((wdt: any) => wdt.task_id === taskId)
      .map((wdt: any) => wdt.work_day_id)
    const workerIds = workDays
      .filter((wd: any) => wdIds.includes(wd.id))
      .map((wd: any) => wd.worker_id)
    return workers.filter((w: any) => workerIds.includes(w.id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-green-900">Dashboard</h2>
        <p className="text-green-700">{dayjs().format('dddd, MMMM D, YYYY')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/workers"
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-gray-500">Active Workers</p>
          <p className="text-3xl font-bold text-green-700">{activeCount}</p>
        </Link>

        <Link
          to="/attendance"
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-gray-500">Present Today</p>
          <p className="text-3xl font-bold text-green-700">
            {presentCount}
            <span className="text-base text-gray-400">/{attendanceCount}</span>
          </p>
        </Link>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-green-900">
            Today's Tasks
            <span className="text-sm font-normal text-gray-400 ml-2">
              {doneTasks}/{totalTasks} done
            </span>
          </h3>
          <Link
            to="/tasks"
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            Manage →
          </Link>
        </div>

        {totalTasks === 0 ? (
          <p className="text-sm text-gray-400 py-2">No tasks for today.</p>
        ) : (
          <div className="space-y-2">
            {tasks?.map((task: any) => {
              const assigned = getAssignedWorkers(task.id)
              return (
                <div
                  key={task.id}
                  className={`rounded-lg p-3 border ${
                    task.status === 'done'
                      ? 'bg-green-50 border-green-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] shrink-0 ${
                          task.status === 'done'
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {task.status === 'done' && '✓'}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            task.status === 'done'
                              ? 'line-through text-gray-400'
                              : 'text-green-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.is_contract && (
                          <p className="text-xs text-orange-600">
                            ₹{Number(task.contract_amount).toLocaleString('en-IN')}
                            {' · '}
                            {task.contract_type === 'per-worker' ? 'per worker' : 'split'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {assigned.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-6">
                      {assigned.map((w: any) => (
                        <span
                          key={w.id}
                          className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {assigned.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      No workers assigned
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Weekly Calendar */}
      <WeeklyCalendar />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
        <h3 className="font-semibold text-green-900 mb-2">Quick Actions</h3>
        <div className="flex flex-col gap-2">
          <Link
            to="/attendance"
            className="bg-green-600 text-white rounded-lg px-4 py-3 text-center font-medium hover:bg-green-700 transition-colors"
          >
            Mark Today's Attendance
          </Link>
          <Link
            to="/tasks"
            className="bg-green-100 text-green-800 rounded-lg px-4 py-3 text-center font-medium hover:bg-green-200 transition-colors"
          >
            Manage Today's Tasks
          </Link>
        </div>
      </div>
    </div>
  )
}
