const { pool } = require('../config/database');

class Student {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM students ORDER BY last_name, first_name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByStudentId(studentId) {
    const [rows] = await pool.execute('SELECT * FROM students WHERE student_id = ?', [studentId]);
    return rows[0];
  }

  static async create(studentData) {
    const { student_id, first_name, last_name, email, notes } = studentData;
    const [result] = await pool.execute(
      'INSERT INTO students (student_id, first_name, last_name, email, notes) VALUES (?, ?, ?, ?, ?)',
      [student_id, first_name, last_name, email, notes]
    );
    return { id: result.insertId, ...studentData };
  }

  static async update(id, studentData) {
    const { student_id, first_name, last_name, email, notes } = studentData;
    await pool.execute(
      'UPDATE students SET student_id = ?, first_name = ?, last_name = ?, email = ?, notes = ? WHERE id = ?',
      [student_id, first_name, last_name, email, notes, id]
    );
    return { id, ...studentData };
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getClasses(studentId) {
    const [rows] = await pool.execute(`
      SELECT c.*, sc.enrollment_date, sc.status as enrollment_status
      FROM classes c
      JOIN student_classes sc ON c.id = sc.class_id
      WHERE sc.student_id = ?
      ORDER BY c.semester_year DESC, c.semester_season, c.course_number
    `, [studentId]);
    return rows;
  }

  static async getAttendanceHistory(studentId, classId = null) {
    let query = `
      SELECT 
        sa.*,
        ats.session_date,
        ats.session_title,
        c.course_number,
        c.course_name
      FROM student_attendance sa
      JOIN attendance_sessions ats ON sa.attendance_session_id = ats.id
      JOIN classes c ON ats.class_id = c.id
      WHERE sa.student_id = ?
    `;
    
    const params = [studentId];
    
    if (classId) {
      query += ' AND ats.class_id = ?';
      params.push(classId);
    }
    
    query += ' ORDER BY ats.session_date DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = Student;
