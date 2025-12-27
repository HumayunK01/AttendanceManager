import { sql } from '../config/db.js'

export const getAttendance = async (req, res) => {
    const userId = req.user.id

    try {
        // Get student details
        const studentResult = await sql`
      SELECT id, class_id FROM students WHERE user_id = ${userId} AND is_active = true
    `

        if (studentResult.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' })
        }

        const student = studentResult[0]

        // Get attendance stats per subject
        // specific to the student's class
        const attendanceStats = await sql`
      WITH SubjectSessions AS (
        SELECT 
          sub.id as subject_id,
          sub.name as subject_name,
          COUNT(DISTINCT asn.id) as total_sessions
        FROM subjects sub
        JOIN faculty_subject_map fsm ON fsm.subject_id = sub.id
        JOIN classes c ON c.id = fsm.class_id
        LEFT JOIN timetable_slots ts ON ts.faculty_subject_map_id = fsm.id
        LEFT JOIN attendance_sessions asn ON asn.timetable_slot_id = ts.id AND asn.is_archived = false
        WHERE c.id = ${student.classId}
        GROUP BY sub.id, sub.name
      ),
      StudentAttendance AS (
        SELECT 
          fsm.subject_id,
          COUNT(DISTINCT ar.id) as attended_sessions
        FROM attendance_records ar
        JOIN attendance_sessions asn ON asn.id = ar.session_id
        JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
        JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
        WHERE ar.student_id = ${student.id}
          AND ar.status = 'P'
          AND asn.is_archived = false
        GROUP BY fsm.subject_id
      )
      SELECT 
        ss.subject_id as id,
        ss.subject_name as name,
        COALESCE(ss.total_sessions, 0) as "totalClasses",
        COALESCE(sa.attended_sessions, 0) as attended
      FROM SubjectSessions ss
      LEFT JOIN StudentAttendance sa ON sa.subject_id = ss.subject_id
    `

        // Format response
        const formattedStats = attendanceStats.map(stat => ({
            id: stat.id,
            name: stat.name,
            code: stat.name.substring(0, 3).toUpperCase(), // Mock code from name
            totalClasses: parseInt(stat.totalClasses),
            attended: parseInt(stat.attended),
            percentage: stat.totalClasses > 0
                ? Math.round((stat.attended / stat.totalClasses) * 100)
                : 0
        }))

        res.json(formattedStats)
    } catch (error) {
        console.error('Error fetching student attendance:', error)
        res.status(500).json({ error: 'Failed to fetch attendance' })
    }
}

export const getOverallPercentage = async (req, res) => {
    const userId = req.user.id

    try {
        const studentResult = await sql`
      SELECT id, class_id FROM students WHERE user_id = ${userId} AND is_active = true
    `

        if (studentResult.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' })
        }

        const student = studentResult[0]

        // Calculate overall stats
        // Total sessions for the class
        const totalSessionsResult = await sql`
      SELECT COUNT(DISTINCT asn.id) as count
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      WHERE fsm.class_id = ${student.classId}
        AND asn.is_archived = false
    `

        // Total attended by student
        const attendedResult = await sql`
      SELECT COUNT(DISTINCT ar.id) as count
      FROM attendance_records ar
      JOIN attendance_sessions asn ON asn.id = ar.session_id
      WHERE ar.student_id = ${student.id}
        AND ar.status = 'P'
        AND asn.is_archived = false
    `

        const totalClasses = parseInt(totalSessionsResult[0].count)
        const attended = parseInt(attendedResult[0].count)
        const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0

        res.json({
            totalClasses,
            attended,
            percentage
        })
    } catch (error) {
        console.error('Error fetching overall percentage:', error)
        res.status(500).json({ error: 'Failed to fetch overall percentage' })
    }
}

export const getAttendanceHistory = async (req, res) => {
    const userId = req.user.id

    try {
        const studentResult = await sql`
      SELECT id, class_id FROM students WHERE user_id = ${userId} AND is_active = true
    `

        if (studentResult.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' })
        }

        const student = studentResult[0]

        const history = await sql`
      SELECT 
        asn.session_date as date,
        sub.name as subject,
        ts.start_time as "startTime",
        ts.end_time as "endTime",
        CASE 
          WHEN ar.status = 'P' THEN 'Present'
          WHEN ar.status = 'A' THEN 'Absent'
          WHEN asn.locked = true THEN 'Absent'
          ELSE 'Not Marked'
        END as status
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      LEFT JOIN attendance_records ar 
        ON ar.session_id = asn.id 
        AND ar.student_id = ${student.id}
      WHERE c.id = ${student.classId}
        AND asn.is_archived = false
      ORDER BY asn.session_date DESC, ts.start_time DESC
    `

        res.json(history)
    } catch (error) {
        console.error('Error fetching attendance history:', error)
        res.status(500).json({ error: 'Failed to fetch attendance history' })
    }
}
