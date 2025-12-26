import { sql } from '../config/db.js'
import { z } from 'zod'

const markSchema = z.object({
  sessionId: z.number(),
  studentId: z.number(),
  status: z.enum(['P','A']),
  editedBy: z.number(),
  reason: z.string().optional()
})

export const createAttendanceSession = async (req, res) => {
  const { timetableSlotId } = req.body

  if (!timetableSlotId) {
    return res.status(400).json({ error: 'timetableSlotId required' })
  }

  const today = new Date().toISOString().slice(0, 10)

  const existing = await sql`
    SELECT id FROM attendance_sessions
    WHERE timetable_slot_id = ${timetableSlotId}
      AND session_date = ${today}
      AND is_archived = false
  `

  if (existing.length) {
    return res.status(400).json({ error: 'Session already exists' })
  }

  const inserted = await sql`
    INSERT INTO attendance_sessions (timetable_slot_id, session_date)
    VALUES (${timetableSlotId}, ${today})
    RETURNING id
  `

  res.json({ sessionId: inserted[0].id })
}

export const markAttendance = async (req, res) => {
  const parsed = markSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors })
  }

  const { sessionId, studentId, status, editedBy, reason } = parsed.data

  const session = await sql`
    SELECT locked, is_archived FROM attendance_sessions WHERE id = ${sessionId}
  `

  if (!session.length) return res.status(404).json({ error: 'Session not found' })
  if (session[0].locked || session[0].is_archived)
    return res.status(403).json({ error: 'Attendance session is locked or archived' })

  const existing = await sql`
    SELECT id, status, marked_at FROM attendance_records
    WHERE session_id = ${sessionId} AND student_id = ${studentId}
  `

  if (!existing.length) {
    await sql`
      INSERT INTO attendance_records (session_id, student_id, status, edit_count)
      VALUES (${sessionId}, ${studentId}, ${status}, 0)
    `
    return res.json({ success: true })
  }

  const diff = await sql`
    SELECT EXTRACT(EPOCH FROM (NOW() - marked_at)) / 60 AS minutes
    FROM attendance_records WHERE id = ${existing[0].id}
  `

  if (diff[0].minutes > 10)
    return res.status(403).json({ error: 'Edit window expired' })

  await sql`
    UPDATE attendance_records
    SET status = ${status}, marked_at = NOW(), edit_count = edit_count + 1
    WHERE id = ${existing[0].id}
  `

  await sql`
    INSERT INTO attendance_audit_logs
    (record_id, old_status, new_status, edited_by, reason)
    VALUES
    (${existing[0].id}, ${existing[0].status}, ${status}, ${editedBy}, ${reason || 'No reason'})
  `

  res.json({ success: true })
}

export const getSessionStudents = async (req, res) => {
  const { sessionId } = req.params

  const result = await sql`
    SELECT 
      s.id as student_id,
      u.name as student_name,
      sr.status,
      sr.edit_count
    FROM attendance_sessions asn
    JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
    JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    JOIN students s ON s.class_id = fsm.class_id AND s.is_active = true
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendance_records sr 
      ON sr.session_id = asn.id AND sr.student_id = s.id
    WHERE asn.id = ${sessionId}
      AND asn.is_archived = false
    ORDER BY s.roll_no;
  `

  res.json(result)
}
