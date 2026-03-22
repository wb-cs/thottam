import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useLoading } from './LoadingContext'

export function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const { startLoading, stopLoading } = useLoading()

  const refetch = useCallback(async () => {
    setLoading(true)
    startLoading()
    try {
      const { data, error } = await queryFn()
      if (error) console.error('Query error:', error)
      setData(data)
    } finally {
      setLoading(false)
      stopLoading()
    }
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, refetch }
}

// Typed helpers for common queries
export function useWorkers(status?: 'active' | 'inactive') {
  return useSupabaseQuery(() => {
    let q = supabase.from('workers').select('*').order('name')
    if (status) q = q.eq('status', status)
    return q
  }, [status])
}

export function useWorkDaysByDate(date: string) {
  return useSupabaseQuery(
    () => supabase.from('work_days').select('*').eq('date', date),
    [date]
  )
}

export function useWorkDaysByRange(startDate: string, endDate: string) {
  return useSupabaseQuery(
    () =>
      supabase
        .from('work_days')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate),
    [startDate, endDate]
  )
}

export function useTasksByDate(date: string) {
  return useSupabaseQuery(
    () => supabase.from('tasks').select('*').eq('date', date),
    [date]
  )
}

export function useWorkDayTasksByWorkDayIds(workDayIds: number[]) {
  return useSupabaseQuery(
    () => {
      if (workDayIds.length === 0)
        return Promise.resolve({ data: [] as never[], error: null })
      return supabase
        .from('work_day_tasks')
        .select('*')
        .in('work_day_id', workDayIds)
    },
    [workDayIds.join(',')]
  )
}

export function useWorkDayTasksByTaskIds(taskIds: number[]) {
  return useSupabaseQuery(
    () => {
      if (taskIds.length === 0)
        return Promise.resolve({ data: [] as never[], error: null })
      return supabase
        .from('work_day_tasks')
        .select('*')
        .in('task_id', taskIds)
    },
    [taskIds.join(',')]
  )
}
