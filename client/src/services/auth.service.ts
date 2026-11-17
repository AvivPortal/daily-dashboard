import api from './api'
import type { AuthResponse, User } from '../types'

export const authService = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
