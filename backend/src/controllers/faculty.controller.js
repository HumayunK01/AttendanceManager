import { sql } from '../config/db.js'
import PDFDocument from 'pdfkit';

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

    // Allow overriding day via query param, else default to today
    const queryDay = req.query.day ? parseInt(req.query.day) : null;
    const todayIndex = queryDay !== null && !isNaN(queryDay) ? queryDay : new Date().getDay(); // 0=Sun, 1=Mon...

    console.log(`[Faculty Timetable] Faculty ID: ${facultyId}, Target Day Index: ${todayIndex}`);

    const result = await sql`
      SELECT 
        ts.id as timetable_slot_id,
        s.name as subject,
        CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class,
        ts.start_time,
        ts.end_time,
        ts.day_of_week,
        b.id as batch_id,
        b.name as batch_name,
        COALESCE(
          (SELECT json_agg(json_build_object('id', ba.id, 'name', ba.name) ORDER BY ba.name)
           FROM batches ba 
           WHERE ba.class_id = c.id), 
          '[]'::json
        ) as class_batches,
        asn.id as session_id,
        asn.locked as session_locked
      FROM timetable_slots ts
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      LEFT JOIN attendance_sessions asn ON asn.timetable_slot_id = ts.id 
        AND asn.session_date = CURRENT_DATE
        AND asn.is_archived = false
      WHERE fsm.faculty_id = ${facultyId}
        AND ts.day_of_week::int = ${todayIndex}
      ORDER BY ts.start_time;
    `;

    console.log(`[Faculty Timetable] Found ${result.length} total slots. Days:`, result.map(r => `${r.subject}=day${r.day_of_week}`));

    res.json(result);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
}

export const getAttendanceSessions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get faculty record
    const facultyRecord = await sql`
      SELECT id FROM faculty WHERE user_id = ${userId}
    `;

    if (!facultyRecord.length) {
      return res.status(404).json({ error: 'Faculty record not found' });
    }

    const facultyId = facultyRecord[0].id;

    // Get all attendance sessions for this faculty
    const sessions = await sql`
      SELECT 
        asn.id,
        s.name as subject_name,
        CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class_name,
        asn.session_date,
        ts.start_time,
        asn.locked,
        COUNT(CASE WHEN ar.status = 'P' THEN 1 END) as present_count,
        COUNT(CASE WHEN ar.status = 'A' THEN 1 END) as absent_count,
        COUNT(ar.id) as total_students
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      LEFT JOIN attendance_records ar ON ar.session_id = asn.id
      WHERE fsm.faculty_id = ${facultyId}
        AND asn.is_archived = false
      GROUP BY asn.id, s.name, p.name, c.batch_year, d.name, asn.session_date, ts.start_time, asn.locked
      ORDER BY asn.session_date DESC, ts.start_time DESC;
    `;

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching attendance sessions:', error);
    res.status(500).json({ error: 'Failed to fetch attendance sessions' });
  }
}

