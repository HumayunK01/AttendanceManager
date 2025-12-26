import { Router } from 'express'
import authRoutes from './auth.routes.js'
import facultyRoutes from './faculty.routes.js'
import attendanceRoutes from './attendance.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/faculty', facultyRoutes)
router.use('/attendance', attendanceRoutes)

export default router
