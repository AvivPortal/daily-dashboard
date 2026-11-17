import api from './api'
import type { Note } from '../types'

export const noteService = {
  getAll: (search?: string) =>
    api.get<Note[]>('/notes', { params: search ? { search } : {} }).then((r) => r.data),
  create: (data: Partial<Note>) => api.post<Note>('/notes', data).then((r) => r.data),
  update: (id: string, data: Partial<Note>) => api.put<Note>(`/notes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/notes/${id}`),
}
