import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { sendTelegramMessage } from '../services/telegram.service'

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const generateLinkToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = generateToken()
    await prisma.user.update({
      where: { id: req.userId },
      data: { telegramLinkToken: token },
    })
    const botName = process.env.TELEGRAM_BOT_NAME || 'YourDashboardBot'
    res.json({ token, botName })
  } catch (err) {
    next(err)
  }
}

export const getTelegramStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramChatId: true },
    })
    res.json({ connected: !!user?.telegramChatId })
  } catch (err) {
    next(err)
  }
}

export const unlinkTelegram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { telegramChatId: null, telegramLinkToken: null },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// Called by polling loop when user sends /start TOKEN
export async function handleTelegramStart(chatId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { telegramLinkToken: token } })
  if (!user) {
    await sendTelegramMessage(chatId, '❌ קוד לא תקין. נסה שוב מהאפליקציה.')
    return
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: chatId, telegramLinkToken: null },
  })
  await sendTelegramMessage(chatId, `✅ חיבור בוצע בהצלחה!\n\nשלום ${user.name}! מעכשיו תקבל תזכורות על המשימות שלך כאן.`)
}
