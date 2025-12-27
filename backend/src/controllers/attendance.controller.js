import { sql } from '../config/db.js'
import { z } from 'zod'

const markSchema = z.object({
  sessionId: z.number(),
  studentId: z.number(),
  status: z.enum(['P', 'A']),
  editedBy: z.number(),
  reason: z.string().optional()
})

export const createAttendanceSession = async (req, res) => {
  const { timetableSlotId, batchId } = req.body

  if (!timetableSlotId) {
    return res.status(400).json({ error: 'timetableSlotId required' })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Check if session exists (modified to consider batch?)
  // Generally, one slot = one session per day. 
  // BUT if practicals split batches, maybe multiple sessions for same slot?
  // For now, let's assume if batchId is provided, we check uniqueness with batchId too?
  // Let's keep it simple: One session per slot for now, unless we change constraints.
  // Actually, if we have multiple batches for same time, they usually have different slots or the same slot is reused?
  // Detailed Mode: If batchId provided, check if session exists for that batch?

  // Let's first get the default batch_id from timetable if exists
  const slot = await sql`SELECT batch_id FROM timetable_slots WHERE id = ${timetableSlotId}`
  const defaultBatchId = slot[0]?.batch_id

  const finalBatchId = batchId || defaultBatchId || null;

  const existing = await sql`
    SELECT id FROM attendance_sessions
    WHERE timetable_slot_id = ${timetableSlotId}
      AND session_date = ${today}
      AND is_archived = false
      AND (batch_id IS NOT DISTINCT FROM ${finalBatchId}) 
  `
  // IS NOT DISTINCT FROM handles NULL comparisons correctly

  if (existing.length) {
    // If exact session exists, return it instead of error (idempotency)?
    // Or return error.
    return res.status(200).json({ sessionId: existing[0].id, message: 'Session already exists' })
  }

  const inserted = await sql`
    INSERT INTO attendance_sessions (timetable_slot_id, session_date, batch_id)
    VALUES (${timetableSlotId}, ${today}, ${finalBatchId})
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
      s.roll_no,
      sr.status,
      sr.edit_count,
      sub.name as subject_name,
      CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class_name,
      b.name as batch_name,
      asn.session_date,
      ts.start_time,
      ts.end_time,
      asn.locked
    FROM attendance_sessions asn
    JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
    JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    JOIN subjects sub ON sub.id = fsm.subject_id
    JOIN classes c ON c.id = fsm.class_id
    JOIN programs p ON p.id = c.program_id
    LEFT JOIN divisions d ON d.id = c.division_id
    LEFT JOIN batches b ON b.id = asn.batch_id
    JOIN students s ON s.class_id = fsm.class_id AND s.is_active = true
        AND (asn.batch_id IS NULL OR s.batch_id = asn.batch_id)
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendance_records sr 
      ON sr.session_id = asn.id AND sr.student_id = s.id
    WHERE asn.id = ${sessionId}
      AND asn.is_archived = false
    ORDER BY s.roll_no;
  `

  res.json(result)
}
