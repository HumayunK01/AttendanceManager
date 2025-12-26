import { Router } from 'express'
import facultyRoutes from './faculty.routes.js'
import attendanceRoutes from './attendance.routes.js'

const router = Router()

router.use('/faculty', facultyRoutes)
router.use('/attendance', attendanceRoutes)

export default router
