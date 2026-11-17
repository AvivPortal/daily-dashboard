import api from './api'
import type { JobApplication, JobStats } from '../types'

export const jobService = {
  getAll: () => api.get<JobApplication[]>('/jobs').then((r) => r.data),
  getStats: () => api.get<JobStats>('/jobs/stats').then((r) => r.data),
  create: (data: Partial<JobApplication>) => api.post<JobApplication>('/jobs', data).then((r) => r.data),
  update: (id: string, data: Partial<JobApplication>) => api.put<JobApplication>(`/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
}
