import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { db } from '../lib/db'
import type { Worker, WorkDay } from '../types'

dayjs.extend(isoWeek)

type ViewMode = 'weekly' | 'monthly'

function getWeekLabel(date: string) {
  const start = dayjs(date).startOf('isoWeek')
  const end = dayjs(date).endOf('isoWeek')
  return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`
}

function computeSummary(worker: Worker, wds: WorkDay[]) {
  const presentDays = wds.filter((wd) => wd.attendance === 'present').length
  const halfDays = wds.filter((wd) => wd.attendance === 'half-day').length
  const totalOvertime = wds.reduce((sum, wd) => sum + wd.overtimeHours, 0)

  const effectiveDays = presentDays + halfDays * 0.5
  const dailyWage = effectiveDays * worker.dailyRate
  const overtimeRate = worker.dailyRate / 8
  const overtimeWage = totalOvertime * overtimeRate * 1.5

  return {
    worker,
    presentDays,
    halfDays,
    totalOvertime,
    effectiveDays,
    dailyWage,
    overtimeWage,
    totalWage: dailyWage + overtimeWage,
  }
}

export default function Wages() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [weekOf, setWeekOf] = useState(dayjs().startOf('isoWeek').format('YYYY-MM-DD'))

  const workers = useLiveQuery(() =>
    db.workers.where('status').equals('active').toArray()
  )

  const startDate =
    viewMode === 'monthly'
      ? dayjs(month).startOf('month').format('YYYY-MM-DD')
      : dayjs(weekOf).startOf('isoWeek').format('YYYY-MM-DD')

  const endDate =
    viewMode === 'monthly'
      ? dayjs(month).endOf('month').format('YYYY-MM-DD')
      : dayjs(weekOf).endOf('isoWeek').format('YYYY-MM-DD')

  const workDays = useLiveQuery(
    () =>
      db.workDays
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray(),
    [startDate, endDate]
  )

  const summaries =
    workers
      ?.map((w) => {
        const wds = workDays?.filter((wd) => wd.workerId === w.id) ?? []
        return computeSummary(w, wds)
      })
      .filter((s) => s.effectiveDays > 0 || s.totalOvertime > 0) ?? []

  const grandTotal = summaries.reduce((sum, s) => sum + s.totalWage, 0)

  function prevPeriod() {
    if (viewMode === 'monthly') {
      setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))
    } else {
      setWeekOf(dayjs(weekOf).subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD'))
    }
  }

  function nextPeriod() {
    if (viewMode === 'monthly') {
      setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))
    } else {
      setWeekOf(dayjs(weekOf).add(1, 'week').startOf('isoWeek').format('YYYY-MM-DD'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-900">Wages</h2>
        <span className="text-sm text-gray-500">
          Total: ₹{grandTotal.toLocaleString('en-IN')}
        </span>
      </div>

      {/* View mode toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            viewMode === 'weekly'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
            viewMode === 'monthly'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevPeriod}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          ←
        </button>
        {viewMode === 'monthly' ? (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          />
        ) : (
          <input
            type="date"
            value={weekOf}
            onChange={(e) =>
              setWeekOf(
                dayjs(e.target.value).startOf('isoWeek').format('YYYY-MM-DD')
              )
            }
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          />
        )}
        <button
          onClick={nextPeriod}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          →
        </button>
      </div>

      <p className="text-sm text-green-700 font-medium">
        {viewMode === 'monthly'
          ? dayjs(month).format('MMMM YYYY')
          : getWeekLabel(weekOf)}
      </p>

      {summaries.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No attendance data for this period.
        </p>
      )}

      <div className="space-y-3">
        {summaries.map((s) => (
          <div
            key={s.worker.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-green-900">
                  {s.worker.name}
                </p>
                <p className="text-xs text-gray-400">
                  ₹{s.worker.dailyRate}/day
                </p>
              </div>
              <p className="text-xl font-bold text-green-700">
                ₹{s.totalWage.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-gray-500">Full</p>
                <p className="font-semibold text-green-800">
                  {s.presentDays}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-gray-500">Half</p>
                <p className="font-semibold text-yellow-800">
                  {s.halfDays}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-gray-500">OT hrs</p>
                <p className="font-semibold text-blue-800">
                  {s.totalOvertime}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-500">Eff. days</p>
                <p className="font-semibold text-gray-800">
                  {s.effectiveDays}
                </p>
              </div>
            </div>

            {s.overtimeWage > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Includes ₹{s.overtimeWage.toLocaleString('en-IN')} overtime
                (1.5x rate)
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
