import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Table, Form, Badge, Modal, Toast } from 'react-bootstrap';
import { attendanceAPI, classAPI } from '../../services/api';

const AttendanceSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSessionData();
  }, [id]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sessionResponse, attendanceResponse] = await Promise.all([
        attendanceAPI.getSessionById(id),
        attendanceAPI.getSessionAttendance(id)
      ]);

      const sessionData = sessionResponse.data;
      setSession(sessionData);

      // Get students enrolled in this class
      const studentsResponse = await classAPI.getStudents(sessionData.class_id);
      const studentsData = studentsResponse.data;
      setStudents(studentsData);

      // Map existing attendance records and normalize id
      const attendanceData = attendanceResponse.data;
      const normalizedAttendance = attendanceData.map(r => ({
        ...r,
        // Ensure we always have a stable `id` for the attendance record
        id: r.attendance_id ?? r.id
      }));
      setAttendanceRecords(normalizedAttendance);

    } catch (err) {
      console.error('Error loading session data:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentAttendance = (studentId) => {
    return attendanceRecords.find(record => record.student_id === studentId);
  };

  const handleAttendanceChange = async (studentId, status) => {
    try {
      setSaving(true);
      setError('');

      const existingRecord = getStudentAttendance(studentId);
      const attendanceData = {
        attendance_session_id: parseInt(id),
        student_id: studentId,
        status: status,
        notes: existingRecord?.notes || '',
        recorded_by: 'Instructor' // This could be made dynamic based on login
      };

      if (existingRecord) {
        // Update existing record
        await attendanceAPI.updateAttendance(existingRecord.id, {
          status: status,
          notes: existingRecord.notes,
          recorded_by: 'Instructor'
        });
        
        // Update local state
        setAttendanceRecords(prev => 
          prev.map(record => 
            record.id === existingRecord.id 
              ? { ...record, status: status }
              : record
          )
        );
      } else {
        // Create new record
        const response = await attendanceAPI.recordAttendance(attendanceData);
        
        // Add to local state
        const student = students.find(s => s.id === studentId);
        setAttendanceRecords(prev => [...prev, {
          id: response.data.id,
          student_id: studentId,
          status: status,
          notes: '',
          student_number: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email
        }]);
      }

      setSuccess('Attendance updated successfully');
    } catch (err) {
      console.error('Error updating attendance:', err);
      setError('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleNotesSubmit = async () => {
    if (!currentStudent) return;

    try {
      setSaving(true);
      setError('');

      const existingRecord = getStudentAttendance(currentStudent.id);
      
      if (existingRecord) {
        await attendanceAPI.updateAttendance(existingRecord.id, {
          status: existingRecord.status,
          notes: notes,
          recorded_by: 'Instructor'
        });
        
        setAttendanceRecords(prev => 
          prev.map(record => 
            record.id === existingRecord.id 
              ? { ...record, notes: notes }
              : record
          )
        );
      } else {
        // Create new record with default status
        const attendanceData = {
          attendance_session_id: parseInt(id),
          student_id: currentStudent.id,
          status: 'present',
          notes: notes,
          recorded_by: 'Instructor'
        };
        
        const response = await attendanceAPI.recordAttendance(attendanceData);
        
        setAttendanceRecords(prev => [...prev, {
          id: response.data.id,
          student_id: currentStudent.id,
          status: 'present',
          notes: notes,
          student_number: currentStudent.student_id,
          first_name: currentStudent.first_name,
          last_name: currentStudent.last_name,
          email: currentStudent.email
        }]);
      }

      setShowNotesModal(false);
      setCurrentStudent(null);
      setNotes('');
      setSuccess('Notes updated successfully');
    } catch (err) {
      console.error('Error updating notes:', err);
      setError('Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  const openNotesModal = (student) => {
    const existingRecord = getStudentAttendance(student.id);
    setCurrentStudent(student);
    setNotes(existingRecord?.notes || '');
    setShowNotesModal(true);
  };

  const getAttendanceBadgeVariant = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      case 'excused': return 'secondary';
      default: return 'light';
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const notTaken = total - attendanceRecords.length;
    
    return { total, present, late, absent, excused, notTaken };
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert variant="danger">
        Attendance session not found.
      </Alert>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Take Attendance</h1>
          <p className="text-muted mb-0">
            {session.course_number} - {session.course_name} | {new Date(session.session_date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <Button
            as={Link}
            to={`/attendance/${id}/edit`}
            variant="outline-secondary"
            className="me-2"
          >
            Edit Session
          </Button>
          <Button variant="secondary" onClick={() => navigate('/attendance')}>
            Back to Sessions
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Non-intrusive success toast (no layout shift) */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
        <Toast onClose={() => setSuccess('')} show={Boolean(success)} delay={3000} autohide bg="success">
          <Toast.Header closeButton>
            <strong className="me-auto">Saved</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="text-white">{success || ''}</Toast.Body>
        </Toast>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <Card>
            <Card.Header>Session Information</Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Class:</strong> {session.course_number} - {session.course_name}</p>
                  <p><strong>Date:</strong> {new Date(session.session_date).toLocaleDateString()}</p>
                  <p><strong>Session:</strong> {session.session_title || 'Regular Session'}</p>
                </div>
                <div className="col-md-6">
                  {session.notes && (
                    <div>
                      <strong>Notes:</strong>
                      <p className="mt-1">{session.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <Card.Header>Attendance Summary</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Students:</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="d-flex justify-content-between text-success mb-2">
                <span>Present:</span>
                <strong>{stats.present}</strong>
              </div>
              <div className="d-flex justify-content-between text-warning mb-2">
                <span>Late:</span>
                <strong>{stats.late}</strong>
              </div>
              <div className="d-flex justify-content-between text-danger mb-2">
                <span>Absent:</span>
                <strong>{stats.absent}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted mb-2">
                <span>Excused:</span>
                <strong>{stats.excused}</strong>
              </div>
              <div className="d-flex justify-content-between text-info">
                <span>Not Taken:</span>
                <strong>{stats.notTaken}</strong>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card>
        <Card.Header>
          Student Attendance ({students.length} students)
        </Card.Header>
        <Card.Body>
          {students.length === 0 ? (
            <Alert variant="info">
              No students are enrolled in this class.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const attendance = getStudentAttendance(student.id);
                    return (
                      <tr key={student.id} className={attendance ? `attendance-${attendance.status}` : ''}>
                        <td><strong>{student.student_id}</strong></td>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            {['present', 'late', 'absent', 'excused'].map((status) => (
                              <Form.Check
                                key={status}
                                type="radio"
                                name={`attendance-${student.id}`}
                                id={`${student.id}-${status}`}
                                label={
                                  <Badge variant={getAttendanceBadgeVariant(status)}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Badge>
                                }
                                checked={attendance?.status === status}
                                onChange={() => handleAttendanceChange(student.id, status)}
                                disabled={saving}
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          {attendance?.notes ? (
                            <span className="text-muted">
                              {attendance.notes.length > 30 
                                ? `${attendance.notes.substring(0, 30)}...` 
                                : attendance.notes
                              }
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openNotesModal(student)}
                            disabled={saving}
                          >
                            {attendance?.notes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Notes Modal */}
      <Modal show={showNotesModal} onHide={() => setShowNotesModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Add Notes - {currentStudent?.first_name} {currentStudent?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes about this student's attendance..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleNotesSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceSession;
