import { sql } from '../config/db.js'

export const getStudentReport = async (req, res) => {
  const { studentId } = req.params

  const result = await sql`
    SELECT 
      sub.name as subject,
      COUNT(ar.id) FILTER (WHERE ar.status = 'P') as present,
      COUNT(ar.id) as total,
      ROUND(
        (COUNT(ar.id) FILTER (WHERE ar.status = 'P')::decimal / NULLIF(COUNT(ar.id),0)) * 100, 
        2
      ) as percentage
    FROM attendance_records ar
    JOIN attendance_sessions asn ON asn.id = ar.session_id
    JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
    JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    JOIN subjects sub ON sub.id = fsm.subject_id
    WHERE ar.student_id = ${studentId}
    GROUP BY sub.name;
  `

  res.json(result)
}

export const getDefaulters = async (req, res) => {
  const { classId } = req.params

  const result = await sql`
    SELECT 
      u.name as student,
      ROUND(
        (COUNT(ar.id) FILTER (WHERE ar.status = 'P')::decimal / NULLIF(COUNT(ar.id),0)) * 100,
        2
      ) as percentage
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendance_records ar ON ar.student_id = s.id
    LEFT JOIN attendance_sessions asn ON asn.id = ar.session_id
    LEFT JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
    LEFT JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    WHERE s.class_id = ${classId}
    GROUP BY u.name
    HAVING ROUND(
      (COUNT(ar.id) FILTER (WHERE ar.status = 'P')::decimal / NULLIF(COUNT(ar.id),0)) * 100,
      2
    ) < 75;
  `

  res.json(result)
}

export const getMonthlyClassReport = async (req, res) => {
  const { classId, year, month } = req.params

  const result = await sql`
    SELECT 
      sub.name as subject,
      COUNT(DISTINCT asn.id) as total_sessions,
      COUNT(ar.id) FILTER (WHERE ar.status = 'P') as total_present
    FROM attendance_sessions asn
    JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
    JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    JOIN subjects sub ON sub.id = fsm.subject_id
    LEFT JOIN attendance_records ar ON ar.session_id = asn.id
    WHERE fsm.class_id = ${classId}
      AND EXTRACT(YEAR FROM asn.session_date) = ${year}
      AND EXTRACT(MONTH FROM asn.session_date) = ${month}
    GROUP BY sub.name
    ORDER BY sub.name;
  `

  res.json(result)
}

export const getAbuseList = async (_, res) => {
  const result = await sql`
    SELECT 
      u.name as student,
      ar.edit_count
    FROM attendance_records ar
    JOIN students s ON s.id = ar.student_id
    JOIN users u ON u.id = s.user_id
    WHERE ar.edit_count > 3;
  `
  res.json(result)
}
