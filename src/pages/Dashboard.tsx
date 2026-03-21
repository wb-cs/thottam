import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { useWorkers, useWorkDaysByDate, useTasksByDate } from '../lib/useSupabaseQuery'

export default function Dashboard() {
  const today = dayjs().format('YYYY-MM-DD')

  const { data: workers } = useWorkers('active')
  const { data: workDays } = useWorkDaysByDate(today)
  const { data: tasks } = useTasksByDate(today)

  const activeCount = workers?.length ?? 0
  const presentCount =
    workDays?.filter(
      (wd: any) => wd.attendance === 'present' || wd.attendance === 'half-day'
    ).length ?? 0
  const attendanceCount = workDays?.length ?? 0
  const totalTasks = tasks?.length ?? 0
  const doneTasks = tasks?.filter((t: any) => t.status === 'done').length ?? 0

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

        <Link
          to="/tasks"
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow col-span-2"
        >
          <p className="text-sm text-gray-500">Today's Tasks</p>
          <p className="text-3xl font-bold text-green-700">
            {doneTasks}
            <span className="text-base text-gray-400">
              /{totalTasks} completed
            </span>
          </p>
        </Link>
      </div>

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
