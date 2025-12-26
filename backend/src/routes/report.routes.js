import { Router } from 'express'
import { getStudentReport, getDefaulters, getMonthlyClassReport, getAbuseList } from '../controllers/report.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Attendance and student reports
 */

/**
 * @swagger
 * /report/student/{studentId}:
 *   get:
 *     summary: Get student attendance report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Attendance report
 */
router.get('/student/:studentId', requireAuth(['FACULTY', 'ADMIN']), getStudentReport)

/**
 * @swagger
 * /report/defaulters/{classId}:
 *   get:
 *     summary: Get student defaulters for a class
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Defaulters list
 */
router.get('/defaulters/:classId', requireAuth(['FACULTY', 'ADMIN']), getDefaulters)

/**
 * @swagger
 * /report/class/{classId}/month/{year}/{month}:
 *   get:
 *     summary: Get monthly class report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly class report
 */
router.get(
    '/class/:classId/month/:year/:month',
    requireAuth(['FACULTY', 'ADMIN']),
    getMonthlyClassReport
)

/**
 * @swagger
 * /report/abuse:
 *   get:
 *     summary: Get high attendance abuse list
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Abuse detection list
 */
router.get('/abuse', requireAuth(['ADMIN']), getAbuseList)

export default router
