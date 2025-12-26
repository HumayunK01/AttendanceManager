import { Router } from 'express'
import { getTodayTimetable } from '../controllers/faculty.controller.js'

const router = Router()

router.get('/:facultyId/today-timetable', getTodayTimetable)

export default router
