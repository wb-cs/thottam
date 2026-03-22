import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface LoadingState {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

const LoadingContext = createContext<LoadingState | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  const startLoading = useCallback(() => setCount((c) => c + 1), [])
  const stopLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), [])

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setCount((c) => c + 1)
      try {
        return await fn()
      } finally {
        setCount((c) => Math.max(0, c - 1))
      }
    },
    []
  )

  return (
    <LoadingContext.Provider
      value={{ isLoading: count > 0, startLoading, stopLoading, withLoading }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}
