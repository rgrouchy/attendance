const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const router = express.Router();

// Validation middleware
const validateClass = [
  body('course_number').notEmpty().withMessage('Course number is required'),
  body('course_name').notEmpty().withMessage('Course name is required'),
  body('semester_year').isInt({ min: 2020, max: 2030 }).withMessage('Valid semester year is required'),
  body('semester_season').isIn(['Spring', 'Summer', 'Fall', 'Winter']).withMessage('Valid semester season is required'),
];

// GET /api/classes - Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.findAll();
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/classes/:id - Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /api/classes - Create new class
router.post('/', validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newClass = await Class.create(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'A class with this course number already exists for this semester' });
    } else {
      res.status(500).json({ error: 'Failed to create class' });
    }
  }
});

// PUT /api/classes/:id - Update class
router.put('/:id', validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const updatedClass = await Class.update(req.params.id, req.body);
    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'A class with this course number already exists for this semester' });
    } else {
      res.status(500).json({ error: 'Failed to update class' });
    }
  }
});

// DELETE /api/classes/:id - Delete class
router.delete('/:id', async (req, res) => {
  try {
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const deleted = await Class.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Class deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete class' });
    }
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// GET /api/classes/:id/students - Get students in a class
router.get('/:id/students', async (req, res) => {
  try {
    const students = await Class.getStudents(req.params.id);
    res.json(students);
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ error: 'Failed to fetch class students' });
  }
});

// POST /api/classes/:id/students - Add student to class
router.post('/:id/students', async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const enrollmentId = await Class.addStudent(req.params.id, student_id);
    res.status(201).json({ 
      message: 'Student added to class successfully',
      enrollment_id: enrollmentId
    });
  } catch (error) {
    console.error('Error adding student to class:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Student is already enrolled in this class' });
    } else {
      res.status(500).json({ error: 'Failed to add student to class' });
    }
  }
});

// DELETE /api/classes/:id/students/:studentId - Remove student from class
router.delete('/:id/students/:studentId', async (req, res) => {
  try {
    const removed = await Class.removeStudent(req.params.id, req.params.studentId);
    if (removed) {
      res.json({ message: 'Student removed from class successfully' });
    } else {
      res.status(404).json({ error: 'Student not found in this class' });
    }
  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({ error: 'Failed to remove student from class' });
  }
});

module.exports = router;
