import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import authRoutes from './routes/auth.routes'
import expenseRoutes from './routes/expense.routes'
import taskRoutes from './routes/task.routes'
import jobRoutes from './routes/job.routes'
import habitRoutes from './routes/habit.routes'
import noteRoutes from './routes/note.routes'
import goalRoutes from './routes/goal.routes'
import dashboardRoutes from './routes/dashboard.routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
