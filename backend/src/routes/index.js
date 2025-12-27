import { Router } from 'express'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'
import facultyRoutes from './faculty.routes.js'
import attendanceRoutes from './attendance.routes.js'
import reportRoutes from './report.routes.js'
import resourceRoutes from './resource.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import studentRoutes from './student.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/faculty', facultyRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/reports', reportRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/student', studentRoutes)
router.use('/', resourceRoutes) // Resource routes at root level

export default router