export const exportSessionCSV = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. Get Session Details
    const sessionResult = await sql`
      SELECT 
        asn.id,
        asn.session_date,
        ts.start_time,
        ts.end_time,
        s.name as subject_name,
        CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class_name
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      WHERE asn.id = ${sessionId}
    `;

    if (sessionResult.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionResult[0];

    // 2. Get Attendance Records (if any)
    const records = await sql`
      SELECT 
        s.roll_no,
        u.name as student_name,
        ar.status
      FROM attendance_records ar
      JOIN students s ON s.id = ar.student_id
      JOIN users u ON u.id = s.user_id
      WHERE ar.session_id = ${sessionId}
      ORDER BY s.roll_no
    `;

    // 3. Build CSV
    const header = 'Roll No,Student Name,Status,Subject,Class,Date,Time\n';

    let rows = '';
    if (records.length > 0) {
      rows = records.map(r =>
        `${r.roll_no},${r.student_name},${r.status === 'P' ? 'Present' : 'Absent'},${session.subject_name},${session.class_name},${new Date(session.session_date).toLocaleDateString()},${session.start_time}`
      ).join('\n');
    } else {
      rows = `N/A,No Records Found,N/A,${session.subject_name},${session.class_name},${new Date(session.session_date).toLocaleDateString()},${session.start_time}`;
    }

    const csv = header + rows;

    // Format filename with date and time range
    const dateStr = new Date(session.session_date).toLocaleDateString('en-GB').split('/').join('-');
    const startTimeStr = session.start_time.replace(':', '-');
    const endTimeStr = session.end_time.replace(':', '-');
    const filename = `attendance_${dateStr}_${startTimeStr}_${endTimeStr}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}

export const exportSessionPDF = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. Get Session Details
    const sessionResult = await sql`
      SELECT 
        asn.id,
        asn.session_date,
        ts.start_time,
        ts.end_time,
        s.name as subject_name,
        CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class_name
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      JOIN subjects s ON s.id = fsm.subject_id
      JOIN classes c ON c.id = fsm.class_id
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
      WHERE asn.id = ${sessionId}
    `;

    if (sessionResult.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const sessionInfo = sessionResult[0];

    // 2. Get Attendance Records
    const records = await sql`
      SELECT 
        s.roll_no,
        u.name as student_name,
        ar.status
      FROM attendance_records ar
      JOIN students s ON s.id = ar.student_id
      JOIN users u ON u.id = s.user_id
      WHERE ar.session_id = ${sessionId}
      ORDER BY s.roll_no
    `;

    const presentCount = records.filter(r => r.status === 'P').length;
    const absentCount = records.filter(r => r.status === 'A').length;

    // Helper function to convert 24-hour time to 12-hour format
    const formatTime12Hour = (time24) => {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Create PDF using PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Format filename with date and time range
    const dateStr = new Date(sessionInfo.session_date).toLocaleDateString('en-GB').split('/').join('-');
    const startTimeStr = sessionInfo.start_time.replace(':', '-');
    const endTimeStr = sessionInfo.end_time.replace(':', '-');
    const filename = `attendance_${dateStr}_${startTimeStr}_${endTimeStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Initial calculations
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;

    // --- Header Section ---
    // Draw colored header background
    doc.rect(0, 0, pageWidth, 120).fill('#4f46e5'); // Indigo-600

    // Title
    doc.fontSize(26)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('Attendance Report', 50, 45);

    // Session Date/Time in Header
    const startTime12 = formatTime12Hour(sessionInfo.start_time);
    const endTime12 = formatTime12Hour(sessionInfo.end_time);
    doc.fontSize(12)
      .font('Helvetica')
      .text(`${new Date(sessionInfo.session_date).toLocaleDateString('en-GB')} • ${startTime12} - ${endTime12}`, 50, 80);

    doc.moveDown();

    // --- Session Details Section ---
    let yPos = 160;

    doc.fillColor('#1e293b'); // Dark Slate
    doc.fontSize(10).font('Helvetica-Bold').text('SUBJECT DETAILS', 50, yPos);

    yPos += 20;
    doc.rect(50, yPos, contentWidth, 60).fill('#f8fafc').opacity(1); // Light background

    doc.fillColor('#334155').fontSize(12).font('Helvetica-Bold')
      .text(sessionInfo.subject_name, 65, yPos + 15);

    doc.fontSize(10).font('Helvetica')
      .text(sessionInfo.class_name, 65, yPos + 35);

    // --- Summary Stats ---
    yPos += 80;

    // Stats Boxes
    const boxWidth = contentWidth / 3 - 10;
    const boxHeight = 50;

    // Present Box
    doc.rect(50, yPos, boxWidth, boxHeight).fill('#dcfce7'); // Green-100
    doc.fillColor('#15803d').fontSize(10).font('Helvetica-Bold').text('PRESENT', 65, yPos + 10);
    doc.fontSize(18).text(presentCount, 65, yPos + 25);

    // Absent Box
    doc.rect(50 + boxWidth + 15, yPos, boxWidth, boxHeight).fill('#fee2e2'); // Red-100
    doc.fillColor('#b91c1c').fontSize(10).font('Helvetica-Bold').text('ABSENT', 65 + boxWidth + 15, yPos + 10);
    doc.fontSize(18).text(absentCount, 65 + boxWidth + 15, yPos + 25);

    // Total Box
    doc.rect(50 + (boxWidth + 15) * 2, yPos, boxWidth, boxHeight).fill('#f1f5f9'); // Slate-100
    doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('TOTAL', 65 + (boxWidth + 15) * 2, yPos + 10);
    doc.fontSize(18).text(records.length, 65 + (boxWidth + 15) * 2, yPos + 25);

    // --- Student List Table ---
    yPos += 80;
    const tableTop = yPos;

    // Table Header
    doc.rect(50, yPos, contentWidth, 30).fill('#e2e8f0'); // Slate-200 header
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');

    doc.text('Roll No', 65, yPos + 10);
    doc.text('Student Name', 160, yPos + 10);
    doc.text('Status', 450, yPos + 10);

    yPos += 30;

    // Rows
    doc.font('Helvetica').fontSize(10);

    if (records.length === 0) {
      doc.fillColor('#64748b').text('No attendance records found.', 65, yPos + 15);
    } else {
      const rowHeight = 30;
      const pageBottomMargin = 80; // Leave space at bottom of page

      records.forEach((r, i) => {
        // Check if we need a page break BEFORE drawing the row
        // Ensure we have space for the row (30px) plus margin
        if (yPos + rowHeight > doc.page.height - pageBottomMargin) {
          doc.addPage();
          yPos = 50;

          // Redraw table header on new page
          doc.rect(50, yPos, contentWidth, 30).fill('#e2e8f0');
          doc.fillColor('#1e293b').font('Helvetica-Bold');
          doc.text('Roll No', 65, yPos + 10);
          doc.text('Student Name', 160, yPos + 10);
          doc.text('Status', 450, yPos + 10);
          doc.font('Helvetica');
          yPos += 30;
        }

        // Zebra striping
        if (i % 2 === 1) {
          doc.rect(50, yPos, contentWidth, rowHeight).fill('#f8fafc');
        }

        doc.fillColor('#334155');
        // Vertical alignment
        const textY = yPos + 10;

        doc.text(r.roll_no, 65, textY);
        doc.text(r.student_name, 160, textY);

        // Status Badge
        const statusColor = r.status === 'P' ? '#16a34a' : '#dc2626'; // Green / Red
        doc.fillColor(statusColor).font('Helvetica-Bold');
        doc.text(r.status === 'P' ? 'Present' : 'Absent', 450, textY);

        doc.font('Helvetica'); // Reset
        yPos += rowHeight;
      });
    }

    // Matches the bottom line
    doc.moveTo(50, yPos).lineTo(50 + contentWidth, yPos).strokeColor('#e2e8f0').stroke();

    // End the document
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    // If headers are already sent, we can't send JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
}

export const getLeaderboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    // 1. Get Faculty ID
    const facultyRecord = await sql`SELECT id FROM faculty WHERE user_id = ${userId}`;
    if (!facultyRecord.length) return res.status(404).json({ error: 'Faculty record not found' });
    const facultyId = facultyRecord[0].id;

    // 2. Determine Scope
    const { classId, subjectId, type } = req.query;

    if (classId && subjectId) {
      // --- Specific Leaderboard ---

      // Filter condition for sessions based on type and student batch
      const sessionFilter = (type === 'theory')
        ? sql`AND ts.batch_id IS NULL`
        : (type === 'practical')
          ? sql`AND ts.batch_id = s.batch_id`
          : sql`AND (ts.batch_id IS NULL OR ts.batch_id = s.batch_id)`;

      // Filter for the attended sessions check (Applied inside COUNT to avoid filtering out students)
      const countConditional = (type === 'theory')
        ? sql`AND ts_ar.batch_id IS NULL`
        : (type === 'practical')
          ? sql`AND ts_ar.batch_id IS NOT NULL`
          : sql``;

      const leaderboardData = await sql`
        SELECT 
          s.id as student_id,
          s.roll_no,
          u.name as student_name,
          b.name as batch_name,
          
          -- Count attended sessions (filtered by type)
          COUNT(DISTINCT CASE 
            WHEN ar.status = 'P' ${countConditional} 
            THEN ar.session_id 
          END) as attended,

          -- Calculate total sessions applicable to this student
          (
            SELECT COUNT(DISTINCT asn.id)
            FROM attendance_sessions asn
            JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
            JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
            WHERE fsm.class_id = ${classId} 
              AND fsm.subject_id = ${subjectId}
              AND fsm.faculty_id = ${facultyId}
              AND asn.is_archived = false
              ${sessionFilter}
          ) as total_sessions

        FROM students s
        JOIN users u ON u.id = s.user_id
        LEFT JOIN batches b ON b.id = s.batch_id
        LEFT JOIN attendance_records ar ON ar.student_id = s.id AND ar.status = 'P'
        LEFT JOIN attendance_sessions asn_ar ON asn_ar.id = ar.session_id
        LEFT JOIN timetable_slots ts_ar ON ts_ar.id = asn_ar.timetable_slot_id
        
        WHERE s.class_id = ${classId} AND s.is_active = true
        
        GROUP BY s.id, s.roll_no, u.name, s.batch_id, b.name
        ORDER BY b.name ASC, attended DESC, s.roll_no ASC
      `;

      // Enriched process
      const processed = leaderboardData.map((s, index) => {
        const total = parseInt(s.total_sessions) || 0;
        const attended = parseInt(s.attended) || 0;
        return {
          rank: index + 1,
          id: s.student_id,
          rollNo: s.roll_no,
          name: s.student_name,
          batchName: s.batch_name || 'Unassigned',
          attended,
          total,
          percentage: total > 0 ? Math.round((attended / total) * 100) : 0
        };
      });

      return res.json({ type: 'leaderboard', data: processed });

    } else {
      // --- List of Classes/Subjects ---
      const mappings = await sql`
        SELECT DISTINCT
          c.id as class_id,
          CONCAT(p.name, ' Y', c.batch_year, CASE WHEN d.name IS NOT NULL THEN '-' || d.name ELSE '' END) as class_name,
          s.id as subject_id,
          s.name as subject_name
        FROM faculty_subject_map fsm
        JOIN classes c ON c.id = fsm.class_id
        JOIN subjects s ON s.id = fsm.subject_id
        JOIN programs p ON p.id = c.program_id
        LEFT JOIN divisions d ON d.id = c.division_id
        WHERE fsm.faculty_id = ${facultyId}
        ORDER BY class_name, s.name
      `;

      return res.json({ type: 'options', data: mappings });
    }

  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard stats' });
  }
}

