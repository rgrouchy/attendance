import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Table, Badge, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { attendanceAPI, classAPI } from '../../services/api';

const AttendanceList = () => {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedClassId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sessionsResponse, classesResponse] = await Promise.all([
        attendanceAPI.getAllSessions(),
        classAPI.getAll()
      ]);
      setSessions(sessionsResponse.data);
      setClasses(classesResponse.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setError('');
      const response = await attendanceAPI.getAllSessions(selectedClassId || null);
      setSessions(response.data);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load attendance sessions');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setError('');
      await attendanceAPI.deleteSession(sessionToDelete.id);
      setSuccess(`Attendance session deleted successfully`);
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete attendance session');
      setShowDeleteModal(false);
    }
  };

  const confirmDelete = (session) => {
    setSessionToDelete(session);
    setShowDeleteModal(true);
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

  const getDateStatus = (sessionDate) => {
    const today = new Date();
    const session = new Date(sessionDate);
    const diffTime = session - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { variant: 'info', text: `In ${diffDays} day${diffDays !== 1 ? 's' : ''}` };
    } else if (diffDays === 0) {
      return { variant: 'warning', text: 'Today' };
    } else if (diffDays > -7) {
      return { variant: 'success', text: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago` };
    } else {
      return { variant: 'secondary', text: session.toLocaleDateString() };
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Attendance Sessions ({sessions.length})</h1>
        <Button as={Link} to="/attendance/new" variant="primary">
          Create New Session
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filter by Class */}
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Filter by Class</Form.Label>
            <Form.Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.course_number} - {classItem.course_name} ({classItem.semester_season} {classItem.semester_year})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {sessions.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <h5>No Attendance Sessions Found</h5>
            <p className="text-muted">
              {selectedClassId 
                ? 'No attendance sessions found for the selected class.' 
                : 'Get started by creating your first attendance session.'
              }
            </p>
            <Button as={Link} to="/attendance/new" variant="primary">
              Create Session
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Session Title</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
                    .map((session) => {
                      const dateStatus = getDateStatus(session.session_date);
                      return (
                        <tr key={session.id}>
                          <td>
                            <div>
                              <strong>{new Date(session.session_date).toLocaleDateString()}</strong>
                              <br />
                              <Badge variant={dateStatus.variant} size="sm">
                                {dateStatus.text}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{session.course_number}</strong>
                              <br />
                              <small className="text-muted">{session.course_name}</small>
                            </div>
                          </td>
                          <td>
                            {session.session_title || (
                              <span className="text-muted">Regular Session</span>
                            )}
                          </td>
                          <td>
                            <Badge variant={dateStatus.variant}>
                              {dateStatus.text}
                            </Badge>
                          </td>
                          <td>
                            {session.notes ? (
                              <span className="text-muted">
                                {session.notes.length > 40 
                                  ? `${session.notes.substring(0, 40)}...` 
                                  : session.notes
                                }
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-muted small">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                as={Link}
                                to={`/attendance/${session.id}`}
                                variant="outline-primary"
                                size="sm"
                              >
                                Take Attendance
                              </Button>
                              <Button
                                as={Link}
                                to={`/attendance/${session.id}/edit`}
                                variant="outline-secondary"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => confirmDelete(session)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the attendance session for "
          {sessionToDelete?.course_number}" on {new Date(sessionToDelete?.session_date).toLocaleDateString()}?
          <br />
          <strong>This action cannot be undone and will also delete all attendance records for this session.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSession}>
            Delete Session
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceList;
