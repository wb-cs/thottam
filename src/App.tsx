import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import Attendance from './pages/Attendance'
import Tasks from './pages/Tasks'
import Wages from './pages/Wages'

function AuthCallbackHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
          // Check if this is an invite/recovery flow from URL hash
          const hash = window.location.hash
          if (hash && (hash.includes('type=invite') || hash.includes('type=recovery'))) {
            navigate('/set-password', { replace: true })
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  return <>{children}</>
}

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-green-700 font-medium">Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/wages" element={<Wages />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LoginRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

function SetPasswordRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <SetPassword />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthCallbackHandler>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/set-password" element={<SetPasswordRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthCallbackHandler>
      </BrowserRouter>
    </AuthProvider>
  )
}
