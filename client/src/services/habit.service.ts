import api from './api'
import type { Habit } from '../types'

export const habitService = {
  getAll: () => api.get<Habit[]>('/habits').then((r) => r.data),
  create: (data: Partial<Habit>) => api.post<Habit>('/habits', data).then((r) => r.data),
  update: (id: string, data: Partial<Habit>) => api.put<Habit>(`/habits/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/habits/${id}`),
  toggleLog: (id: string, date: string) =>
    api.post<{ completed: boolean }>(`/habits/${id}/log`, { date }).then((r) => r.data),
}
