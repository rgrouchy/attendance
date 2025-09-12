import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ClassList from './components/classes/ClassList';
import ClassForm from './components/classes/ClassForm';
import ClassDetail from './components/classes/ClassDetail';
import StudentList from './components/students/StudentList';
import StudentForm from './components/students/StudentForm';
import StudentDetail from './components/students/StudentDetail';
import AttendanceList from './components/attendance/AttendanceList';
import AttendanceForm from './components/attendance/AttendanceForm';
import AttendanceSession from './components/attendance/AttendanceSession';

function App() {
  return (
    <div className="App">
      <Navigation />
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Class routes */}
          <Route path="/classes" element={<ClassList />} />
          <Route path="/classes/new" element={<ClassForm />} />
          <Route path="/classes/:id" element={<ClassDetail />} />
          <Route path="/classes/:id/edit" element={<ClassForm />} />
          
          {/* Student routes */}
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/new" element={<StudentForm />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/students/:id/edit" element={<StudentForm />} />
          
          {/* Attendance routes */}
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/attendance/new" element={<AttendanceForm />} />
          <Route path="/attendance/:id" element={<AttendanceSession />} />
          <Route path="/attendance/:id/edit" element={<AttendanceForm />} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
