import { sql } from '../config/db.js'

export const getTodayTimetable = async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get faculty record for this user
    const facultyRecord = await sql`
      SELECT id FROM faculty WHERE user_id = ${userId}
    `;

    if (!facultyRecord.length) {
      return res.status(404).json({ error: 'Faculty record not found' });
    }

    const facultyId = facultyRecord[0].id;
    const today = new Date().getDay(); // 0=Sun ... 6=Sat

    console.log(`[Faculty Timetable] Faculty ID: ${facultyId}, Today: ${today} (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)`);

    const result = await sql`
      SELECT 
        ts.id as timetable_slot_id,
        s.name as subject,
        CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class,
        ts.start_time,
        ts.end_time,
        ts.day_of_week,
        asn.id as session_id,
        asn.locked as session_locked
      FROM timetable_slots ts
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      LEFT JOIN attendance_sessions asn ON asn.timetable_slot_id = ts.id 
        AND asn.session_date = CURRENT_DATE
        AND asn.is_archived = false
      WHERE fsm.faculty_id = ${facultyId}
      ORDER BY ts.day_of_week, ts.start_time;
    `;

    console.log(`[Faculty Timetable] Found ${result.length} total slots. Days:`, result.map(r => `${r.subject}=day${r.day_of_week}`));

    res.json(result);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
}
