import { Router } from 'express'
import { getAttendance, getOverallPercentage, getAttendanceHistory, getLeaderboard, getAchievements } from '../controllers/student.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Student
 *     description: Student attendance operations
 */

/**
 * @swagger
 * /student/attendance:
 *   get:
 *     summary: Get subject-wise attendance for logged-in student
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: List of subjects with attendance stats
 */
router.get('/attendance', requireAuth(['STUDENT']), getAttendance)

/**
 * @swagger
 * /student/attendance/percentage:
 *   get:
 *     summary: Get overall attendance percentage
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: Overall statistics
 */
router.get('/attendance/percentage', requireAuth(['STUDENT']), getOverallPercentage)

/**
 * @swagger
 * /student/attendance/history:
 *   get:
 *     summary: Get detailed attendance history
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: Attendance history list
 */
router.get('/attendance/history', requireAuth(['STUDENT']), getAttendanceHistory)

/**
 * @swagger
 * /student/leaderboard:
 *   get:
 *     summary: Get class leaderboard
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class leaderboard retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/leaderboard', requireAuth(['STUDENT']), getLeaderboard)

/**
 * @swagger
 * /student/achievements:
 *   get:
 *     summary: Get student achievements
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/achievements', requireAuth(['STUDENT']), getAchievements)

export default router
