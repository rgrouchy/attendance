const { pool } = require('../config/database');

class Attendance {
  // Attendance Sessions
  static async findAllSessions(classId = null) {
    let query = `
      SELECT ats.*, c.course_number, c.course_name
      FROM attendance_sessions ats
      JOIN classes c ON ats.class_id = c.id
    `;
    
    const params = [];
    
    if (classId) {
      query += ' WHERE ats.class_id = ?';
      params.push(classId);
    }
    
    query += ' ORDER BY ats.session_date DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findSessionById(id) {
    const [rows] = await pool.execute(`
      SELECT ats.*, c.course_number, c.course_name
      FROM attendance_sessions ats
      JOIN classes c ON ats.class_id = c.id
      WHERE ats.id = ?
    `, [id]);
    return rows[0];
  }

  static async createSession(sessionData) {
    const { class_id, session_date, session_title, notes } = sessionData;
    const [result] = await pool.execute(
      'INSERT INTO attendance_sessions (class_id, session_date, session_title, notes) VALUES (?, ?, ?, ?)',
      [class_id, session_date, session_title, notes]
    );
    return { id: result.insertId, ...sessionData };
  }

  static async updateSession(id, sessionData) {
    const { class_id, session_date, session_title, notes } = sessionData;
    await pool.execute(
      'UPDATE attendance_sessions SET class_id = ?, session_date = ?, session_title = ?, notes = ? WHERE id = ?',
      [class_id, session_date, session_title, notes, id]
    );
    return { id, ...sessionData };
  }

  static async deleteSession(id) {
    const [result] = await pool.execute('DELETE FROM attendance_sessions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Student Attendance Records
  static async getSessionAttendance(sessionId) {
    const [rows] = await pool.execute(`
      SELECT 
        sa.*,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      WHERE sa.attendance_session_id = ?
      ORDER BY s.last_name, s.first_name
    `, [sessionId]);
    return rows;
  }

  static async recordAttendance(attendanceData) {
    const { attendance_session_id, student_id, status, notes, recorded_by } = attendanceData;
    
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle updates
    const [result] = await pool.execute(`
      INSERT INTO student_attendance (attendance_session_id, student_id, status, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      notes = VALUES(notes),
      recorded_by = VALUES(recorded_by),
      recorded_at = CURRENT_TIMESTAMP
    `, [attendance_session_id, student_id, status, notes, recorded_by]);
    
    return { id: result.insertId, ...attendanceData };
  }

  static async updateAttendance(id, attendanceData) {
    const { status, notes, recorded_by } = attendanceData;
    await pool.execute(
      'UPDATE student_attendance SET status = ?, notes = ?, recorded_by = ?, recorded_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes, recorded_by, id]
    );
    return { id, ...attendanceData };
  }

  static async deleteAttendance(id) {
    const [result] = await pool.execute('DELETE FROM student_attendance WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getAttendanceStats(classId, studentId = null) {
    let query = `
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.first_name,
        s.last_name,
        COUNT(sa.id) as total_sessions,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN sa.status = 'excused' THEN 1 ELSE 0 END) as excused_count
      FROM students s
      JOIN student_classes sc ON s.id = sc.student_id
      LEFT JOIN student_attendance sa ON s.id = sa.student_id
      LEFT JOIN attendance_sessions ats ON sa.attendance_session_id = ats.id AND ats.class_id = sc.class_id
      WHERE sc.class_id = ? AND sc.status = 'enrolled'
    `;

    const params = [classId];

    if (studentId) {
      query += ' AND s.id = ?';
      params.push(studentId);
    }

    query += ' GROUP BY s.id ORDER BY s.last_name, s.first_name';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Attendance;
