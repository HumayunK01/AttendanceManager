import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
    getTodayTimetable,
    getAttendanceSessions,
    exportSessionCSV,
    exportSessionPDF
} from '../controllers/faculty.controller.js'

const router = Router()

router.get('/today-timetable', requireAuth(['FACULTY']), getTodayTimetable)
router.get('/attendance-sessions', requireAuth(['FACULTY']), getAttendanceSessions)
router.get('/attendance-sessions/:sessionId/export/csv', requireAuth(['FACULTY']), exportSessionCSV)
router.get('/attendance-sessions/:sessionId/export/pdf', requireAuth(['FACULTY']), exportSessionPDF)

export default router
