import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getTodayTimetable } from '../controllers/faculty.controller.js'

const router = Router()

router.get('/today-timetable', requireAuth(['FACULTY']), getTodayTimetable)

export default router
