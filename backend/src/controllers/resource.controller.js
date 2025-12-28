import { sql } from '../config/db.js'

// Get all subjects
export const getSubjects = async (req, res) => {
    try {
        const subjects = await sql`
      SELECT 
        s.id, 
        s.name, 
        s.created_at as "createdAt",
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'id', c.id,
                    'program', p.name,
                    'batchYear', c.batch_year,
                    'division', d.name
                )
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'
        ) as classes
      FROM subjects s
      LEFT JOIN faculty_subject_map fsm ON fsm.subject_id = s.id
      LEFT JOIN classes c ON c.id = fsm.class_id
      LEFT JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      GROUP BY s.id
      ORDER BY s.name ASC
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
      SELECT
        c.id,
            p.name as program,
            d.name as division,
            c.batch_year as "batchYear",
            c.is_active as "isActive",
            c.created_at as "createdAt",
            COUNT(DISTINCT s.id)::int as "totalStudents",
            COUNT(DISTINCT b.id)::int as "totalBatches"
      FROM classes c
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
      LEFT JOIN batches b ON b.class_id = c.id
      GROUP BY c.id, p.name, d.name
      ORDER BY c.batch_year DESC, p.name ASC
            `
        console.log('Classes fetched:', classes.length)
        res.json(classes)
    } catch (error) {
        console.error('Error fetching classes:', error.message)
        res.status(500).json({ message: 'Failed to fetch classes', error: error.message })
    }
}

// Get all faculty
export const getFaculty = async (req, res) => {
    try {
        const faculty = await sql`
        SELECT
        u.id,
            u.name,
            u.email,
            u.created_at as "createdAt",
            COUNT(DISTINCT fsm.id):: int as "subjectsCount"
      FROM users u
      LEFT JOIN faculty f ON f.user_id = u.id
      LEFT JOIN faculty_subject_map fsm ON fsm.faculty_id = f.id
      WHERE u.role = 'FACULTY'
      GROUP BY u.id, u.name, u.email, u.created_at
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
            s.roll_no as "rollNumber",
            c.id as "classId",
            CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as "className",
            b.id as "batchId",
            b.name as "batchName",
            s.is_active as "isActive",
            u.created_at as "createdAt",
            COUNT(ar.id) as "totalSessions",
            COALESCE(
                ROUND(
                    (COUNT(ar.id) FILTER(WHERE ar.status = 'P'):: decimal / NULLIF(COUNT(ar.id), 0)) * 100,
                2
            ),
            0
        ) as attendance
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN classes c ON c.id = s.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      LEFT JOIN batches b ON b.id = s.batch_id
      LEFT JOIN attendance_records ar ON ar.student_id = s.id
      GROUP BY s.id, u.name, u.email, s.roll_no, c.id, p.name, c.batch_year, d.name, s.is_active, u.created_at, b.id, b.name
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
    fsm.class_id as "classId",
    CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as "className"
      FROM faculty_subject_map fsm
      JOIN faculty f ON f.id = fsm.faculty_id
      JOIN users fu ON fu.id = f.user_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
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
    CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as "className",
    ts.day_of_week as "dayOfWeek",
    ts.start_time as "startTime",
    ts.end_time as "endTime"
      FROM timetable_slots ts
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN faculty f ON f.id = fsm.faculty_id
      JOIN users fu ON fu.id = f.user_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
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

        await sql`DELETE FROM subjects WHERE id = ${id} `

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
        const { programId, divisionId, batchYear, isActive } = req.body

        await sql`
      UPDATE classes
SET
program_id = ${programId},
division_id = ${divisionId || null},
batch_year = ${batchYear},
is_active = ${isActive}
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

        await sql`DELETE FROM classes WHERE id = ${id} `

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
        const { name, email } = req.body

        await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${id} AND role = 'FACULTY'
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

        await sql`DELETE FROM users WHERE id = ${id} AND role = 'FACULTY'`

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

// Update student
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, rollNo, classId } = req.body

        // Get user_id first
        const student = await sql`SELECT user_id FROM students WHERE id = ${id} `
        if (!student.length) return res.status(404).json({ message: 'Student not found' })
        const userId = student[0].user_id

        // Update user
        await sql`
            UPDATE users 
            SET name = ${name}, email = ${email}
            WHERE id = ${userId}
`

        // Update student
        await sql`
            UPDATE students
            SET roll_no = ${rollNo}, class_id = ${classId}
            WHERE id = ${id}
`

        res.json({ message: 'Student updated successfully' })
    } catch (error) {
        console.error('Error updating student:', error)
        res.status(500).json({ message: 'Failed to update student' })
    }
}

