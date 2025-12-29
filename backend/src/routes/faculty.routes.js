import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
    getTodayTimetable,
    getAttendanceSessions,
    exportSessionCSV,
    exportSessionPDF,
    getLeaderboardStats,
    getAttendanceRecords,
    getClassBatches,
    getFullTimetable
} from '../controllers/faculty.controller.js'

const router = Router()

router.get('/today-timetable', requireAuth(['FACULTY']), getTodayTimetable)
router.get('/attendance-sessions', requireAuth(['FACULTY']), getAttendanceSessions)
router.get('/attendance-sessions/:sessionId/export/csv', requireAuth(['FACULTY']), exportSessionCSV)
router.get('/attendance-sessions/:sessionId/export/pdf', requireAuth(['FACULTY']), exportSessionPDF)
router.get('/leaderboard', requireAuth(['FACULTY']), getLeaderboardStats)
router.get('/attendance-records', requireAuth(['FACULTY']), getAttendanceRecords)
router.get('/classes/:classId/batches', requireAuth(['FACULTY']), getClassBatches)
router.get('/timetable', requireAuth(['FACULTY']), getFullTimetable)

export default router
