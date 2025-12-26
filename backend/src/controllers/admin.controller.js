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

  // Prevent duplicate mappings
  const exists = await sql`
    SELECT id FROM faculty_subject_map
    WHERE faculty_id = ${facultyId}
      AND subject_id = ${subjectId}
      AND class_id = ${classId}
  `

  if (exists.length) {
    return res.status(400).json({ error: 'Mapping already exists' })
  }

  await sql`
    INSERT INTO faculty_subject_map (faculty_id, subject_id, class_id)
    VALUES (${facultyId}, ${subjectId}, ${classId})
  `

  res.json({ success: true })
}

export const createTimetableSlot = async (req, res) => {
  const { facultySubjectMapId, dayOfWeek, startTime, endTime } = req.body

  const clash = await sql`
    SELECT id FROM timetable_slots
    WHERE faculty_subject_map_id = ${facultySubjectMapId}
      AND day_of_week = ${dayOfWeek}
      AND (
        (${startTime} BETWEEN start_time AND end_time)
        OR (${endTime} BETWEEN start_time AND end_time)
      )
  `

  if (clash.length) {
    return res.status(400).json({ error: 'Timetable slot overlaps existing lecture' })
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