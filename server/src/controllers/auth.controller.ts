import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name: string }

    if (!email || !password || !name) {
      throw new ApiError(400, 'Email, password, and name are required')
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new ApiError(409, 'Email already registered')

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email })

    res.status(201).json({ user, accessToken, refreshToken })
  } catch (err) {
    next(err)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) throw new ApiError(400, 'Email and password required')

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new ApiError(401, 'Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new ApiError(401, 'Invalid credentials')

    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email })

    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string }
    if (!refreshToken) throw new ApiError(400, 'Refresh token required')

    const payload = verifyRefreshToken(refreshToken)
    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email })

    res.json({ accessToken })
  } catch {
    next(new ApiError(401, 'Invalid refresh token'))
  }
}

export const me = async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!user) throw new ApiError(404, 'User not found')
    res.json(user)
  } catch (err) {
    next(err)
  }
}
