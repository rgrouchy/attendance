import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { studentAPI } from '../../services/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudentData();
  }, [id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError('');

      const [studentResponse, classesResponse, attendanceResponse] = await Promise.all([
        studentAPI.getById(id),
        studentAPI.getClasses(id),
        studentAPI.getAttendance(id)
      ]);

      setStudent(studentResponse.data);
      setClasses(classesResponse.data);
      setAttendanceHistory(attendanceResponse.data);
    } catch (err) {
      console.error('Error loading student data:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceHistory.length;
    const present = attendanceHistory.filter(a => a.status === 'present').length;
    const late = attendanceHistory.filter(a => a.status === 'late').length;
    const absent = attendanceHistory.filter(a => a.status === 'absent').length;
    const excused = attendanceHistory.filter(a => a.status === 'excused').length;
    
    const attendanceRate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;
    
    return { total, present, late, absent, excused, attendanceRate };
  };

  const getAttendanceBadgeVariant = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'danger';
      case 'excused': return 'secondary';
      default: return 'secondary';
    }
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

  if (!student) {
    return (
      <Alert variant="danger">
        Student not found.
      </Alert>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{student.first_name} {student.last_name}</h1>
        <div>
          <Button
            as={Link}
            to={`/students/${id}/edit`}
            variant="outline-primary"
            className="me-2"
          >
            Edit Student
          </Button>
          <Button variant="secondary" onClick={() => navigate('/students')}>
            Back to Students
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="row">
        <div className="col-md-8">
          {/* Student Information */}
          <Card className="mb-4">
            <Card.Header>Student Information</Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Student ID:</strong> {student.student_id}</p>
                  <p><strong>Full Name:</strong> {student.first_name} {student.last_name}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${student.email}`}>{student.email}</a></p>
                </div>
                <div className="col-md-6">
                  <p><strong>Created:</strong> {new Date(student.created_at).toLocaleDateString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(student.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              {student.notes && (
                <div className="mt-3">
                  <strong>Notes:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {student.notes}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Enrolled Classes */}
          <Card className="mb-4">
            <Card.Header>Enrolled Classes ({classes.length})</Card.Header>
            <Card.Body>
              {classes.length === 0 ? (
                <p className="text-muted">Student is not enrolled in any classes.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Name</th>
                      <th>Instructor</th>
                      <th>Semester</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((classItem) => (
                      <tr key={classItem.id}>
                        <td><strong>{classItem.course_number}</strong></td>
                        <td>{classItem.course_name}</td>
                        <td>{classItem.instructor_name || '-'}</td>
                        <td>
                          <Badge variant={getSemesterBadgeVariant(classItem.semester_season)}>
                            {classItem.semester_season} {classItem.semester_year}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={classItem.enrollment_status === 'enrolled' ? 'success' : 'secondary'}>
                            {classItem.enrollment_status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            as={Link}
                            to={`/classes/${classItem.id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            View Class
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Attendance History */}
          <Card>
            <Card.Header>Attendance History ({attendanceHistory.length} sessions)</Card.Header>
            <Card.Body>
              {attendanceHistory.length === 0 ? (
                <p className="text-muted">No attendance records found.</p>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Class</th>
                        <th>Session</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory
                        .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
                        .map((record) => (
                        <tr key={record.id} className={`attendance-${record.status}`}>
                          <td>{new Date(record.session_date).toLocaleDateString()}</td>
                          <td>{record.course_number}</td>
                          <td>{record.session_title || 'Regular Session'}</td>
                          <td>
                            <Badge variant={getAttendanceBadgeVariant(record.status)}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            {record.notes ? (
                              <span className="text-muted">
                                {record.notes.length > 30 
                                  ? `${record.notes.substring(0, 30)}...` 
                                  : record.notes
                                }
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="text-muted small">
                            {new Date(record.recorded_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          {/* Attendance Statistics */}
          <Card className="mb-4">
            <Card.Header>Attendance Summary</Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="stats-number text-primary">{stats.attendanceRate}%</div>
                <div>Attendance Rate</div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Total Sessions:</span>
                  <strong>{stats.total}</strong>
                </div>
                <div className="d-flex justify-content-between text-success">
                  <span>Present:</span>
                  <strong>{stats.present}</strong>
                </div>
                <div className="d-flex justify-content-between text-warning">
                  <span>Late:</span>
                  <strong>{stats.late}</strong>
                </div>
                <div className="d-flex justify-content-between text-danger">
                  <span>Absent:</span>
                  <strong>{stats.absent}</strong>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Excused:</span>
                  <strong>{stats.excused}</strong>
                </div>
              </div>

              {stats.total > 0 && (
                <div className="progress" style={{ height: '10px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${(stats.present / stats.total) * 100}%` }}
                  ></div>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${(stats.late / stats.total) * 100}%` }}
                  ></div>
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${(stats.absent / stats.total) * 100}%` }}
                  ></div>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: `${(stats.excused / stats.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to={`/students/${id}/edit`} variant="primary">
                  Edit Student Info
                </Button>
                <Button as={Link} to="/attendance/new" variant="outline-primary">
                  Take Attendance
                </Button>
                <Button 
                  href={`mailto:${student.email}`} 
                  variant="outline-secondary"
                >
                  Send Email
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
