import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query
    const notes = await prisma.note.findMany({
      where: {
        userId: req.userId,
        ...(search
          ? {
              OR: [
                { title: { contains: String(search), mode: 'insensitive' } },
                { content: { contains: String(search), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })
    res.json(notes)
  } catch (err) {
    next(err)
  }
}

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, tags, color } = req.body
    if (!title) throw new ApiError(400, 'title required')

    const note = await prisma.note.create({
      data: {
        userId: req.userId!,
        title,
        content: content || '',
        tags: tags || [],
        color: color || '#ffffff',
      },
    })
    res.status(201).json(note)
  } catch (err) {
    next(err)
  }
}

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.note.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Note not found')

    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags,
        isPinned: req.body.isPinned,
        color: req.body.color,
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const existing = await prisma.note.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Note not found')

    await prisma.note.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
