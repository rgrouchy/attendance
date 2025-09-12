const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Class Attendance API is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Class Attendance API',
    version: '1.0.0',
    endpoints: {
      classes: {
        'GET /api/classes': 'Get all classes',
        'GET /api/classes/:id': 'Get class by ID',
        'POST /api/classes': 'Create new class',
        'PUT /api/classes/:id': 'Update class',
        'DELETE /api/classes/:id': 'Delete class',
        'GET /api/classes/:id/students': 'Get students in class',
        'POST /api/classes/:id/students': 'Add student to class',
        'DELETE /api/classes/:id/students/:studentId': 'Remove student from class'
      },
      students: {
        'GET /api/students': 'Get all students',
        'GET /api/students/:id': 'Get student by ID',
        'GET /api/students/by-student-id/:studentId': 'Get student by student ID',
        'POST /api/students': 'Create new student',
        'PUT /api/students/:id': 'Update student',
        'DELETE /api/students/:id': 'Delete student',
        'GET /api/students/:id/classes': 'Get classes for student',
        'GET /api/students/:id/attendance': 'Get attendance history for student'
      },
      attendance: {
        'GET /api/attendance/sessions': 'Get all attendance sessions',
        'GET /api/attendance/sessions/:id': 'Get attendance session by ID',
        'POST /api/attendance/sessions': 'Create attendance session',
        'PUT /api/attendance/sessions/:id': 'Update attendance session',
        'DELETE /api/attendance/sessions/:id': 'Delete attendance session',
        'GET /api/attendance/sessions/:id/attendance': 'Get attendance for session',
        'POST /api/attendance/record': 'Record student attendance',
        'PUT /api/attendance/record/:id': 'Update attendance record',
        'DELETE /api/attendance/record/:id': 'Delete attendance record',
        'GET /api/attendance/stats/:classId': 'Get attendance statistics'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Class Attendance API Server is running on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   Classes: http://localhost:${PORT}/api/classes`);
      console.log(`   Students: http://localhost:${PORT}/api/students`);
      console.log(`   Attendance: http://localhost:${PORT}/api/attendance`);
      console.log(`\n💡 Make sure to run the database migration first:`);
      console.log(`   npm run migrate\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
