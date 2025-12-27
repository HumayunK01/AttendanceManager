import { sql } from '../config/db.js'
import bcrypt from 'bcryptjs'

export const createSubject = async (req, res) => {
  const { name, institutionId = 1 } = req.body

  if (!name) {
    return res.status(400).json({ error: 'name required' })
  }

  const subject = await sql`
    INSERT INTO subjects (name, institution_id)
    VALUES (${name}, ${institutionId})
    RETURNING id, name, created_at as "createdAt"
  `

  res.json(subject[0])
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

export const createFaculty = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password required' })
  }

  const exists = await sql`SELECT id FROM users WHERE email = ${email}`
  if (exists.length) {
    return res.status(400).json({ error: 'Email already exists' })
  }

  const hash = await bcrypt.hash(password, 10)

  await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${hash}, 'FACULTY')
  `

  res.json({ success: true })
}

export const createStudent = async (req, res) => {
  const { name, email, password, classId, rollNumber } = req.body

  if (!name || !email || !password || !classId || !rollNumber) {
    return res.status(400).json({ error: 'All fields required' })
  }

  const exists = await sql`SELECT id FROM users WHERE email = ${email}`
  if (exists.length) {
    return res.status(400).json({ error: 'Email already exists' })
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${hash}, 'STUDENT')
    RETURNING id
  `

  const student = await sql`
    INSERT INTO students (user_id, class_id, roll_number, is_active)
    VALUES (${user[0].id}, ${classId}, ${rollNumber}, true)
    RETURNING id
  `

  // Get the class info
  const classInfo = await sql`
    SELECT name, year, division FROM classes WHERE id = ${classId}
  `

  // Return the created student with all necessary info
  const createdStudent = {
    id: student[0].id,
    name,
    email,
    rollNumber,
    classId,
    className: classInfo.length > 0
      ? `${classInfo[0].name} Year ${classInfo[0].year} - ${classInfo[0].division}`
      : '',
    isActive: true,
    attendance: 0,
    createdAt: new Date().toISOString()
  }

  res.json(createdStudent)
}