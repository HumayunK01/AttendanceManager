import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createSubject, createClass, mapFacultySubject, createTimetableSlot } from '../controllers/admin.controller.js'

const router = Router()

router.post('/subject', requireAuth(['ADMIN']), createSubject)
router.post('/class', requireAuth(['ADMIN']), createClass)
router.post('/map', requireAuth(['ADMIN']), mapFacultySubject)
router.post('/timetable', requireAuth(['ADMIN']), createTimetableSlot)

export default router
