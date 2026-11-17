import api from './api'
import type { Expense, ExpenseSummary } from '../types'

export const expenseService = {
  getAll: (params?: { month?: number; year?: number }) =>
    api.get<Expense[]>('/expenses', { params }).then((r) => r.data),

  getSummary: (year?: number) =>
    api.get<ExpenseSummary>('/expenses/summary', { params: { year } }).then((r) => r.data),

  create: (data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) =>
    api.post<Expense>('/expenses', data).then((r) => r.data),

  update: (id: string, data: Partial<Expense>) =>
    api.put<Expense>(`/expenses/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/expenses/${id}`),
}
