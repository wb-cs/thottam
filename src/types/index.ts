export interface Worker {
  id?: number
  name: string
  phone: string
  role: string
  dailyRate: number
  status: 'active' | 'inactive'
  createdAt: string
}

export type AttendanceStatus = 'present' | 'half-day' | 'absent'

export interface WorkDay {
  id?: number
  workerId: number
  date: string // YYYY-MM-DD
  attendance: AttendanceStatus
  overtimeHours: number
  notes: string
}

export interface Task {
  id?: number
  date: string // YYYY-MM-DD
  title: string
  description: string
  status: 'pending' | 'done'
  is_contract: boolean
  contract_amount: number
  contract_type: 'per-worker' | 'split'
}

export interface WorkDayTask {
  id?: number
  workDayId: number
  taskId: number
}
