import api from './api'
import type { Task } from '../types'

export const taskService = {
  getAll: () => api.get<Task[]>('/tasks').then((r) => r.data),
  create: (data: Partial<Task>) => api.post<Task>('/tasks', data).then((r) => r.data),
  update: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}
