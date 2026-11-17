import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { generateLinkToken, getTelegramStatus, unlinkTelegram } from '../controllers/telegram.controller'

const router = Router()

router.use(authenticate)
router.post('/link', generateLinkToken)
router.get('/status', getTelegramStatus)
router.delete('/unlink', unlinkTelegram)

export default router
