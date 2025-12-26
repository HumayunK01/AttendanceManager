import { sql } from '../config/db.js'

export const getTodayTimetable = async (req, res) => {
  const { facultyId } = req.params

  const today = new Date().getDay() // 0=Sun ... 6=Sat

  const result = await sql`
    SELECT 
      ts.id as timetable_slot_id,
      s.name as subject,
      c.name as class,
      ts.start_time,
      ts.end_time
    FROM timetable_slots ts
    JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
    JOIN subjects s ON s.id = fsm.subject_id
    JOIN classes c ON c.id = fsm.class_id
    WHERE fsm.faculty_id = ${facultyId}
      AND ts.day_of_week = ${today}
    ORDER BY ts.start_time;
  `

  res.json(result)
}
