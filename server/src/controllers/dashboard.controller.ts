import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalExpenses, doneTasks, totalJobs, habits, totalNotes] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
      prisma.jobApplication.count({ where: { userId } }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          logs: {
            where: { date: { gte: today } },
          },
        },
      }),
      prisma.note.count({ where: { userId } }),
    ])

    const habitsTotal = habits.length
    const habitsDoneToday = habits.filter((h: { logs: unknown[] }) => h.logs.length > 0).length

    const recentExpenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'DONE' },
        dueDate: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    const jobPipeline = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    })

    res.json({
      kpis: {
        totalExpensesThisMonth: totalExpenses._sum.amount || 0,
        tasksDone: doneTasks,
        jobsApplied: totalJobs,
        habitsTotal,
        habitsDoneToday,
        totalNotes,
      },
      recentExpenses,
      upcomingTasks,
      jobPipeline,
    })
  } catch (err) {
    next(err)
  }
}
