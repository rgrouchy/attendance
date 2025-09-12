import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { classAPI } from '../../services/api';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await classAPI.getAll();
      setClasses(response.data);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      setError('');
      await classAPI.delete(classToDelete.id);
      setSuccess(`Class "${classToDelete.course_number}" deleted successfully`);
      setClasses(classes.filter(c => c.id !== classToDelete.id));
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class');
      setShowDeleteModal(false);
    }
  };

  const confirmDelete = (classItem) => {
    setClassToDelete(classItem);
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
        <h1>Classes</h1>
        <Button as={Link} to="/classes/new" variant="primary">
          Add New Class
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {classes.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <h5>No Classes Found</h5>
            <p className="text-muted">Get started by creating your first class.</p>
            <Button as={Link} to="/classes/new" variant="primary">
              Create Class
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="row">
          {classes.map((classItem) => (
            <div key={classItem.id} className="col-md-6 col-lg-4 mb-3">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{classItem.course_number}</strong>
                  <Badge variant={getSemesterBadgeVariant(classItem.semester_season)}>
                    {classItem.semester_season} {classItem.semester_year}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{classItem.course_name}</Card.Title>
                  {classItem.instructor_name && (
                    <p className="text-muted mb-2">
                      <strong>Instructor:</strong> {classItem.instructor_name}
                    </p>
                  )}
                  {classItem.description && (
                    <p className="small text-muted">{classItem.description}</p>
                  )}
                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      as={Link}
                      to={`/classes/${classItem.id}`}
                      variant="outline-primary"
                      size="sm"
                    >
                      View Details
                    </Button>
                    <div>
                      <Button
                        as={Link}
                        to={`/classes/${classItem.id}/edit`}
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => confirmDelete(classItem)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the class "
          {classToDelete?.course_number} - {classToDelete?.course_name}"?
          <br />
          <strong>This action cannot be undone and will also delete all associated attendance records.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteClass}>
            Delete Class
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClassList;
