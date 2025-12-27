import { sql } from '../config/db.js'

// Get all subjects
export const getSubjects = async (req, res) => {
    try {
        const subjects = await sql`
      SELECT id, name, created_at as "createdAt"
      FROM subjects
      ORDER BY name ASC
    `
        res.json(subjects)
    } catch (error) {
        console.error('Error fetching subjects:', error)
        res.status(500).json({ message: 'Failed to fetch subjects' })
    }
}

// Get all classes
export const getClasses = async (req, res) => {
    try {
        const classes = await sql`
      SELECT id, name, year, division, created_at as "createdAt"
      FROM classes
      ORDER BY year ASC, division ASC
    `
        res.json(classes)
    } catch (error) {
        console.error('Error fetching classes:', error)
        res.status(500).json({ message: 'Failed to fetch classes' })
    }
}

// Get all faculty
export const getFaculty = async (req, res) => {
    try {
        const faculty = await sql`
      SELECT 
        f.id,
        u.name,
        u.email,
        f.department,
        f.created_at as "createdAt",
        COUNT(DISTINCT fsm.id) as "subjectsCount"
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN faculty_subject_map fsm ON fsm.faculty_id = f.id
      GROUP BY f.id, u.name, u.email, f.department, f.created_at
      ORDER BY u.name ASC
    `
        res.json(faculty)
    } catch (error) {
        console.error('Error fetching faculty:', error)
        res.status(500).json({ message: 'Failed to fetch faculty' })
    }
}

// Get all students
export const getStudents = async (req, res) => {
    try {
        const students = await sql`
      SELECT 
        s.id,
        u.name,
        u.email,
        s.roll_number as "rollNumber",
        c.id as "classId",
        CONCAT(c.name, ' Year ', c.year, ' - ', c.division) as "className",
        s.is_active as "isActive",
        s.created_at as "createdAt",
        COALESCE(
          ROUND(
            (COUNT(ar.id) FILTER (WHERE ar.status = 'P')::decimal / NULLIF(COUNT(ar.id), 0)) * 100,
            2
          ),
          0
        ) as attendance
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN attendance_records ar ON ar.student_id = s.id
      GROUP BY s.id, u.name, u.email, s.roll_number, c.id, c.name, c.year, c.division, s.is_active, s.created_at
      ORDER BY u.name ASC
    `
        res.json(students)
    } catch (error) {
        console.error('Error fetching students:', error)
        res.status(500).json({ message: 'Failed to fetch students' })
    }
}

// Get all mappings
export const getMappings = async (req, res) => {
    try {
        const mappings = await sql`
      SELECT 
        fsm.id,
        fsm.faculty_id as "facultyId",
        fu.name as "facultyName",
        fsm.subject_id as "subjectId",
        sub.name as "subjectName",
        sub.code as "subjectCode",
        fsm.class_id as "classId",
        CONCAT(c.name, ' Y', c.year, '-', c.division) as "className",
        fsm.created_at as "createdAt"
      FROM faculty_subject_map fsm
      JOIN faculty f ON f.id = fsm.faculty_id
      JOIN users fu ON fu.id = f.user_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      ORDER BY fu.name ASC, sub.name ASC
    `
        res.json(mappings)
    } catch (error) {
        console.error('Error fetching mappings:', error)
        res.status(500).json({ message: 'Failed to fetch mappings' })
    }
}

// Get all timetable slots
export const getTimetable = async (req, res) => {
    try {
        const slots = await sql`
      SELECT 
        ts.id,
        ts.faculty_subject_map_id as "mappingId",
        fu.name as "facultyName",
        sub.name as "subjectName",
        CONCAT(c.name, ' Y', c.year, '-', c.division) as "className",
        ts.day_of_week as "dayOfWeek",
        ts.start_time as "startTime",
        ts.end_time as "endTime"
      FROM timetable_slots ts
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN faculty f ON f.id = fsm.faculty_id
      JOIN users fu ON fu.id = f.user_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      ORDER BY ts.day_of_week ASC, ts.start_time ASC
    `
        res.json(slots)
    } catch (error) {
        console.error('Error fetching timetable:', error)
        res.status(500).json({ message: 'Failed to fetch timetable' })
    }
}

