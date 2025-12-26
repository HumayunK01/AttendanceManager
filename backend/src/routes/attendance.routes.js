import { Router } from 'express'
import { createAttendanceSession, getSessionStudents, markAttendance } from '../controllers/attendance.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { sql } from '../config/db.js'

const router = Router()

router.post('/session', requireAuth(['FACULTY']), createAttendanceSession)
router.get('/session/:sessionId/students', requireAuth(['FACULTY']), getSessionStudents)
router.post('/mark', requireAuth(['FACULTY']), markAttendance)

router.post('/session/:id/lock', requireAuth(['FACULTY']), async (req, res) => {
  const { id } = req.params
  await sql`UPDATE attendance_sessions SET locked = true WHERE id = ${id}`
  res.json({ locked: true })
})

export default router

router.post('/session/:id/archive', requireAuth(['ADMIN']), async (req, res) => {
  const { id } = req.params
  await sql`UPDATE attendance_sessions SET is_archived = true WHERE id = ${id}`
  res.json({ archived: true })
})
