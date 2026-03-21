import { useLiveQuery } from 'dexie-react-hooks'
import dayjs from 'dayjs'
import { db } from '../lib/db'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const today = dayjs().format('YYYY-MM-DD')

  const activeWorkers = useLiveQuery(() =>
    db.workers.where('status').equals('active').count()
  )

  const todayAttendance = useLiveQuery(() =>
    db.workDays.where('date').equals(today).count()
  )

  const todayPresent = useLiveQuery(() =>
    db.workDays
      .where('date')
      .equals(today)
      .filter((wd) => wd.attendance === 'present' || wd.attendance === 'half-day')
      .count()
  )

  const todayTasks = useLiveQuery(() =>
    db.tasks.where('date').equals(today).count()
  )

  const todayTasksDone = useLiveQuery(() =>
    db.tasks
      .where('date')
      .equals(today)
      .filter((t) => t.status === 'done')
      .count()
  )

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
          <p className="text-3xl font-bold text-green-700">{activeWorkers ?? 0}</p>
        </Link>

        <Link
          to="/attendance"
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-gray-500">Present Today</p>
          <p className="text-3xl font-bold text-green-700">
            {todayPresent ?? 0}
            <span className="text-base text-gray-400">
              /{todayAttendance ?? 0}
            </span>
          </p>
        </Link>

        <Link
          to="/tasks"
          className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow col-span-2"
        >
          <p className="text-sm text-gray-500">Today's Tasks</p>
          <p className="text-3xl font-bold text-green-700">
            {todayTasksDone ?? 0}
            <span className="text-base text-gray-400">
              /{todayTasks ?? 0} completed
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
