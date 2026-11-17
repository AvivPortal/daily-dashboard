import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@dashboard.com' },
    update: {},
    create: {
      email: 'demo@dashboard.com',
      passwordHash,
      name: 'Demo User',
    },
  })

  console.log(`Seeded user: ${user.email}`)

  await prisma.expense.createMany({
    data: [
      { userId: user.id, amount: 3500, category: 'שכר דירה', date: new Date(), isRecurring: true },
      { userId: user.id, amount: 800, category: 'גן / חינוך', date: new Date(), isRecurring: true },
      { userId: user.id, amount: 250, category: 'מסעדות', description: 'ארוחת צהריים עם חברים', date: new Date() },
    ],
    skipDuplicates: true,
  })

  await prisma.task.createMany({
    data: [
      { userId: user.id, title: 'לעדכן קורות חיים', priority: 'HIGH', status: 'TODO' },
      { userId: user.id, title: 'לענות למייל של HR', priority: 'MEDIUM', status: 'IN_PROGRESS' },
      { userId: user.id, title: 'הכין פרויקט פורטפוליו', priority: 'HIGH', status: 'DONE' },
    ],
    skipDuplicates: true,
  })

  await prisma.jobApplication.createMany({
    data: [
      { userId: user.id, company: 'Google', position: 'Frontend Developer', status: 'INTERVIEW' },
      { userId: user.id, company: 'Meta', position: 'React Developer', status: 'APPLIED' },
      { userId: user.id, company: 'StartupXYZ', position: 'Full Stack Engineer', status: 'SCREENING' },
    ],
    skipDuplicates: true,
  })

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: 'פעילות גופנית',
      color: '#84a98c',
      icon: 'dumbbell',
      frequency: 'DAILY',
    },
  })

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit.id, date: today } },
    update: {},
    create: { habitId: habit.id, date: today },
  })

  await prisma.note.createMany({
    data: [
      { userId: user.id, title: 'רעיונות לפרויקט', content: '1. Dashboard\n2. API integration\n3. Auth flow', tags: ['פרויקט'], isPinned: true, color: '#fef9c3' },
      { userId: user.id, title: 'מה לעשות השבוע', content: 'לסיים את תיק העבודות\nלשלוח קורות חיים', tags: ['משימות'], color: '#dcfce7' },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete ✅')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
