import { Router } from 'express'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'
import facultyRoutes from './faculty.routes.js'
import attendanceRoutes from './attendance.routes.js'
import reportRoutes from './report.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/faculty', facultyRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/reports', reportRoutes)

export default router
