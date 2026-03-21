import Dexie, { type Table } from 'dexie'
import type { Worker, WorkDay, Task, WorkDayTask } from '../types'

export class ThottamDB extends Dexie {
  workers!: Table<Worker>
  workDays!: Table<WorkDay>
  tasks!: Table<Task>
  workDayTasks!: Table<WorkDayTask>

  constructor() {
    super('thottam')
    this.version(1).stores({
      workers: '++id, name, status',
      workDays: '++id, workerId, date, [workerId+date]',
      tasks: '++id, date, status',
      workDayTasks: '++id, workDayId, taskId, [workDayId+taskId]',
    })
  }
}

export const db = new ThottamDB()
