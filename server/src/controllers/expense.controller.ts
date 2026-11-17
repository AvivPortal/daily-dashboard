import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query
    const where: Record<string, unknown> = { userId: req.userId }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59)
      where.date = { gte: start, lte: end }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    res.json(expenses)
  } catch (err) {
    next(err)
  }
}

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, category, description, date, isRecurring } = req.body
    if (!amount || !category || !date) throw new ApiError(400, 'amount, category, date required')

    const expense = await prisma.expense.create({
      data: {
        userId: req.userId!,
        amount: parseFloat(amount),
        category,
        description: description || null,
        date: new Date(date),
        isRecurring: isRecurring ?? false,
      },
    })
    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
}

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.expense.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Expense not found')

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : undefined,
        category: req.body.category,
        description: req.body.description,
        date: req.body.date ? new Date(req.body.date) : undefined,
        isRecurring: req.body.isRecurring,
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.expense.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Expense not found')

    await prisma.expense.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const getExpenseSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query
    const targetYear = Number(year) || new Date().getFullYear()

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31, 23, 59, 59),
        },
      },
    })

    const byMonth: Record<number, number> = {}
    const byCategory: Record<string, number> = {}

    expenses.forEach((e: { date: Date; amount: number; category: string }) => {
      const month = new Date(e.date).getMonth() + 1
      byMonth[month] = (byMonth[month] || 0) + e.amount
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })

    const totalThisMonth = expenses
      .filter((e: { date: Date; amount: number }) => new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((s: number, e: { amount: number }) => s + e.amount, 0)

    res.json({ byMonth, byCategory, totalThisMonth })
  } catch (err) {
    next(err)
  }
}
