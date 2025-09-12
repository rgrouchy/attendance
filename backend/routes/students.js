const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const router = express.Router();

// Validation middleware
const validateStudent = [
  body('student_id').notEmpty().withMessage('Student ID is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
];

// GET /api/students - Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// GET /api/students/by-student-id/:studentId - Get student by student_id
router.get('/by-student-id/:studentId', async (req, res) => {
  try {
    const student = await Student.findByStudentId(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students - Create new student
router.post('/', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newStudent = await Student.create(req.body);
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('student_id')) {
        res.status(400).json({ error: 'A student with this student ID already exists' });
      } else if (error.message.includes('email')) {
        res.status(400).json({ error: 'A student with this email already exists' });
      } else {
        res.status(400).json({ error: 'Student already exists' });
      }
    } else {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updatedStudent = await Student.update(req.params.id, req.body);
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('student_id')) {
        res.status(400).json({ error: 'A student with this student ID already exists' });
      } else if (error.message.includes('email')) {
        res.status(400).json({ error: 'A student with this email already exists' });
      } else {
        res.status(400).json({ error: 'Student already exists' });
      }
    } else {
      res.status(500).json({ error: 'Failed to update student' });
    }
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const deleted = await Student.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Student deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete student' });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// GET /api/students/:id/classes - Get classes for a student
router.get('/:id/classes', async (req, res) => {
  try {
    const classes = await Student.getClasses(req.params.id);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ error: 'Failed to fetch student classes' });
  }
});

// GET /api/students/:id/attendance - Get attendance history for a student
router.get('/:id/attendance', async (req, res) => {
  try {
    const { class_id } = req.query;
    const attendance = await Student.getAttendanceHistory(req.params.id, class_id);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

module.exports = router;
