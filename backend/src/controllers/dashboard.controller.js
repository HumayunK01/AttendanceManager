import { sql } from '../config/db.js'

/**
 * Get dashboard statistics including attendance trends
 */
export const getDashboardStats = async (req, res) => {
    try {
        // Get last 7 days of attendance data
        const attendanceTrend = await sql`
      SELECT 
        TO_CHAR(asn.session_date, 'Dy') as day,
        ROUND(
          (COUNT(ar.id) FILTER (WHERE ar.status = 'P')::decimal / NULLIF(COUNT(ar.id), 0)) * 100
        ) as attendance
      FROM attendance_sessions asn
      LEFT JOIN attendance_records ar ON ar.session_id = asn.id
      WHERE asn.session_date >= CURRENT_DATE - INTERVAL '6 days'
        AND asn.session_date <= CURRENT_DATE
        AND asn.is_archived = false
      GROUP BY asn.session_date
      ORDER BY asn.session_date ASC
    `

        // Get total sessions today
        const todaySessions = await sql`
      SELECT COUNT(*) as total
      FROM attendance_sessions
      WHERE session_date = CURRENT_DATE
        AND is_archived = false
    `

        // Get completed sessions today
        const completedSessions = await sql`
      SELECT COUNT(*) as total
      FROM attendance_sessions
      WHERE session_date = CURRENT_DATE
        AND locked = true
        AND is_archived = false
    `

        // Get in-progress sessions
        const inProgressSessions = await sql`
      SELECT COUNT(*) as total
      FROM attendance_sessions
      WHERE session_date = CURRENT_DATE
        AND locked = false
        AND is_archived = false
    `

        res.json({
            attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : [],
            todaySessions: parseInt(todaySessions[0]?.total || 0),
            completedSessions: parseInt(completedSessions[0]?.total || 0),
            inProgressSessions: parseInt(inProgressSessions[0]?.total || 0),
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' })
    }
}
