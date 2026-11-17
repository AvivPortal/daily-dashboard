const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN) return
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

let pollingOffset = 0
let pollingActive = false

export function startTelegramPolling(onStart: (chatId: string, token: string) => Promise<void>) {
  if (!BOT_TOKEN || pollingActive) return
  pollingActive = true

  const poll = async () => {
    if (!pollingActive) return
    try {
      const res = await fetch(`${API_BASE}/getUpdates?offset=${pollingOffset}&timeout=30&allowed_updates=["message"]`)
      const data = (await res.json()) as { ok: boolean; result: TgUpdate[] }
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1
          const msg = update.message
          if (!msg?.text) continue
          const match = msg.text.match(/^\/start\s+([A-Z0-9]{6})$/i)
          if (match) {
            await onStart(String(msg.chat.id), match[1].toUpperCase())
          }
        }
      }
    } catch {
      // network error — retry
    }
    setTimeout(poll, 1000)
  }

  poll()
}

interface TgUpdate {
  update_id: number
  message?: { chat: { id: number }; text?: string }
}
