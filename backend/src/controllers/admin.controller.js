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

export const updateClass = async (req, res) => {
  const { id } = req.params
  const { programId, divisionId, batchYear, isActive } = req.body

  await sql`
    UPDATE classes
    SET program_id = ${programId},
        division_id = ${divisionId || null},
        batch_year = ${batchYear},
        is_active = ${isActive}
    WHERE id = ${id}
  `

  res.json({ success: true })
}

export const deleteClass = async (req, res) => {
  const { id } = req.params
  try {
    await sql`DELETE FROM classes WHERE id = ${id}`
    res.json({ success: true })
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete class. Please remove enrolled students/timetable first.' })
    }
    console.error('Delete class error:', error)
    res.status(500).json({ error: 'Failed to delete class' })
  }
}


export const mapFacultySubject = async (req, res) => {
  const { facultyId, subjectId, classId } = req.body

  if (!subjectId || !classId) {
    return res.status(400).json({ error: 'subjectId and classId required' })
  }

  let actualFacultyId = null

  if (facultyId) {
    // Resolve user_id to faculty_id if needed
    const facultyProfile = await sql`
      SELECT id FROM faculty WHERE user_id = ${facultyId} OR id = ${facultyId}
      LIMIT 1
    `

    if (!facultyProfile.length) {
      return res.status(404).json({ error: 'Faculty profile not found' })
    }
    actualFacultyId = facultyProfile[0].id
  }

  // Prevent duplicate mappings
  // If faculty is provided, check for exact match.
  // If faculty is NOT provided, check if we already have a generic "unassigned" mapping?
  // Or should we check if *any* mapping exists?
  // Let's allow specific (Faculty, Subject, Class) OR (Null, Subject, Class).

  const exists = await sql`
    SELECT id FROM faculty_subject_map
    WHERE subject_id = ${subjectId}
      AND class_id = ${classId}
      AND (
        (${actualFacultyId}::integer IS NULL AND faculty_id IS NULL)
        OR
        (${actualFacultyId}::integer IS NOT NULL AND faculty_id = ${actualFacultyId})
      )
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
  const { mappingId, dayOfWeek, startTime, endTime, batchId } = req.body

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

  // Insert with batch_id (NULL for theory, value for practical)
  await sql`
    INSERT INTO timetable_slots (faculty_subject_map_id, day_of_week, start_time, end_time, batch_id)
    VALUES (${mappingId}, ${dayOfWeek}, ${startTime}, ${endTime}, ${batchId || null})
  `

  res.json({ success: true })
}

export const updateTimetableSlot = async (req, res) => {
  const { id } = req.params
  const { mappingId, dayOfWeek, startTime, endTime, batchId } = req.body

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

  // Update with batch_id (NULL for theory, value for practical)
  await sql`
    UPDATE timetable_slots
    SET faculty_subject_map_id = ${mappingId},
        day_of_week = ${dayOfWeek},
        start_time = ${startTime},
        end_time = ${endTime},
        batch_id = ${batchId || null}
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
    const mailerBaseUrl = process.env.MAILER_URL || 'http://127.0.0.1:5001'
    const mailerUrl = `${mailerBaseUrl}/api/send-credentials`
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
    const mailerBaseUrl = process.env.MAILER_URL || 'http://127.0.0.1:5001';
    const mailerUrl = `${mailerBaseUrl}/api/send-credentials`;
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

export const getBatches = async (req, res) => {
  const { classId } = req.params
  const batches = await sql`SELECT * FROM batches WHERE class_id = ${classId} ORDER BY name`
  res.json(batches)
}

export const createBatch = async (req, res) => {
  const { classId } = req.params
  const { name } = req.body

  if (!name) return res.status(400).json({ error: 'name required' })

  const batch = await sql`
    INSERT INTO batches (class_id, name)
    VALUES (${classId}, ${name})
    RETURNING *
  `
  res.json(batch[0])
}

export const deleteBatch = async (req, res) => {
  const { id } = req.params
  try {
    await sql`DELETE FROM batches WHERE id = ${id}`
    res.json({ success: true })
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete batch with assigned students.' })
    }
    res.status(500).json({ error: 'Failed to delete batch' })
  }
}

export const assignBatch = async (req, res) => {
  const { studentId, batchId } = req.body

  // batchId can be null to unassign
  if (!studentId) return res.status(400).json({ error: 'studentId required' })

  // Verify batch belongs to student's class if batchId is provided
  if (batchId) {
    const check = await sql`
        SELECT s.class_id as "studentClassId", b.class_id as "batchClassId"
        FROM students s, batches b
        WHERE s.id = ${studentId} AND b.id = ${batchId}
    `
    if (!check.length) return res.status(404).json({ error: 'Student or Batch not found' })
    if (check[0].studentClassId !== check[0].batchClassId) {
      return res.status(400).json({ error: 'Batch must belong to the same class as the student' })
    }
  }

  await sql`
    UPDATE students
    SET batch_id = ${batchId || null}
    WHERE id = ${studentId}
  `

  res.json({ success: true })
}

export const createAchievement = async (req, res) => {
  const { title, description, icon, criteria } = req.body;

  if (!title || !icon || !criteria) {
    return res.status(400).json({ error: 'title, icon, criteria required' });
  }

  // Validate criteria JSON
  let criteriaJson;
  try {
    criteriaJson = JSON.stringify(criteria);
    // Ensure specific keys exist for criteria types if needed
  } catch (e) {
    return res.status(400).json({ error: 'Invalid criteria format' });
  }

  const result = await sql`
    INSERT INTO achievements (title, description, icon, criteria)
    VALUES (${title}, ${description || ''}, ${icon}, ${criteriaJson})
    RETURNING *
  `;

  res.json(result[0]);
}

export const deleteAchievement = async (req, res) => {
  const { id } = req.params;

  try {
    await sql`DELETE FROM achievements WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23503') {
      // If we want to allow deletion even if students have it, we would need cascade delete in schema
      // Since we didn't add cascade, we can delete dependent records first manually or return error
      // Let's force delete student_achievements first
      await sql`DELETE FROM student_achievements WHERE achievement_id = ${id}`;
      await sql`DELETE FROM achievements WHERE id = ${id}`;
      return res.json({ success: true });
    }
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
}

export const getAchievements = async (req, res) => {
  const result = await sql`SELECT * FROM achievements ORDER BY id`
  res.json(result)
}
