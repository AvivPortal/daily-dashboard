import cron from 'node-cron'
import { prisma } from '../utils/prisma'
import { sendTelegramMessage } from './telegram.service'

const CRON_INTERVAL_MINS = 5

function formatTimeLeft(ms: number): string {
  const totalMins = Math.round(ms / 60000)
  if (totalMins < 60) return `${totalMins} דקות`
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours < 24) return mins > 0 ? `${hours} שעות ו-${mins} דקות` : `${hours} שעות`
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours > 0 ? `${days} ימים ו-${remHours} שעות` : `${days} ימים`
}

async function sendDueReminders() {
  const now = new Date()
  const windowStart = new Date(now.getTime() - CRON_INTERVAL_MINS * 60 * 1000)

  const tasks = await prisma.task.findMany({
    where: {
      reminderEnabled: true,
      status: { not: 'DONE' },
      dueDate: { not: null },
    },
    include: {
      user: { select: { telegramChatId: true } },
      remindersSent: { select: { offsetMins: true } },
    },
  })

  for (const task of tasks) {
    if (!task.user.telegramChatId || !task.dueDate) continue
    const sentOffsets = new Set(task.remindersSent.map((r) => r.offsetMins))

    for (const offsetMins of task.reminderOffsets) {
      if (sentOffsets.has(offsetMins)) continue

      const reminderTime = new Date(task.dueDate.getTime() - offsetMins * 60 * 1000)

      if (reminderTime >= windowStart && reminderTime <= now) {
        const msLeft = task.dueDate.getTime() - now.getTime()
        const timeLeft = msLeft > 0 ? `בעוד ${formatTimeLeft(msLeft)}` : 'עכשיו!'

        const dueDateStr = task.dueDate.toLocaleDateString('he-IL', {
          day: 'numeric', month: 'long', year: 'numeric',
        })

        const text = [
          `⏰ <b>תזכורת למשימה!</b>`,
          ``,
          `📋 <b>${task.title}</b>`,
          task.description ? `📝 ${task.description}` : null,
          `📅 תאריך יעד: ${dueDateStr}`,
          `⏱ ${timeLeft}`,
        ].filter(Boolean).join('\n')

        try {
          await sendTelegramMessage(task.user.telegramChatId, text)
          await prisma.reminderSent.create({
            data: { taskId: task.id, offsetMins },
          })
        } catch {
          // log and continue
        }
      }
    }
  }
}

export function startReminderCron() {
  cron.schedule(`*/${CRON_INTERVAL_MINS} * * * *`, () => {
    sendDueReminders().catch(console.error)
  })
}
