import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createSubject,
  createClass,
  mapFacultySubject,
  createTimetableSlot,
  deactivateStudent,
  createFaculty,
  createStudent,
  createProgram,
  createDivision,
  getPrograms,
  getDivisions
} from '../controllers/admin.controller.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/subject:
 *   post:
 *     summary: Create subject
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, institutionId]
 *             properties:
 *               name:
 *                 type: string
 *               institutionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Subject created
 */
router.post('/subject', requireAuth(['ADMIN']), createSubject)

/**
 * @swagger
 * /admin/class:
 *   post:
 *     summary: Create class
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, institutionId]
 *             properties:
 *               name:
 *                 type: string
 *               institutionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Class created
 */
router.post('/class', requireAuth(['ADMIN']), createClass)

/**
 * @swagger
 * /admin/map:
 *   post:
 *     summary: Map faculty to subject and class
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facultyId, subjectId, classId]
 *             properties:
 *               facultyId:
 *                 type: integer
 *               subjectId:
 *                 type: integer
 *               classId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Mapping created
 */
router.post('/map', requireAuth(['ADMIN']), mapFacultySubject)

/**
 * @swagger
 * /admin/timetable:
 *   post:
 *     summary: Create timetable slot
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facultySubjectMapId, dayOfWeek, startTime, endTime]
 *             properties:
 *               facultySubjectMapId:
 *                 type: integer
 *               dayOfWeek:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *     responses:
 *       200:
 *         description: Timetable slot created
 */
router.post('/timetable', requireAuth(['ADMIN']), createTimetableSlot)

/**
 * @swagger
 * /admin/faculty:
 *   post:
 *     summary: Create faculty account
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Faculty created
 */
router.post('/faculty', requireAuth(['ADMIN']), createFaculty)

/**
 * @swagger
 * /admin/student:
 *   post:
 *     summary: Create student account
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, classId, rollNo]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               classId:
 *                 type: integer
 *               rollNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student created
 */

router.post('/student', requireAuth(['ADMIN']), createStudent)

/**
 * @swagger
 * /admin/student/{id}/deactivate:
 *   post:
 *     summary: Deactivate student
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deactivated
 */
router.post('/student/:id/deactivate', requireAuth(['ADMIN']), deactivateStudent)

/**
 * @swagger
 * /admin/programs:
 *   get:
 *     summary: Get all active programs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                     example: CSE
 */
router.get('/programs', requireAuth(['ADMIN']), getPrograms)

/**
 * @swagger
 * /admin/program:
 *   post:
 *     summary: Create a new program
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: CSE
 *     responses:
 *       200:
 *         description: Program created successfully
 */
router.post('/program', requireAuth(['ADMIN']), createProgram)

/**
 * @swagger
 * /admin/divisions:
 *   get:
 *     summary: Get all active divisions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active divisions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                     example: A
 */
router.get('/divisions', requireAuth(['ADMIN']), getDivisions)

/**
 * @swagger
 * /admin/division:
 *   post:
 *     summary: Create a new division
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: A
 *     responses:
 *       200:
 *         description: Division created successfully
 */
router.post('/division', requireAuth(['ADMIN']), createDivision)

export default router
