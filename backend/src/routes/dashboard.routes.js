import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getDashboardStats } from '../controllers/dashboard.controller.js'

const router = Router()

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including attendance trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendanceTrend:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day:
 *                         type: string
 *                       attendance:
 *                         type: number
 *                 todaySessions:
 *                   type: integer
 *                 completedSessions:
 *                   type: integer
 *                 inProgressSessions:
 *                   type: integer
 */
router.get('/stats', requireAuth(['ADMIN']), getDashboardStats)

export default router
