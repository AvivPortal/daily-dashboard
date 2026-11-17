import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided'))
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired token'))
  }
}
