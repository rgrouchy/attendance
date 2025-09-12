import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { classAPI, studentAPI, attendanceAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalSessions: 0,
    recentSessions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [classesResponse, studentsResponse, sessionsResponse] = await Promise.all([
        classAPI.getAll(),
        studentAPI.getAll(),
        attendanceAPI.getAllSessions()
      ]);

      const recentSessions = sessionsResponse.data
        .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
        .slice(0, 5);

      setStats({
        totalClasses: classesResponse.data.length,
        totalStudents: studentsResponse.data.length,
        totalSessions: sessionsResponse.data.length,
        recentSessions
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
        <h1>Dashboard</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-number text-primary">{stats.totalClasses}</div>
              <div>Total Classes</div>
              <Button as={Link} to="/classes" variant="outline-primary" size="sm" className="mt-2">
                View Classes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-number text-success">{stats.totalStudents}</div>
              <div>Total Students</div>
              <Button as={Link} to="/students" variant="outline-success" size="sm" className="mt-2">
                View Students
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-number text-info">{stats.totalSessions}</div>
              <div>Attendance Sessions</div>
              <Button as={Link} to="/attendance" variant="outline-info" size="sm" className="mt-2">
                View Sessions
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-number text-warning">📝</div>
              <div>Quick Actions</div>
              <Button as={Link} to="/attendance/new" variant="outline-warning" size="sm" className="mt-2">
                Take Attendance
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>Recent Attendance Sessions</Card.Header>
            <Card.Body>
              {stats.recentSessions.length === 0 ? (
                <p className="text-muted">No attendance sessions found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Class</th>
                        <th>Session Title</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSessions.map((session) => (
                        <tr key={session.id}>
                          <td>{new Date(session.session_date).toLocaleDateString()}</td>
                          <td>{session.course_number} - {session.course_name}</td>
                          <td>{session.session_title || 'Regular Session'}</td>
                          <td>
                            <Button
                              as={Link}
                              to={`/attendance/${session.id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/classes/new" variant="primary">
                  Create New Class
                </Button>
                <Button as={Link} to="/students/new" variant="success">
                  Add New Student
                </Button>
                <Button as={Link} to="/attendance/new" variant="info">
                  Create Attendance Session
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>System Status</Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="text-success me-2">●</div>
                <div>System Online</div>
              </div>
              <div className="d-flex align-items-center mt-2">
                <div className="text-success me-2">●</div>
                <div>Database Connected</div>
              </div>
              <small className="text-muted">Last updated: {new Date().toLocaleString()}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
