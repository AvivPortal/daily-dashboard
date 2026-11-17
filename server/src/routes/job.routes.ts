import { Router } from 'express'
import { getJobs, createJob, updateJob, deleteJob, getJobStats } from '../controllers/job.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

router.get('/', getJobs)
router.post('/', createJob)
router.get('/stats', getJobStats)
router.put('/:id', updateJob)
router.delete('/:id', deleteJob)

export default router