// Delete student
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params

        // Get user_id first
        const student = await sql`SELECT user_id FROM students WHERE id = ${id} `
        if (!student.length) return res.status(404).json({ message: 'Student not found' })
        const userId = student[0].user_id

        // Delete from students first (to avoid FK issues if any, though attendance_records points to students.id)
        // Check for attendance records
        const attendance = await sql`SELECT id FROM attendance_records WHERE student_id = ${id} LIMIT 1`
        if (attendance.length) {
            return res.status(400).json({ message: 'Cannot delete student with attendance records. Deactivate instead.' })
        }

        await sql`DELETE FROM students WHERE id = ${id} `
        await sql`DELETE FROM users WHERE id = ${userId} `

        res.json({ message: 'Student deleted successfully' })
    } catch (error) {
        console.error('Error deleting student:', error)
        res.status(500).json({ message: 'Failed to delete student' })
    }
}

// Deactivate student
export const deactivateStudent = async (req, res) => {
    try {
        const { id } = req.params

        await sql`
      UPDATE students
      SET is_active = false
      WHERE id = ${id}
`

        res.json({ message: 'Student deactivated successfully' })
    } catch (error) {
        console.error('Error deactivating student:', error)
        res.status(500).json({ message: 'Failed to deactivate student' })
    }
}

// Delete mapping
export const deleteMapping = async (req, res) => {
    try {
        const { id } = req.params

        await sql`DELETE FROM faculty_subject_map WHERE id = ${id} `

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

        // Check if there are any attendance sessions linked to this slot
        const sessions = await sql`
            SELECT id, COUNT(*) as count 
            FROM attendance_sessions 
            WHERE timetable_slot_id = ${id}
            GROUP BY id
        `

        const sessionCount = sessions.length;

        if (sessionCount > 0) {
            console.log(`Found ${sessionCount} attendance session(s) for timetable slot ${id} `);

            // Get all session IDs
            const sessionIds = sessions.map(s => s.id);

            // Delete all attendance records and their audit logs for these sessions
            if (sessionIds.length > 0) {
                // First, get all attendance record IDs for these sessions
                const recordIds = [];
                for (const sessionId of sessionIds) {
                    const records = await sql`
                        SELECT id FROM attendance_records 
                        WHERE session_id = ${sessionId}
`
                    recordIds.push(...records.map(r => r.id));
                }

                // Delete audit logs for these records
                if (recordIds.length > 0) {
                    for (const recordId of recordIds) {
                        await sql`
                            DELETE FROM attendance_audit_logs 
                            WHERE record_id = ${recordId}
`
                    }
                    console.log(`Deleted audit logs for ${recordIds.length} attendance record(s)`);
                }

                // Now delete the attendance records
                for (const sessionId of sessionIds) {
                    await sql`
                        DELETE FROM attendance_records 
                        WHERE session_id = ${sessionId}
`
                }
                console.log(`Deleted ${recordIds.length} attendance record(s) for ${sessionIds.length} session(s)`);
            }

            // Delete the sessions (not archive, since we're deleting the timetable slot)
            await sql`
                DELETE FROM attendance_sessions 
                WHERE timetable_slot_id = ${id}
`
            console.log(`Deleted ${sessionCount} attendance session(s)`);
        }

        // Now delete the timetable slot
        await sql`DELETE FROM timetable_slots WHERE id = ${id} `

        const message = sessionCount > 0
            ? `Timetable slot deleted successfully.${sessionCount} attendance session(s) and their records were archived / removed.`
            : 'Timetable slot deleted successfully';

        res.json({ message })
    } catch (error) {
        console.error('Error deleting timetable slot:', error)
        console.error('Error details:', error.message, error.code);

        res.status(500).json({
            message: 'Failed to delete timetable slot. Please check server logs for details.'
        })
    }
}
