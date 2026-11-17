import api from './api'

export const telegramService = {
  async getStatus(): Promise<{ connected: boolean }> {
    const res = await api.get('/telegram/status')
    return res.data
  },
  async generateLinkToken(): Promise<{ token: string; botName: string }> {
    const res = await api.post('/telegram/link')
    return res.data
  },
  async unlink(): Promise<void> {
    await api.delete('/telegram/unlink')
  },
}
