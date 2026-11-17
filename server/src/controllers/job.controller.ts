import { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { ApiError } from '../utils/ApiError'
import { AuthRequest } from '../middleware/auth.middleware'
type JobStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED'

export const getJobs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.jobApplication.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(jobs)
  } catch (err) {
    next(err)
  }
}

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { company, position, status, link, notes, nextStep } = req.body
    if (!company || !position) throw new ApiError(400, 'company and position required')

    const job = await prisma.jobApplication.create({
      data: {
        userId: req.userId!,
        company,
        position,
        status: (status as JobStatus) || 'APPLIED',
        link: link || null,
        notes: notes || null,
        nextStep: nextStep || null,
      },
    })
    res.status(201).json(job)
  } catch (err) {
    next(err)
  }
}

export const updateJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Job application not found')

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        company: req.body.company,
        position: req.body.position,
        status: req.body.status,
        link: req.body.link,
        notes: req.body.notes,
        nextStep: req.body.nextStep,
      },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export const deleteJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId: req.userId } })
    if (!existing) throw new ApiError(404, 'Job application not found')

    await prisma.jobApplication.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const getJobStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.jobApplication.findMany({ where: { userId: req.userId } })
    const total = jobs.length
    const byStatus = jobs.reduce((acc: Record<string, number>, j: { status: string }) => {
      acc[j.status] = (acc[j.status] || 0) + 1
      return acc
    }, {})
    const interviewRate = total > 0 ? ((byStatus['INTERVIEW'] || 0) / total) * 100 : 0
    const responseRate = total > 0
      ? (((byStatus['SCREENING'] || 0) + (byStatus['INTERVIEW'] || 0) + (byStatus['OFFER'] || 0) + (byStatus['REJECTED'] || 0)) / total) * 100
      : 0

    res.json({ total, byStatus, interviewRate: Math.round(interviewRate), responseRate: Math.round(responseRate) })
  } catch (err) {
    next(err)
  }
}
