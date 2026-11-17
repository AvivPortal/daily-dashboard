import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'
type HabitFrequency = 'DAILY' | 'WEEKLY'

export const getHabits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 90,
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json(habits)
  } catch (err) {
    next(err)
  }
}

export const createHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, frequency, color, icon } = req.body
    if (!name) throw new ApiError(400, 'name required')

    const habit = await prisma.habit.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        frequency: (frequency as HabitFrequency) || 'DAILY',
        color: color || '#84a98c',
        icon: icon || 'target',
      },
      include: { logs: true },
    })
    res.status(201).json(habit)
  } catch (err) {
    next(err)
  }
}

export const updateHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.habit.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Habit not found')

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        name: req.body.name,
        description: req.body.description,
        frequency: req.body.frequency,
        color: req.body.color,
        icon: req.body.icon,
      },
      include: { logs: true },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.habit.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Habit not found')

    await prisma.habit.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const toggleHabitLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.habit.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Habit not found')

    const { date } = req.body
    if (!date) throw new ApiError(400, 'date required')

    const logDate = new Date(date)
    logDate.setUTCHours(0, 0, 0, 0)

    const log = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: id, date: logDate } } })

    if (log) {
      await prisma.habitLog.delete({ where: { habitId_date: { habitId: id, date: logDate } } })
      res.json({ completed: false })
    } else {
      const newLog = await prisma.habitLog.create({ data: { habitId: id, date: logDate } })
      res.json({ completed: true, log: newLog })
    }
  } catch (err) {
    next(err)
  }
}
