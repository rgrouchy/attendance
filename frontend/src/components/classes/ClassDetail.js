import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Modal, Form, Badge, Table } from 'react-bootstrap';
import { classAPI, studentAPI, attendanceAPI } from '../../services/api';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError('');

      const [classResponse, studentsResponse, sessionsResponse, allStudentsResponse] = await Promise.all([
        classAPI.getById(id),
        classAPI.getStudents(id),
        attendanceAPI.getAllSessions(id),
        studentAPI.getAll()
      ]);

      setClassData(classResponse.data);
      setStudents(studentsResponse.data);
      setAttendanceSessions(sessionsResponse.data);
      setAllStudents(allStudentsResponse.data);
    } catch (err) {
      console.error('Error loading class data:', err);
      setError('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;

    try {
      setAddingStudent(true);
      setError('');
      
      await classAPI.addStudent(id, selectedStudentId);
      setSuccess('Student added to class successfully');
      setShowAddStudentModal(false);
      setSelectedStudentId('');
      
      // Reload students
      const studentsResponse = await classAPI.getStudents(id);
      setStudents(studentsResponse.data);
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.response?.data?.error || 'Failed to add student to class');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      setError('');
      await classAPI.removeStudent(id, studentId);
      setSuccess('Student removed from class successfully');
      
      // Reload students
      const studentsResponse = await classAPI.getStudents(id);
      setStudents(studentsResponse.data);
    } catch (err) {
      console.error('Error removing student:', err);
      setError('Failed to remove student from class');
    }
  };

  const getAvailableStudents = () => {
    const enrolledStudentIds = students.map(s => s.id);
    return allStudents.filter(s => !enrolledStudentIds.includes(s.id));
  };

  const getSemesterBadgeVariant = (season) => {
    switch (season) {
      case 'Spring': return 'success';
      case 'Summer': return 'warning';
      case 'Fall': return 'primary';
      case 'Winter': return 'info';
      default: return 'secondary';
    }
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

  if (!classData) {
    return (
      <Alert variant="danger">
        Class not found.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{classData.course_number} - {classData.course_name}</h1>
        <div>
          <Button
            as={Link}
            to={`/classes/${id}/edit`}
            variant="outline-primary"
            className="me-2"
          >
            Edit Class
          </Button>
          <Button variant="secondary" onClick={() => navigate('/classes')}>
            Back to Classes
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="row">
        <div className="col-md-8">
          {/* Class Information */}
          <Card className="mb-4">
            <Card.Header>Class Information</Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Course Number:</strong> {classData.course_number}</p>
                  <p><strong>Course Name:</strong> {classData.course_name}</p>
                  <p><strong>Instructor:</strong> {classData.instructor_name || 'Not specified'}</p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Semester:</strong>{' '}
                    <Badge variant={getSemesterBadgeVariant(classData.semester_season)}>
                      {classData.semester_season} {classData.semester_year}
                    </Badge>
                  </p>
                  <p><strong>Created:</strong> {new Date(classData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {classData.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-2">{classData.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Students */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Enrolled Students ({students.length})</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddStudentModal(true)}
              >
                Add Student
              </Button>
            </Card.Header>
            <Card.Body>
              {students.length === 0 ? (
                <p className="text-muted">No students enrolled in this class.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Enrolled Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.student_id}</td>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.email}</td>
                        <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                        <td>
                          <Button
                            as={Link}
                            to={`/students/${student.id}`}
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveStudent(student.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          {/* Recent Attendance Sessions */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Recent Sessions</span>
              <Button
                as={Link}
                to="/attendance/new"
                variant="outline-primary"
                size="sm"
              >
                New Session
              </Button>
            </Card.Header>
            <Card.Body>
              {attendanceSessions.length === 0 ? (
                <p className="text-muted">No attendance sessions yet.</p>
              ) : (
                <div>
                  {attendanceSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="mb-3 p-2 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">
                            {new Date(session.session_date).toLocaleDateString()}
                          </div>
                          <div className="small text-muted">
                            {session.session_title || 'Regular Session'}
                          </div>
                        </div>
                        <Button
                          as={Link}
                          to={`/attendance/${session.id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {attendanceSessions.length > 5 && (
                    <Button
                      as={Link}
                      to="/attendance"
                      variant="outline-secondary"
                      size="sm"
                      className="w-100"
                    >
                      View All Sessions
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal show={showAddStudentModal} onHide={() => setShowAddStudentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Student to Class</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Student</Form.Label>
            <Form.Select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Choose a student...</option>
              {getAvailableStudents().map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_id} - {student.first_name} {student.last_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          {getAvailableStudents().length === 0 && (
            <Alert variant="info" className="mt-3">
              All students are already enrolled in this class.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStudentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddStudent}
            disabled={!selectedStudentId || addingStudent}
          >
            {addingStudent ? 'Adding...' : 'Add Student'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClassDetail;
