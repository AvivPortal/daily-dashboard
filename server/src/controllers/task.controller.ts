import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(tasks)
  } catch (err) {
    next(err)
  }
}

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body
    if (!title) throw new ApiError(400, 'Title is required')

    const task = await prisma.task.create({
      data: {
        userId: req.userId!,
        title,
        description: description || null,
        status: (status as TaskStatus) || 'TODO',
        priority: (priority as Priority) || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
      },
    })
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.task.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Task not found')

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : req.body.dueDate === null ? null : undefined,
        tags: req.body.tags,
        position: req.body.position,
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.task.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Task not found')

    await prisma.task.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
