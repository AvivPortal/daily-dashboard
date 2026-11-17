import { Router } from 'express'
import { getHabits, createHabit, updateHabit, deleteHabit, toggleHabitLog } from '../controllers/habit.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/', getHabits)
router.post('/', createHabit)
router.put('/:id', updateHabit)
router.delete('/:id', deleteHabit)
router.post('/:id/log', toggleHabitLog)

export default router
