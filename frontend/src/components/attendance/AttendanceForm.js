import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { attendanceAPI, classAPI } from '../../services/api';

const AttendanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    class_id: '',
    session_date: new Date(),
    session_title: '',
    notes: ''
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadClasses();
    if (isEditing) {
      loadSession();
    }
  }, [id, isEditing]);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getAll();
      setClasses(response.data);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes');
    }
  };

  const loadSession = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await attendanceAPI.getSessionById(id);
      const sessionData = response.data;
      setFormData({
        class_id: sessionData.class_id,
        session_date: new Date(sessionData.session_date),
        session_title: sessionData.session_title || '',
        notes: sessionData.notes || ''
      });
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      session_date: date
    }));
    
    if (validationErrors.session_date) {
      setValidationErrors(prev => ({
        ...prev,
        session_date: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.class_id) {
      errors.class_id = 'Please select a class';
    }

    if (!formData.session_date) {
      errors.session_date = 'Session date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const submitData = {
        ...formData,
        session_date: formData.session_date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };

      if (isEditing) {
        await attendanceAPI.updateSession(id, submitData);
        navigate(`/attendance/${id}`);
      } else {
        const response = await attendanceAPI.createSession(submitData);
        navigate(`/attendance/${response.data.id}`);
      }
    } catch (err) {
      console.error('Error saving session:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save attendance session');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const selectedClass = classes.find(c => c.id.toString() === formData.class_id.toString());

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditing ? 'Edit Attendance Session' : 'Create New Attendance Session'}</h1>
        <Button variant="secondary" onClick={() => navigate('/attendance')}>
          Back to Sessions
        </Button>
      </div>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Class *</Form.Label>
                  <Form.Select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.class_id}
                  >
                    <option value="">Select a class...</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.course_number} - {classItem.course_name} ({classItem.semester_season} {classItem.semester_year})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.class_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Session Date *</Form.Label>
                  <div>
                    <DatePicker
                      selected={formData.session_date}
                      onChange={handleDateChange}
                      dateFormat="yyyy-MM-dd"
                      className={`form-control ${validationErrors.session_date ? 'is-invalid' : ''}`}
                      placeholderText="Select session date"
                    />
                  </div>
                  {validationErrors.session_date && (
                    <div className="invalid-feedback d-block">
                      {validationErrors.session_date}
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            {selectedClass && (
              <Alert variant="info" className="mb-3">
                <strong>Selected Class:</strong> {selectedClass.course_number} - {selectedClass.course_name}<br />
                <strong>Instructor:</strong> {selectedClass.instructor_name || 'Not specified'}<br />
                <strong>Semester:</strong> {selectedClass.semester_season} {selectedClass.semester_year}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Session Title</Form.Label>
              <Form.Control
                type="text"
                name="session_title"
                value={formData.session_title}
                onChange={handleChange}
                placeholder="e.g., Lecture 1, Midterm Exam, Lab Session"
              />
              <Form.Text className="text-muted">
                Optional. If left blank, will be displayed as "Regular Session"
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional notes about this attendance session..."
              />
              <Form.Text className="text-muted">
                Any additional information about this session (topics covered, announcements, etc.)
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/attendance')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Session' : 'Create Session'}
                    {!isEditing && ' & Take Attendance'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {!isEditing && (
        <Alert variant="info" className="mt-3">
          <strong>Next Step:</strong> After creating the session, you'll be redirected to the attendance taking page where you can mark each student's attendance.
        </Alert>
      )}
    </div>
  );
};

export default AttendanceForm;