// Update subject
export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        await sql`
      UPDATE subjects
      SET name = ${name}
      WHERE id = ${id}
    `

        res.json({ message: 'Subject updated successfully' })
    } catch (error) {
        console.error('Error updating subject:', error)
        res.status(500).json({ message: 'Failed to update subject' })
    }
}

// Delete subject
export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params

        await sql`DELETE FROM subjects WHERE id = ${id}`

        res.json({ message: 'Subject deleted successfully' })
    } catch (error) {
        console.error('Error deleting subject:', error)
        res.status(500).json({ message: 'Failed to delete subject' })
    }
}

// Update class
export const updateClass = async (req, res) => {
    try {
        const { id } = req.params
        const { name, year, division } = req.body

        await sql`
      UPDATE classes
      SET name = ${name}, year = ${year}, division = ${division}
      WHERE id = ${id}
    `

        res.json({ message: 'Class updated successfully' })
    } catch (error) {
        console.error('Error updating class:', error)
        res.status(500).json({ message: 'Failed to update class' })
    }
}

// Delete class
export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params

        await sql`DELETE FROM classes WHERE id = ${id}`

        res.json({ message: 'Class deleted successfully' })
    } catch (error) {
        console.error('Error deleting class:', error)
        res.status(500).json({ message: 'Failed to delete class' })
    }
}

// Update faculty
export const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, department } = req.body

        const faculty = await sql`SELECT user_id FROM faculty WHERE id = ${id}`
        if (faculty.length === 0) {
            return res.status(404).json({ message: 'Faculty not found' })
        }

        await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${faculty[0].user_id}
    `

        await sql`
      UPDATE faculty
      SET department = ${department}
      WHERE id = ${id}
    `

        res.json({ message: 'Faculty updated successfully' })
    } catch (error) {
        console.error('Error updating faculty:', error)
        res.status(500).json({ message: 'Failed to update faculty' })
    }
}

// Delete faculty
export const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params

        const faculty = await sql`SELECT user_id FROM faculty WHERE id = ${id}`
        if (faculty.length === 0) {
            return res.status(404).json({ message: 'Faculty not found' })
        }

        await sql`DELETE FROM faculty WHERE id = ${id}`
        await sql`DELETE FROM users WHERE id = ${faculty[0].user_id}`

        res.json({ message: 'Faculty deleted successfully' })
    } catch (error) {
        console.error('Error deleting faculty:', error)
        res.status(500).json({ message: 'Failed to delete faculty' })
    }
}

// Activate student
export const activateStudent = async (req, res) => {
    try {
        const { id } = req.params

        await sql`
      UPDATE students
      SET is_active = true
      WHERE id = ${id}
    `

        res.json({ message: 'Student activated successfully' })
    } catch (error) {
        console.error('Error activating student:', error)
        res.status(500).json({ message: 'Failed to activate student' })
    }
}

// Delete mapping
export const deleteMapping = async (req, res) => {
    try {
        const { id } = req.params

        await sql`DELETE FROM faculty_subject_map WHERE id = ${id}`

        res.json({ message: 'Mapping deleted successfully' })
    } catch (error) {
        console.error('Error deleting mapping:', error)
        res.status(500).json({ message: 'Failed to delete mapping' })
    }
}

// Delete timetable slot
export const deleteTimetableSlot = async (req, res) => {
    try {
        const { id } = req.params

        await sql`DELETE FROM timetable_slots WHERE id = ${id}`

        res.json({ message: 'Timetable slot deleted successfully' })
    } catch (error) {
        console.error('Error deleting timetable slot:', error)
        res.status(500).json({ message: 'Failed to delete timetable slot' })
    }
}
