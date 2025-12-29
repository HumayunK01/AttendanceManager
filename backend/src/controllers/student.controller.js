import { sql } from '../config/db.js'

export const getAttendance = async (req, res) => {
  const userId = req.user.id

  try {
    // Get student details
    const studentResult = await sql`
      SELECT id, class_id as "classId" FROM students WHERE user_id = ${userId} AND is_active = true
  `

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    const student = studentResult[0]

    // Get attendance stats per subject
    // specific to the student's class
    const attendanceStats = await sql`
      WITH SubjectSessions AS(
    SELECT 
          sub.id as subject_id,
    sub.name as subject_name,
    COUNT(DISTINCT asn.id) as total_sessions
        FROM subjects sub
        JOIN faculty_subject_map fsm ON fsm.subject_id = sub.id
        JOIN classes c ON c.id = fsm.class_id
        LEFT JOIN timetable_slots ts ON ts.faculty_subject_map_id = fsm.id
        LEFT JOIN attendance_sessions asn ON asn.timetable_slot_id = ts.id AND asn.is_archived = false
        WHERE c.id = ${student.classId}
        GROUP BY sub.id, sub.name
  ),
  StudentAttendance AS(
    SELECT 
          fsm.subject_id,
    COUNT(DISTINCT ar.id) as attended_sessions
        FROM attendance_records ar
        JOIN attendance_sessions asn ON asn.id = ar.session_id
        JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
        JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
        WHERE ar.student_id = ${student.id}
          AND ar.status = 'P'
          AND asn.is_archived = false
        GROUP BY fsm.subject_id
  )
SELECT
ss.subject_id as id,
  ss.subject_name as name,
  COALESCE(ss.total_sessions, 0) as "totalClasses",
  COALESCE(sa.attended_sessions, 0) as attended
      FROM SubjectSessions ss
      LEFT JOIN StudentAttendance sa ON sa.subject_id = ss.subject_id
  `

    // Format response
    const formattedStats = attendanceStats.map(stat => ({
      id: stat.id,
      name: stat.name,
      code: stat.name.substring(0, 3).toUpperCase(), // Mock code from name
      totalClasses: parseInt(stat.totalClasses),
      attended: parseInt(stat.attended),
      percentage: stat.totalClasses > 0
        ? Math.round((stat.attended / stat.totalClasses) * 100)
        : 0
    }))

    res.json(formattedStats)
  } catch (error) {
    console.error('Error fetching student attendance:', error)
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
}

export const getOverallPercentage = async (req, res) => {
  const userId = req.user.id

  try {
    const studentResult = await sql`
      SELECT id, class_id as "classId" FROM students WHERE user_id = ${userId} AND is_active = true
  `

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    const student = studentResult[0]

    // Calculate overall stats
    // Total sessions for the class
    const totalSessionsResult = await sql`
      SELECT COUNT(DISTINCT asn.id) as count
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      WHERE fsm.class_id = ${student.classId}
        AND asn.is_archived = false
  `

    // Total attended by student
    const attendedResult = await sql`
      SELECT COUNT(DISTINCT ar.id) as count
      FROM attendance_records ar
      JOIN attendance_sessions asn ON asn.id = ar.session_id
      WHERE ar.student_id = ${student.id}
        AND ar.status = 'P'
        AND asn.is_archived = false
  `

    // Total subjects for the class
    const totalSubjectsResult = await sql`
      SELECT COUNT(DISTINCT subject_id) as count
      FROM faculty_subject_map
      WHERE class_id = ${student.classId}
`
    console.log(`Debug getOverallPercentage: StudentClassID = ${student.classId}, Count = ${totalSubjectsResult[0].count} `);

    const totalClasses = parseInt(totalSessionsResult[0].count)
    const attended = parseInt(attendedResult[0].count)
    const totalSubjects = parseInt(totalSubjectsResult[0].count)
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0

    res.json({
      totalClasses,
      attended,
      percentage,
      totalSubjects
    })
  } catch (error) {
    console.error('Error fetching overall percentage:', error)
    res.status(500).json({ error: 'Failed to fetch overall percentage' })
  }
}

export const getAttendanceHistory = async (req, res) => {
  const userId = req.user.id

  try {
    const studentResult = await sql`
      SELECT id, class_id as "classId" FROM students WHERE user_id = ${userId} AND is_active = true
  `

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    const student = studentResult[0]

    const history = await sql`
SELECT
asn.session_date as date,
  sub.name as subject,
  ts.start_time as "startTime",
  ts.end_time as "endTime",
  CASE 
          WHEN ar.status = 'P' THEN 'Present'
          WHEN ar.status = 'A' THEN 'Absent'
          WHEN asn.locked = true THEN 'Absent'
          ELSE 'Not Marked'
END as status
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects sub ON sub.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      LEFT JOIN attendance_records ar 
        ON ar.session_id = asn.id 
        AND ar.student_id = ${student.id}
      WHERE c.id = ${student.classId}
        AND asn.is_archived = false
      ORDER BY asn.session_date DESC, ts.start_time DESC
  `

    res.json(history)
  } catch (error) {
    console.error('Error fetching attendance history:', error)
    res.status(500).json({ error: 'Failed to fetch attendance history' })
  }
}

export const getLeaderboard = async (req, res) => {
  const userId = req.user.id

  try {
    // 1. Get current student details to determine class
    const studentResult = await sql`
      SELECT id, class_id as "classId" FROM students WHERE user_id = ${userId} AND is_active = true
  `

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    const student = studentResult[0]
    const classId = student.classId

    // 2. Calculate statistics for ALL students in this class
    // We need: Name, Roll No, Total Classes (for the class), Attended Classes (per student)

    // First, get Total Classes held for this class
    const totalSessionsQuery = await sql`
      SELECT COUNT(DISTINCT asn.id) as count
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      WHERE fsm.class_id = ${classId}
        AND asn.is_archived = false
  `
    const totalClassSessions = parseInt(totalSessionsQuery[0].count || 0)

    // Now get attendance counts for each student in the class
    const leaderboardUtil = await sql`
SELECT
s.id,
  s.roll_no as "rollNo",
  u.name,
  COUNT(DISTINCT ar.id) as attended
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN attendance_records ar 
        ON ar.student_id = s.id 
        AND ar.status = 'P'
--Ensure we only count valid sessions for this class
  AND ar.session_id IN(
    SELECT asn.id 
            FROM attendance_sessions asn
            JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
            JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
            WHERE fsm.class_id = ${classId} AND asn.is_archived = false
  )
      WHERE s.class_id = ${classId} AND s.is_active = true
      GROUP BY s.id, s.roll_no, u.name
  `

    // Process and sort
    const leaderboard = leaderboardUtil.map(entry => {
      const attended = parseInt(entry.attended)
      const percentage = totalClassSessions > 0
        ? Math.round((attended / totalClassSessions) * 100)
        : 0

      return {
        id: entry.id,
        name: entry.name,
        rollNo: entry.rollNo,
        attended,
        totalClasses: totalClassSessions,
        percentage,
        isCurrentUser: entry.id === student.id
      }
    })

    // Sort by Percentage DESC, then Name ASC
    leaderboard.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      return a.name.localeCompare(b.name)
    })

    // Assign Ranks
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    res.json(rankedLeaderboard)

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

export const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student ID
    const studentResult = await sql`SELECT id, class_id as "classId" FROM students WHERE user_id = ${userId} AND is_active = true`;

    if (studentResult.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = studentResult[0];

    // 1. Fetch Subject-wise stats for "Perfect 100" and "Safe Zone"
    const attendanceStats = await sql`
      WITH SubjectSessions AS(
    SELECT 
          sub.id as subject_id,
    sub.name as subject_name,
    COUNT(DISTINCT asn.id) as total_sessions
        FROM subjects sub
        JOIN faculty_subject_map fsm ON fsm.subject_id = sub.id
        JOIN classes c ON c.id = fsm.class_id
        LEFT JOIN timetable_slots ts ON ts.faculty_subject_map_id = fsm.id
        LEFT JOIN attendance_sessions asn ON asn.timetable_slot_id = ts.id AND asn.is_archived = false
        WHERE c.id = ${student.classId}
        GROUP BY sub.id, sub.name
  ),
  StudentAttendance AS(
    SELECT 
          fsm.subject_id,
    COUNT(DISTINCT ar.id) as attended_sessions
        FROM attendance_records ar
        JOIN attendance_sessions asn ON asn.id = ar.session_id
        JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
        JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
        WHERE ar.student_id = ${student.id}
          AND ar.status = 'P'
          AND asn.is_archived = false
        GROUP BY fsm.subject_id
  )
SELECT
ss.subject_id as id,
  ss.subject_name as name,
  COALESCE(ss.total_sessions, 0) as "totalClasses",
  COALESCE(sa.attended_sessions, 0) as attended
      FROM SubjectSessions ss
      LEFT JOIN StudentAttendance sa ON sa.subject_id = ss.subject_id
  `;

    const processedStats = attendanceStats.map(stat => {
      const total = parseInt(stat.totalClasses) || 0;
      const attended = parseInt(stat.attended) || 0;
      return {
        ...stat,
        totalClasses: total,
        attended: attended,
        percentage: total > 0 ? Math.round((attended / total) * 100) : 0
      };
    });

    // 2. Fetch recent absences for "Iron Man" (30 days) and "Streak Master" (7 days)
    const absentStats = await sql`
SELECT
COUNT(*) FILTER(WHERE session_date >= NOW() - INTERVAL '30 days') as "absentsLast30",
  COUNT(*) FILTER(WHERE session_date >= NOW() - INTERVAL '7 days') as "absentsLast7"
      FROM attendance_records ar
      JOIN attendance_sessions ases ON ar.session_id = ases.id
      WHERE ar.student_id = ${student.id} 
      AND ar.status = 'A'
  `;

    const absentsLast30 = parseInt(absentStats[0].absentsLast30) || 0;
    const absentsLast7 = parseInt(absentStats[0].absentsLast7) || 0;

    // 3. Calculate Overall Stats for "Scholar" and "Century"
    const totalAttended = processedStats.reduce((acc, curr) => acc + curr.attended, 0);
    const totalClasses = processedStats.reduce((acc, curr) => acc + curr.totalClasses, 0);
    const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

    // --- Fetch Achievements from DB ---
    const achievementsList = await sql`SELECT * FROM achievements`;
    const unlockedAchievements = await sql`
        SELECT achievement_id 
        FROM student_achievements 
        WHERE student_id = ${student.id}
`;
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievement_id));

    // --- Check Criteria & Update DB ---
    const finalAchievements = [];

    for (const ach of achievementsList) {
      let isUnlocked = unlockedIds.has(ach.id);

      if (!isUnlocked) {
        // Check criteria dynamically
        let criteria = {};
        try {
          criteria = JSON.parse(ach.criteria);
        } catch (e) {
          console.error('Invalid criteria JSON for achievement', ach.id);
        }

        if (criteria.type === 'perfect_subject') {
          isUnlocked = processedStats.some(s => s.percentage === 100 && s.totalClasses > 0);
        } else if (criteria.type === 'min_overall') {
          isUnlocked = overallPercentage >= (criteria.value || 0) && totalClasses > 0;
        } else if (criteria.type === 'no_absent_days') {
          const days = criteria.value || 0;
          if (days === 30) isUnlocked = absentsLast30 === 0 && totalClasses > 0;
          else if (days === 7) isUnlocked = absentsLast7 === 0 && totalClasses > 0;
          // Fallback for other day counts if we want to implement dynamic query later
        } else if (criteria.type === 'all_subjects_min') {
          isUnlocked = processedStats.length > 0 && processedStats.every(s => s.percentage >= (criteria.value || 0));
        } else if (criteria.type === 'min_total_attended') {
          isUnlocked = totalAttended >= (criteria.value || 0);
        } else if (criteria.type === 'min_subjects_above_x') {
          // e.g. criteria: { type: 'min_subjects_above_x', percentage: 90, count: 3 }
          const threshold = criteria.percentage || 75;
          const requiredCount = criteria.count || 1;
          const count = processedStats.filter(s => s.percentage >= threshold).length;
          isUnlocked = count >= requiredCount;
        }

        // If newly unlocked, save to DB
        if (isUnlocked) {
          await sql`
                    INSERT INTO student_achievements(student_id, achievement_id)
VALUES(${student.id}, ${ach.id})
                    ON CONFLICT DO NOTHING
  `;
        }
      }

      finalAchievements.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        unlocked: isUnlocked
      });
    }

    res.json(finalAchievements);

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTimetable = async (req, res) => {
  const userId = req.user.id

  try {
    const studentResult = await sql`
      SELECT id, class_id as "classId", batch_id as "batchId" FROM students WHERE user_id = ${userId} AND is_active = true
    `

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    const student = studentResult[0]

    const timetable = await sql`
      SELECT 
        ts.id,
        ts.day_of_week as "dayOfWeek",
        ts.start_time as "startTime",
        ts.end_time as "endTime",
        s.name as "subjectName",
        u.name as "facultyName",
        b.name as "batchName",
        ts.batch_id as "batchId"
      FROM timetable_slots ts
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      LEFT JOIN faculty f ON f.id = fsm.faculty_id
      LEFT JOIN users u ON u.id = f.user_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      WHERE fsm.class_id = ${student.classId}
      ORDER BY ts.day_of_week, ts.start_time
    `

    res.json(timetable)
  } catch (error) {
    console.error('Error fetching student timetable:', error)
    res.status(500).json({ error: 'Failed to fetch timetable' })
  }
}