export const getAttendanceRecords = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    // Get Faculty ID
    const facultyRecord = await sql`SELECT id FROM faculty WHERE user_id = ${userId}`;
    if (!facultyRecord.length) return res.status(404).json({ error: 'Faculty record not found' });
    const facultyId = facultyRecord[0].id;

    const { classId, batchId, subjectId, type } = req.query;

    if (!classId || !subjectId) {
      return res.status(400).json({ error: 'classId and subjectId are required' });
    }

    // Determine session filter based on type
    // If type is 'theory', only get NULL batch_id
    // If type is 'practical', get non-NULL batch_id (and filter by specific batch if provided)
    // If type is not specified (legacy), keep existing behavior or default to both? Let's default to theory if no batch, both if batch.

    let sessionCondition = sql``;

    if (type === 'theory') {
      sessionCondition = sql`AND ts.batch_id IS NULL`;
    } else if (type === 'practical') {
      if (batchId) {
        sessionCondition = sql`AND ts.batch_id = ${batchId}`;
      } else {
        sessionCondition = sql`AND ts.batch_id IS NOT NULL`;
      }
    } else {
      // Fallback/Legacy logic
      if (batchId) {
        sessionCondition = sql`AND (ts.batch_id = ${batchId} OR ts.batch_id IS NULL)`;
      } else {
        sessionCondition = sql`AND ts.batch_id IS NULL`;
      }
    }

    // 1. Get all locked sessions
    const sessions = await sql`
      SELECT 
        asn.id as session_id,
        asn.session_date,
        ts.start_time,
        ts.end_time,
        ts.batch_id,
        b.name as batch_name
      FROM attendance_sessions asn
      JOIN timetable_slots ts ON ts.id = asn.timetable_slot_id
      JOIN faculty_subject_map fsm ON fsm.id = ts.faculty_subject_map_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      WHERE fsm.faculty_id = ${facultyId}
        AND fsm.class_id = ${classId}
        AND fsm.subject_id = ${subjectId}
        ${sessionCondition}
        AND asn.locked = true
        AND asn.is_archived = false
      ORDER BY asn.session_date ASC, ts.start_time ASC
    `;

    // 2. Get students
    // If type is practical and batchId is provided, filter students.
    // Otherwise get all students.

    let studentCondition = sql``;
    if (type === 'practical' && batchId) {
      studentCondition = sql`AND s.batch_id = ${batchId}`;
    } else if (!type && batchId) {
      // Legacy behavior: if batch provided, filter students?
      // The original code filtered students if batchId was present.
      studentCondition = sql`AND s.batch_id = ${batchId}`;
    }

    const students = await sql`
      SELECT 
        s.id as student_id,
        s.roll_no,
        u.name as full_name,
        s.batch_id
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.class_id = ${classId}
        AND s.is_active = true
        ${studentCondition}
      ORDER BY s.roll_no ASC
    `;

    // 3. Get all attendance records for these sessions
    const sessionIds = sessions.map(s => s.session_id);

    let attendanceRecords = [];
    if (sessionIds.length > 0) {
      attendanceRecords = await sql`
        SELECT 
          ar.student_id,
          ar.session_id,
          ar.status
        FROM attendance_records ar
        WHERE ar.session_id = ANY(${sessionIds})
      `;
    }

    // 4. Build the response structure
    // Create a map for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      const key = `${record.student_id}-${record.session_id}`;
      attendanceMap[key] = record.status;
    });

    // Build student records with attendance data
    const records = students.map((student, index) => {
      const record = {
        srNo: index + 1,
        rollNo: student.roll_no,
        fullName: student.full_name,
        attendance: {}
      };

      // Add attendance for each session
      sessions.forEach(session => {
        const key = `${student.student_id}-${session.session_id}`;
        // Include time range and batch name to differentiate sessions
        let dateKey = `${new Date(session.session_date).toLocaleDateString('en-GB').split('/').join('-')} ${session.start_time}-${session.end_time}`;
        if (session.batch_name) {
          dateKey += ` (${session.batch_name})`;
        }
        record.attendance[dateKey] = attendanceMap[key] || '-';
      });

      return record;
    });

    // 5. Build date headers with time range and batch name
    const dateHeaders = sessions.map(session => {
      let header = `${new Date(session.session_date).toLocaleDateString('en-GB').split('/').join('-')} ${session.start_time}-${session.end_time}`;
      if (session.batch_name) {
        header += ` (${session.batch_name})`;
      }
      return header;
    });

    res.json({
      dateHeaders,
      records
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
}
