import { sql } from '../config/db.js'

export const createSubject = async (req, res) => {
  const { name, institutionId } = req.body

  if (!name || !institutionId) {
    return res.status(400).json({ error: 'name and institutionId required' })
  }

  await sql`
    INSERT INTO subjects (name, institution_id)
    VALUES (${name}, ${institutionId})
  `

  res.json({ success: true })
}

export const createClass = async (req, res) => {
  const { name, institutionId } = req.body

  if (!name || !institutionId) {
    return res.status(400).json({ error: 'name and institutionId required' })
  }

  await sql`
    INSERT INTO classes (name, institution_id)
    VALUES (${name}, ${institutionId})
  `

  res.json({ success: true })
}

export const mapFacultySubject = async (req, res) => {
  const { facultyId, subjectId, classId } = req.body

  if (!facultyId || !subjectId || !classId) {
    return res.status(400).json({ error: 'facultyId, subjectId, classId required' })
  }

  await sql`
    INSERT INTO faculty_subject_map (faculty_id, subject_id, class_id)
    VALUES (${facultyId}, ${subjectId}, ${classId})
  `

  res.json({ success: true })
}

export const createTimetableSlot = async (req, res) => {
  const { facultySubjectMapId, dayOfWeek, startTime, endTime } = req.body

  if (!facultySubjectMapId || !dayOfWeek || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields required' })
  }

  await sql`
    INSERT INTO timetable_slots (faculty_subject_map_id, day_of_week, start_time, end_time)
    VALUES (${facultySubjectMapId}, ${dayOfWeek}, ${startTime}, ${endTime})
  `

  res.json({ success: true })
}

export const deactivateStudent = async (req, res) => {
  const { id } = req.params

  await sql`
    UPDATE students SET is_active = false WHERE id = ${id}
  `

  res.json({ success: true })
}