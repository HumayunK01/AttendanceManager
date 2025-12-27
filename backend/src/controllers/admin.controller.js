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
  const { programId, divisionId, batchYear, isActive } = req.body

  if (!programId || !batchYear)
    return res.status(400).json({ error: 'Missing fields' })

  const result = await sql`
    INSERT INTO classes (program_id, division_id, batch_year, is_active)
    VALUES (${programId}, ${divisionId || null}, ${batchYear}, ${isActive})
    RETURNING id, created_at as "createdAt"
  `

  // Get program and division names
  const program = await sql`SELECT name FROM programs WHERE id = ${programId}`
  const division = divisionId
    ? await sql`SELECT name FROM divisions WHERE id = ${divisionId}`
    : null

  const createdClass = {
    id: result[0].id,
    program: program[0]?.name || '',
    division: division?.[0]?.name || '',
    batchYear,
    isActive,
    createdAt: result[0].createdAt
  }

  res.json(createdClass)
}


export const mapFacultySubject = async (req, res) => {
  const { facultyId, subjectId, classId } = req.body

  if (!facultyId || !subjectId || !classId) {
    return res.status(400).json({ error: 'facultyId, subjectId, classId required' })
  }

  // Resolve user_id to faculty_id if needed
  const facultyProfile = await sql`
    SELECT id FROM faculty WHERE user_id = ${facultyId} OR id = ${facultyId}
    LIMIT 1
  `

  if (!facultyProfile.length) {
    return res.status(404).json({ error: 'Faculty profile not found' })
  }

  const actualFacultyId = facultyProfile[0].id

  // Prevent duplicate mappings
  const exists = await sql`
    SELECT id FROM faculty_subject_map
    WHERE faculty_id = ${actualFacultyId}
      AND subject_id = ${subjectId}
      AND class_id = ${classId}
  `

  if (exists.length) {
    return res.status(400).json({ error: 'Mapping already exists' })
  }

  await sql`
    INSERT INTO faculty_subject_map (faculty_id, subject_id, class_id)
    VALUES (${actualFacultyId}, ${subjectId}, ${classId})
  `

  res.json({ success: true })
}

export const createTimetableSlot = async (req, res) => {
  const { mappingId, dayOfWeek, startTime, endTime } = req.body

  if (!mappingId || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const clash = await sql`
    SELECT id FROM timetable_slots
    WHERE faculty_subject_map_id = ${mappingId}
      AND day_of_week = ${dayOfWeek}
      AND (
        (${startTime} >= start_time AND ${startTime} < end_time)
        OR (${endTime} > start_time AND ${endTime} <= end_time)
        OR (start_time >= ${startTime} AND start_time < ${endTime})
      )
  `

  if (clash.length) {
    return res.status(400).json({ error: 'Timetable slot overlaps existing lecture' })
  }

  await sql`
    INSERT INTO timetable_slots (faculty_subject_map_id, day_of_week, start_time, end_time)
    VALUES (${mappingId}, ${dayOfWeek}, ${startTime}, ${endTime})
  `

  res.json({ success: true })
}

export const updateTimetableSlot = async (req, res) => {
  const { id } = req.params
  const { mappingId, dayOfWeek, startTime, endTime } = req.body

  if (!mappingId || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const clash = await sql`
    SELECT id FROM timetable_slots
    WHERE faculty_subject_map_id = ${mappingId}
      AND day_of_week = ${dayOfWeek}
      AND id != ${id}
      AND (
        (${startTime} >= start_time AND ${startTime} < end_time)
        OR (${endTime} > start_time AND ${endTime} <= end_time)
        OR (start_time >= ${startTime} AND start_time < ${endTime})
      )
  `

  if (clash.length) {
    return res.status(400).json({ error: 'Timetable slot overlaps existing lecture' })
  }

  await sql`
    UPDATE timetable_slots
    SET faculty_subject_map_id = ${mappingId},
        day_of_week = ${dayOfWeek},
        start_time = ${startTime},
        end_time = ${endTime}
    WHERE id = ${id}
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

  // Insert into users table as 'FACULTY'. institution_id defaults to 1.
  const [newUser] = await sql`
    INSERT INTO users (name, email, password_hash, role, institution_id)
    VALUES (${name}, ${email}, ${hash}, 'FACULTY', 1)
    RETURNING id, institution_id
  `

  // ALSO create an entry in the faculty profile table (required by foreign keys)
  await sql`
    INSERT INTO faculty (user_id, institution_id, department)
    VALUES (${newUser.id}, ${newUser.institution_id}, 'General')
  `

  res.json({ success: true, id: newUser.id })

  // Send credentials via email
  try {
    const mailerUrl = process.env.MAILER_URL || 'http://127.0.0.1:5001/api/send-credentials';
    fetch(mailerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        role: 'FACULTY',
        password
      })
    }).catch(err => console.error('Failed to send email:', err))
  } catch (error) {
    console.error('Error triggering email service:', error)
  }
}

export const createStudent = async (req, res) => {
  const { name, email, password, classId, rollNo } = req.body

  if (!name || !email || !password || !classId || !rollNo) {
    return res.status(400).json({ error: 'All fields required' })
  }

  const exists = await sql`SELECT id FROM users WHERE email = ${email}`
  if (exists.length) {
    return res.status(400).json({ error: 'Email already exists' })
  }

  const hash = await bcrypt.hash(password, 10)

  // Insert into users with institution_id
  const user = await sql`
    INSERT INTO users (name, email, password_hash, role, institution_id)
    VALUES (${name}, ${email}, ${hash}, 'STUDENT', 1)
    RETURNING id
  `

  // Insert into students using 'roll_no'
  const student = await sql`
    INSERT INTO students (user_id, class_id, roll_no, is_active)
    VALUES (${user[0].id}, ${classId}, ${rollNo}, true)
    RETURNING id
  `

  // Get class info by joining programs and divisions
  const classInfo = await sql`
    SELECT 
      p.name as program,
      c.batch_year as year,
      d.name as division
    FROM classes c
    JOIN programs p ON p.id = c.program_id
    LEFT JOIN divisions d ON d.id = c.division_id
    WHERE c.id = ${classId}
  `

  const createdStudent = {
    id: student[0].id,
    name,
    email,
    rollNumber: rollNo,
    classId,
    className: classInfo.length > 0
      ? `${classInfo[0].program} Y${classInfo[0].year}${classInfo[0].division ? `-${classInfo[0].division}` : ''}`
      : '',
    isActive: true,
    attendance: 0,
    createdAt: new Date().toISOString()
  }

  res.json(createdStudent)

  // Send credentials via email
  try {
    const mailerUrl = process.env.MAILER_URL || 'http://127.0.0.1:5001/api/send-credentials';
    fetch(mailerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        role: 'STUDENT',
        password
      })
    }).catch(err => console.error('Failed to send email:', err))
  } catch (error) {
    console.error('Error triggering email service:', error)
  }
}

export const createProgram = async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Program name required' })

  await sql`INSERT INTO programs (name) VALUES (${name})`
  res.json({ success: true })
}

export const createDivision = async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Division name required' })

  await sql`INSERT INTO divisions (name) VALUES (${name})`
  res.json({ success: true })
}

export const getPrograms = async (_, res) => {
  const result = await sql`SELECT id, name FROM programs WHERE is_active=true ORDER BY name`
  res.json(result)
}

export const getDivisions = async (_, res) => {
  const result = await sql`SELECT id, name FROM divisions WHERE is_active=true ORDER BY name`
  res.json(result)
}
