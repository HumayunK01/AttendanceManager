import { Router } from 'express'
import { createAttendanceSession, getSessionStudents, markAttendance } from '../controllers/attendance.controller.js'
import { sql } from '../config/db.js'

const router = Router()

router.post('/session', createAttendanceSession)
router.get('/session/:sessionId/students', getSessionStudents)
router.post('/mark', markAttendance)

router.post('/session/:id/lock', async (req, res) => {
  const { id } = req.params
  await sql`UPDATE attendance_sessions SET locked = true WHERE id = ${id}`
  res.json({ locked: true })
})

export default router
