import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { classAPI } from '../../services/api';

const ClassForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    course_number: '',
    course_name: '',
    semester_year: new Date().getFullYear(),
    semester_season: 'Fall',
    instructor_name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      loadClass();
    }
  }, [id, isEditing]);

  const loadClass = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await classAPI.getById(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Error loading class:', err);
      setError('Failed to load class data');
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

    if (!formData.course_number.trim()) {
      errors.course_number = 'Course number is required';
    }

    if (!formData.course_name.trim()) {
      errors.course_name = 'Course name is required';
    }

    if (!formData.semester_year || formData.semester_year < 2020 || formData.semester_year > 2030) {
      errors.semester_year = 'Please enter a valid year between 2020 and 2030';
    }

    if (!formData.semester_season) {
      errors.semester_season = 'Semester season is required';
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
        await classAPI.update(id, formData);
      } else {
        await classAPI.create(formData);
      }

      navigate('/classes');
    } catch (err) {
      console.error('Error saving class:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save class');
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
        <h1>{isEditing ? 'Edit Class' : 'Create New Class'}</h1>
        <Button variant="secondary" onClick={() => navigate('/classes')}>
          Back to Classes
        </Button>
      </div>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Course Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="course_number"
                    value={formData.course_number}
                    onChange={handleChange}
                    placeholder="e.g., CS101"
                    isInvalid={!!validationErrors.course_number}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.course_number}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Course Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleChange}
                    placeholder="e.g., Introduction to Computer Science"
                    isInvalid={!!validationErrors.course_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.course_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Semester Year *</Form.Label>
                  <Form.Control
                    type="number"
                    name="semester_year"
                    value={formData.semester_year}
                    onChange={handleChange}
                    min="2020"
                    max="2030"
                    isInvalid={!!validationErrors.semester_year}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.semester_year}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Semester Season *</Form.Label>
                  <Form.Select
                    name="semester_season"
                    value={formData.semester_season}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.semester_season}
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.semester_season}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Instructor Name</Form.Label>
              <Form.Control
                type="text"
                name="instructor_name"
                value={formData.instructor_name}
                onChange={handleChange}
                placeholder="e.g., Dr. Smith"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional course description"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/classes')}
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
                  isEditing ? 'Update Class' : 'Create Class'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ClassForm;
