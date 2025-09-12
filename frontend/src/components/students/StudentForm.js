import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { studentAPI } from '../../services/api';

const StudentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      loadStudent();
    }
  }, [id, isEditing]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentAPI.getById(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Error loading student:', err);
      setError('Failed to load student data');
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

  const validateForm = () => {
    const errors = {};

    if (!formData.student_id.trim()) {
      errors.student_id = 'Student ID is required';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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

      if (isEditing) {
        await studentAPI.update(id, formData);
      } else {
        await studentAPI.create(formData);
      }

      navigate('/students');
    } catch (err) {
      console.error('Error saving student:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save student');
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditing ? 'Edit Student' : 'Add New Student'}</h1>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Student ID *</Form.Label>
                  <Form.Control
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="e.g., STU001"
                    isInvalid={!!validationErrors.student_id}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.student_id}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Unique identifier for the student
                  </Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@email.com"
                    isInvalid={!!validationErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    isInvalid={!!validationErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    isInvalid={!!validationErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-4">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional notes about the student..."
              />
              <Form.Text className="text-muted">
                Any additional information about the student (medical conditions, accommodations, etc.)
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/students')}
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
                  isEditing ? 'Update Student' : 'Add Student'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentForm;
