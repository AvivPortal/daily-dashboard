import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'

export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(goals)
  } catch (err) {
    next(err)
  }
}

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, targetValue, unit, currentValue, deadline, category } = req.body
    if (!title || !targetValue || !unit) throw new ApiError(400, 'title, targetValue, unit required')

    const goal = await prisma.goal.create({
      data: {
        userId: req.userId!,
        title,
        targetValue: parseFloat(targetValue),
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        unit,
        deadline: deadline ? new Date(deadline) : null,
        category: category || null,
      },
    })
    res.status(201).json(goal)
  } catch (err) {
    next(err)
  }
}

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Goal not found')

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: req.body.title,
        targetValue: req.body.targetValue !== undefined ? parseFloat(req.body.targetValue) : undefined,
        currentValue: req.body.currentValue !== undefined ? parseFloat(req.body.currentValue) : undefined,
        unit: req.body.unit,
        deadline: req.body.deadline ? new Date(req.body.deadline) : req.body.deadline === null ? null : undefined,
        category: req.body.category,
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Goal not found')

    await prisma.goal.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
