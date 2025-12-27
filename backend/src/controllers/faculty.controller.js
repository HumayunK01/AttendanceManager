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
      ORDER BY ts.day_of_week, ts.start_time;
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

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${sessionId}.csv`);
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

    // Create PDF using PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${sessionId}.pdf`);

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
    doc.fontSize(12)
      .font('Helvetica')
      .text(`${new Date(sessionInfo.session_date).toLocaleDateString('en-GB')} • ${sessionInfo.start_time}`, 50, 80);

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
      records.forEach((r, i) => {
        // Check page break
        if (yPos > doc.page.height - 50) {
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
          doc.rect(50, yPos, contentWidth, 30).fill('#f8fafc');
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
        yPos += 30;
      });
    }

    // Matches the bottom line
    doc.moveTo(50, yPos).lineTo(50 + contentWidth, yPos).strokeColor('#e2e8f0').stroke();

    // Footer with Page Numbers
    const range = doc.bufferedPageRange(); // { start: 0, count: 2 }
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94a3b8')
        .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 50, { align: 'center', width: contentWidth });
    }

    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    // If headers are already sent, we can't send JSON error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    } else {
      res.end();
    }
  }
}
