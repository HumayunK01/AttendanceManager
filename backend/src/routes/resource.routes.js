import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
    getSubjects,
    getClasses,
    getFaculty,
    getStudents,
    getMappings,
    getTimetable,
    updateSubject,
    deleteSubject,
    updateClass,
    deleteClass,
    updateFaculty,
    deleteFaculty,
    activateStudent,
    deactivateStudent,
    updateStudent,
    deleteStudent,
    deleteMapping,
    deleteTimetableSlot
} from '../controllers/resource.controller.js'
import {
    createSubject,
    createClass,
    createFaculty,
    createStudent,
    mapFacultySubject,
    createTimetableSlot
} from '../controllers/admin.controller.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Resource management endpoints for admin
 */

// ==================== SUBJECTS ====================

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subjects
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
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/subjects', requireAuth(['ADMIN']), getSubjects)

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Resources]
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
 *                 example: Data Structures
 *     responses:
 *       200:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
router.post('/subjects', requireAuth(['ADMIN']), createSubject)

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Subject updated successfully
 */
router.put('/subjects/:id', requireAuth(['ADMIN']), updateSubject)

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 */
router.delete('/subjects/:id', requireAuth(['ADMIN']), deleteSubject)

// ==================== CLASSES ====================

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all classes
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
 *                   year:
 *                     type: integer
 *                   division:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/classes', requireAuth(['ADMIN']), getClasses)

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Resources]
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
 *               - year
 *               - division
 *             properties:
 *               name:
 *                 type: string
 *                 example: Computer Science
 *               year:
 *                 type: integer
 *                 example: 1
 *               division:
 *                 type: string
 *                 example: A
 *     responses:
 *       200:
 *         description: Class created successfully
 */
router.post('/classes', requireAuth(['ADMIN']), createClass)

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               year:
 *                 type: integer
 *               division:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 */
router.put('/classes/:id', requireAuth(['ADMIN']), updateClass)

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class deleted successfully
 */
router.delete('/classes/:id', requireAuth(['ADMIN']), deleteClass)

// ==================== FACULTY ====================

/**
 * @swagger
 * /faculty:
 *   get:
 *     summary: Get all faculty members
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all faculty members
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
 *                   email:
 *                     type: string
 *                   department:
 *                     type: string
 *                   subjectsCount:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/faculty', requireAuth(['ADMIN']), getFaculty)

/**
 * @swagger
 * /faculty:
 *   post:
 *     summary: Create a new faculty member
 *     tags: [Resources]
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
 *               - email
 *               - password
 *               - department
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. John Smith
 *               email:
 *                 type: string
 *                 example: john.smith@university.edu
 *               password:
 *                 type: string
 *                 example: password123
 *               department:
 *                 type: string
 *                 example: Computer Science
 *     responses:
 *       200:
 *         description: Faculty created successfully
 */
router.post('/faculty', requireAuth(['ADMIN']), createFaculty)

/**
 * @swagger
 * /faculty/{id}:
 *   put:
 *     summary: Update a faculty member
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 */
router.put('/faculty/:id', requireAuth(['ADMIN']), updateFaculty)

/**
 * @swagger
 * /faculty/{id}:
 *   delete:
 *     summary: Delete a faculty member
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Faculty deleted successfully
 */
router.delete('/faculty/:id', requireAuth(['ADMIN']), deleteFaculty)

// ==================== STUDENTS ====================

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students with attendance
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
 *                   email:
 *                     type: string
 *                   rollNumber:
 *                     type: string
 *                   classId:
 *                     type: integer
 *                   className:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   attendance:
 *                     type: number
 *                     format: float
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/students', requireAuth(['ADMIN']), getStudents)

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Resources]
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
 *               - email
 *               - password
 *               - rollNumber
 *               - classId
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@student.edu
 *               password:
 *                 type: string
 *                 example: password123
 *               rollNumber:
 *                 type: string
 *                 example: CS2024001
 *               classId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Student created successfully
 */
router.post('/students', requireAuth(['ADMIN']), createStudent)

/**
 * @swagger
 * /students/{id}/activate:
 *   patch:
 *     summary: Activate a student
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student activated successfully
 */
router.patch('/students/:id/activate', requireAuth(['ADMIN']), activateStudent)

/**
 * @swagger
 * /students/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a student
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deactivated successfully
 */
router.patch('/students/:id/deactivate', requireAuth(['ADMIN']), deactivateStudent)
router.put('/students/:id', requireAuth(['ADMIN']), updateStudent)
router.delete('/students/:id', requireAuth(['ADMIN']), deleteStudent)

// ==================== MAPPINGS ====================

/**
 * @swagger
 * /mappings:
 *   get:
 *     summary: Get all faculty-subject-class mappings
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   facultyId:
 *                     type: integer
 *                   facultyName:
 *                     type: string
 *                   subjectId:
 *                     type: integer
 *                   subjectName:
 *                     type: string
 *                   subjectCode:
 *                     type: string
 *                   classId:
 *                     type: integer
 *                   className:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/mappings', requireAuth(['ADMIN']), getMappings)

/**
 * @swagger
 * /mappings:
 *   post:
 *     summary: Create a new faculty-subject-class mapping
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facultyId
 *               - subjectId
 *               - classId
 *             properties:
 *               facultyId:
 *                 type: integer
 *                 example: 1
 *               subjectId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Mapping created successfully
 */
router.post('/mappings', requireAuth(['ADMIN']), mapFacultySubject)

/**
 * @swagger
 * /mappings/{id}:
 *   delete:
 *     summary: Delete a mapping
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 */
router.delete('/mappings/:id', requireAuth(['ADMIN']), deleteMapping)

// ==================== TIMETABLE ====================

/**
 * @swagger
 * /timetable:
 *   get:
 *     summary: Get all timetable slots
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all timetable slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   mappingId:
 *                     type: integer
 *                   facultyName:
 *                     type: string
 *                   subjectName:
 *                     type: string
 *                   className:
 *                     type: string
 *                   dayOfWeek:
 *                     type: integer
 *                     description: 0=Monday, 1=Tuesday, etc.
 *                   startTime:
 *                     type: string
 *                     example: "09:00"
 *                   endTime:
 *                     type: string
 *                     example: "10:00"
 */
router.get('/timetable', requireAuth(['ADMIN']), getTimetable)

/**
 * @swagger
 * /timetable:
 *   post:
 *     summary: Create a new timetable slot
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mappingId
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               mappingId:
 *                 type: integer
 *                 example: 1
 *               dayOfWeek:
 *                 type: integer
 *                 example: 0
 *                 description: 0=Monday, 1=Tuesday, etc.
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *     responses:
 *       200:
 *         description: Timetable slot created successfully
 */
router.post('/timetable', requireAuth(['ADMIN']), createTimetableSlot)

/**
 * @swagger
 * /timetable/{id}:
 *   delete:
 *     summary: Delete a timetable slot
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timetable slot deleted successfully
 */
router.delete('/timetable/:id', requireAuth(['ADMIN']), deleteTimetableSlot)

export default router
