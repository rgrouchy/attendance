const { pool } = require('../config/database');

class Class {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM classes ORDER BY semester_year DESC, semester_season, course_number');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(classData) {
    const { course_number, course_name, semester_year, semester_season, instructor_name, description } = classData;
    const [result] = await pool.execute(
      'INSERT INTO classes (course_number, course_name, semester_year, semester_season, instructor_name, description) VALUES (?, ?, ?, ?, ?, ?)',
      [course_number, course_name, semester_year, semester_season, instructor_name, description]
    );
    return { id: result.insertId, ...classData };
  }

  static async update(id, classData) {
    const { course_number, course_name, semester_year, semester_season, instructor_name, description } = classData;
    await pool.execute(
      'UPDATE classes SET course_number = ?, course_name = ?, semester_year = ?, semester_season = ?, instructor_name = ?, description = ? WHERE id = ?',
      [course_number, course_name, semester_year, semester_season, instructor_name, description, id]
    );
    return { id, ...classData };
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM classes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getStudents(classId) {
    const [rows] = await pool.execute(`
      SELECT s.*, sc.enrollment_date, sc.status as enrollment_status
      FROM students s
      JOIN student_classes sc ON s.id = sc.student_id
      WHERE sc.class_id = ? AND sc.status = 'enrolled'
      ORDER BY s.last_name, s.first_name
    `, [classId]);
    return rows;
  }

  static async addStudent(classId, studentId) {
    const [result] = await pool.execute(
      'INSERT INTO student_classes (class_id, student_id) VALUES (?, ?)',
      [classId, studentId]
    );
    return result.insertId;
  }

  static async removeStudent(classId, studentId) {
    const [result] = await pool.execute(
      'DELETE FROM student_classes WHERE class_id = ? AND student_id = ?',
      [classId, studentId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Class;
