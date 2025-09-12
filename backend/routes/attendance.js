const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const router = express.Router();

// Validation middleware for attendance sessions
const validateSession = [
  body('class_id').isInt().withMessage('Valid class ID is required'),
  body('session_date').isDate().withMessage('Valid session date is required'),
];

// Validation middleware for attendance records
const validateAttendance = [
  body('attendance_session_id').isInt().withMessage('Valid attendance session ID is required'),
  body('student_id').isInt().withMessage('Valid student ID is required'),
  body('status').isIn(['present', 'late', 'absent', 'excused']).withMessage('Valid attendance status is required'),
];

// ATTENDANCE SESSIONS

// GET /api/attendance/sessions - Get all attendance sessions
router.get('/sessions', async (req, res) => {
  try {
    const { class_id } = req.query;
    const sessions = await Attendance.findAllSessions(class_id);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching attendance sessions:', error);
    res.status(500).json({ error: 'Failed to fetch attendance sessions' });
  }
});

// GET /api/attendance/sessions/:id - Get attendance session by ID
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await Attendance.findSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Attendance session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching attendance session:', error);
    res.status(500).json({ error: 'Failed to fetch attendance session' });
  }
});

// POST /api/attendance/sessions - Create new attendance session
router.post('/sessions', validateSession, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newSession = await Attendance.createSession(req.body);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating attendance session:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'An attendance session already exists for this class on this date' });
    } else {
      res.status(500).json({ error: 'Failed to create attendance session' });
    }
  }
});

// PUT /api/attendance/sessions/:id - Update attendance session
router.put('/sessions/:id', validateSession, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingSession = await Attendance.findSessionById(req.params.id);
    if (!existingSession) {
      return res.status(404).json({ error: 'Attendance session not found' });
    }

    const updatedSession = await Attendance.updateSession(req.params.id, req.body);
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating attendance session:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'An attendance session already exists for this class on this date' });
    } else {
      res.status(500).json({ error: 'Failed to update attendance session' });
    }
  }
});

// DELETE /api/attendance/sessions/:id - Delete attendance session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const existingSession = await Attendance.findSessionById(req.params.id);
    if (!existingSession) {
      return res.status(404).json({ error: 'Attendance session not found' });
    }

    const deleted = await Attendance.deleteSession(req.params.id);
    if (deleted) {
      res.json({ message: 'Attendance session deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete attendance session' });
    }
  } catch (error) {
    console.error('Error deleting attendance session:', error);
    res.status(500).json({ error: 'Failed to delete attendance session' });
  }
});

// GET /api/attendance/sessions/:id/attendance - Get all attendance records for a session
router.get('/sessions/:id/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.getSessionAttendance(req.params.id);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({ error: 'Failed to fetch session attendance' });
  }
});

// ATTENDANCE RECORDS

// POST /api/attendance/record - Record attendance for a student
router.post('/record', validateAttendance, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newAttendance = await Attendance.recordAttendance(req.body);
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// PUT /api/attendance/record/:id - Update attendance record
router.put('/record/:id', async (req, res) => {
  try {
    const { status, notes, recorded_by } = req.body;
    
    if (!status || !['present', 'late', 'absent', 'excused'].includes(status)) {
      return res.status(400).json({ error: 'Valid attendance status is required' });
    }

    const updatedAttendance = await Attendance.updateAttendance(req.params.id, {
      status,
      notes,
      recorded_by
    });
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// DELETE /api/attendance/record/:id - Delete attendance record
router.delete('/record/:id', async (req, res) => {
  try {
    const deleted = await Attendance.deleteAttendance(req.params.id);
    if (deleted) {
      res.json({ message: 'Attendance record deleted successfully' });
    } else {
      res.status(404).json({ error: 'Attendance record not found' });
    }
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// GET /api/attendance/stats/:classId - Get attendance statistics for a class
router.get('/stats/:classId', async (req, res) => {
  try {
    const { student_id } = req.query;
    const stats = await Attendance.getAttendanceStats(req.params.classId, student_id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

module.exports = router;
