import api from './api'
import type { Goal } from '../types'

export const goalService = {
  getAll: () => api.get<Goal[]>('/goals').then((r) => r.data),
  create: (data: Partial<Goal>) => api.post<Goal>('/goals', data).then((r) => r.data),
  update: (id: string, data: Partial<Goal>) => api.put<Goal>(`/goals/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/goals/${id}`),
}
