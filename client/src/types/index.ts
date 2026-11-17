export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user: User
}

// Expense
export type ExpenseCategory =
  | 'שכר דירה'
  | 'גן / חינוך'
  | 'מזון'
  | 'מסעדות'
  | 'תחבורה'
  | 'בריאות'
  | 'בידור'
  | 'קניות'
  | 'חשבונות'
  | 'אחר'

export interface Expense {
  id: string
  userId: string
  amount: number
  category: string
  description?: string
  date: string
  isRecurring: boolean
  createdAt: string
}

export interface ExpenseSummary {
  byMonth: Record<number, number>
  byCategory: Record<string, number>
  totalThisMonth: number
}

// Task
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: string
  tags: string[]
  position: number
  createdAt: string
  updatedAt: string
}

// Job
export type JobStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED'

export interface JobApplication {
  id: string
  userId: string
  company: string
  position: string
  status: JobStatus
  appliedDate: string
  link?: string
  notes?: string
  nextStep?: string
  createdAt: string
  updatedAt: string
}

export interface JobStats {
  total: number
  byStatus: Record<JobStatus, number>
  interviewRate: number
  responseRate: number
}

// Habit
export type HabitFrequency = 'DAILY' | 'WEEKLY'

export interface HabitLog {
  id: string
  habitId: string
  date: string
  completed: boolean
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  frequency: HabitFrequency
  color: string
  icon: string
  createdAt: string
  logs: HabitLog[]
}

// Note
export interface Note {
  id: string
  userId: string
  title: string
  content: string
  tags: string[]
  isPinned: boolean
  color: string
  createdAt: string
  updatedAt: string
}

// Goal
export interface Goal {
  id: string
  userId: string
  title: string
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string
  category?: string
  createdAt: string
  updatedAt: string
}

// Dashboard
export interface DashboardSummary {
  kpis: {
    totalExpensesThisMonth: number
    tasksDone: number
    jobsApplied: number
    habitsTotal: number
    habitsDoneToday: number
    totalNotes: number
  }
  recentExpenses: Expense[]
  upcomingTasks: Task[]
  jobPipeline: { status: JobStatus; _count: number }[]
}
