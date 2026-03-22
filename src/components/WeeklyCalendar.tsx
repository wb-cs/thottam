import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { supabase } from '../lib/supabase'
import { useWorkers, useSupabaseQuery } from '../lib/useSupabaseQuery'

dayjs.extend(isoWeek)

export default function WeeklyCalendar() {
  const navigate = useNavigate()
  const [weekOf, setWeekOf] = useState(
    dayjs().startOf('isoWeek').format('YYYY-MM-DD')
  )

  const weekStart = dayjs(weekOf).startOf('isoWeek')
  const weekEnd = dayjs(weekOf).endOf('isoWeek')
  const days = Array.from({ length: 7 }, (_, i) =>
    weekStart.add(i, 'day').format('YYYY-MM-DD')
  )

  const { data: workers } = useWorkers('active')
  const totalWorkers = workers?.length ?? 0

  const { data: weekTasks } = useSupabaseQuery(
    () =>
      supabase
        .from('tasks')
        .select('*')
        .gte('date', weekStart.format('YYYY-MM-DD'))
        .lte('date', weekEnd.format('YYYY-MM-DD')),
    [weekOf]
  )

  const { data: weekWorkDays } = useSupabaseQuery(
    () =>
      supabase
        .from('work_days')
        .select('*')
        .gte('date', weekStart.format('YYYY-MM-DD'))
        .lte('date', weekEnd.format('YYYY-MM-DD')),
    [weekOf]
  )

  const today = dayjs().format('YYYY-MM-DD')

  function getDayStats(date: string) {
    const present =
      weekWorkDays?.filter(
        (wd: any) =>
          wd.date === date &&
          (wd.attendance === 'present' || wd.attendance === 'half-day')
      ).length ?? 0

    const dateTasks = weekTasks?.filter((t: any) => t.date === date) ?? []
    const total = dateTasks.length
    const done = dateTasks.filter((t: any) => t.status === 'done').length

    return { present, total, done }
  }

  function getStatusColor(done: number, total: number) {
    if (total === 0) return 'bg-gray-100'
    if (done === total) return 'bg-green-100'
    if (done > 0) return 'bg-yellow-100'
    return 'bg-red-50'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-3">
      {/* Week header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() =>
            setWeekOf(
              dayjs(weekOf).subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD')
            )
          }
          className="text-gray-400 hover:text-green-700 text-sm px-1"
        >
          ←
        </button>
        <p className="text-xs font-semibold text-green-900">
          {weekStart.format('MMM D')} – {weekEnd.format('MMM D')}
        </p>
        <button
          onClick={() =>
            setWeekOf(
              dayjs(weekOf).add(1, 'week').startOf('isoWeek').format('YYYY-MM-DD')
            )
          }
          className="text-gray-400 hover:text-green-700 text-sm px-1"
        >
          →
        </button>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const d = dayjs(date)
          const { present, total, done } = getDayStats(date)
          const isToday = date === today
          const isPast = d.isBefore(dayjs(), 'day')

          return (
            <button
              key={date}
              onClick={() => navigate(`/attendance?date=${date}`)}
              className={`rounded-lg p-1.5 text-center transition-colors ${
                isToday
                  ? 'ring-2 ring-green-500'
                  : ''
              } ${getStatusColor(done, total)} hover:opacity-80`}
            >
              <p className={`text-[10px] font-medium ${
                isToday ? 'text-green-700' : isPast ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {d.format('dd')}
              </p>
              <p className={`text-sm font-bold ${
                isToday ? 'text-green-800' : 'text-gray-700'
              }`}>
                {d.format('D')}
              </p>
              <p className="text-[10px] text-blue-600 font-medium">
                {present}/{totalWorkers}
              </p>
              <p className={`text-[10px] font-medium ${
                total === 0
                  ? 'text-gray-300'
                  : done === total
                    ? 'text-green-600'
                    : 'text-orange-600'
              }`}>
                {total === 0 ? '–' : `${done}/${total}`}
              </p>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-2 text-[10px] text-gray-400">
        <span>
          <span className="text-blue-600">■</span> present
        </span>
        <span>
          <span className="text-orange-600">■</span> tasks
        </span>
      </div>
    </div>
  )
}
