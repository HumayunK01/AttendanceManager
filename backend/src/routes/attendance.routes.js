import { Router } from 'express'
import { createAttendanceSession, getSessionStudents, markAttendance } from '../controllers/attendance.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { sql } from '../config/db.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Faculty
 *     description: Faculty attendance operations
 */

/**
 * @swagger
 * /attendance/session:
 *   post:
 *     summary: Create attendance session for lecture
 *     tags: [Faculty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [timetableSlotId]
 *             properties:
 *               timetableSlotId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Session created
 */
router.post('/session', requireAuth(['FACULTY']), createAttendanceSession)

/**
 * @swagger
 * /attendance/session/{sessionId}/students:
 *   get:
 *     summary: Get students for attendance session
 *     tags: [Faculty]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/session/:sessionId/students', requireAuth(['FACULTY']), getSessionStudents)

/**
 * @swagger
 * /attendance/mark:
 *   post:
 *     summary: Mark student attendance
 *     tags: [Faculty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, studentId, status, editedBy]
 *             properties:
 *               sessionId:
 *                 type: integer
 *               studentId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [P, A]
 *               editedBy:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance marked
 */
router.post('/mark', requireAuth(['FACULTY']), markAttendance)

/**
 * @swagger
 * /attendance/session/{id}/lock:
 *   post:
 *     summary: Lock attendance session
 *     tags: [Faculty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session locked
 */
router.post('/session/:id/lock', requireAuth(['FACULTY']), async (req, res) => {
  const { id } = req.params
  await sql`UPDATE attendance_sessions SET locked = true WHERE id = ${id}`
  res.json({ locked: true })
})

/**
 * @swagger
 * /attendance/session/{id}/archive:
 *   post:
 *     summary: Archive attendance session
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session archived
 */
router.post('/session/:id/archive', requireAuth(['ADMIN']), async (req, res) => {
  const { id } = req.params
  await sql`UPDATE attendance_sessions SET is_archived = true WHERE id = ${id}`
  res.json({ archived: true })
})

export default router
