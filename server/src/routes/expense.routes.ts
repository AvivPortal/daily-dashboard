import { Router } from 'express'
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } from '../controllers/expense.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/', getExpenses)
router.post('/', createExpense)
router.get('/summary', getExpenseSummary)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

export default router
