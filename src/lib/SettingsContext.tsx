import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'

interface SettingsState {
  farmName: string
  loading: boolean
  updateFarmName: (name: string) => Promise<void>
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsState | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [farmName, setFarmName] = useState('Thottam')
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'farm_name')
      .single()
    if (data) setFarmName(data.value)
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function updateFarmName(name: string) {
    await supabase
      .from('settings')
      .update({ value: name })
      .eq('key', 'farm_name')
    setFarmName(name)
  }

  return (
    <SettingsContext.Provider value={{ farmName, loading, updateFarmName, refetch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
