import { Router } from 'express'
import { getStudentReport, getDefaulters, getMonthlyClassReport, getAbuseList } from '../controllers/report.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/student/:studentId', requireAuth(['FACULTY', 'ADMIN']), getStudentReport)
router.get('/defaulters/:classId', requireAuth(['FACULTY', 'ADMIN']), getDefaulters)
router.get(
    '/class/:classId/month/:year/:month',
    requireAuth(['FACULTY', 'ADMIN']),
    getMonthlyClassReport
)
router.get('/abuse', requireAuth(['ADMIN']), getAbuseList)

export default router