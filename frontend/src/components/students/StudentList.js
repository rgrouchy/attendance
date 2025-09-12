import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Modal, Table, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentAPI.getAll();
      setStudents(response.data);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setError('');
      await studentAPI.delete(studentToDelete.id);
      setSuccess(`Student "${studentToDelete.first_name} ${studentToDelete.last_name}" deleted successfully`);
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
      setShowDeleteModal(false);
    }
  };

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
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
        <h1>Students ({filteredStudents.length})</h1>
        <Button as={Link} to="/students/new" variant="primary">
          Add New Student
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search students by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </Card.Body>
      </Card>

      {students.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <h5>No Students Found</h5>
            <p className="text-muted">Get started by adding your first student.</p>
            <Button as={Link} to="/students/new" variant="primary">
              Add Student
            </Button>
          </Card.Body>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <h5>No Students Match Your Search</h5>
            <p className="text-muted">Try a different search term or clear the search.</p>
            <Button variant="secondary" onClick={() => setSearchTerm('')}>
              Clear Search
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
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Notes</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.student_id}</strong>
                      </td>
                      <td>
                        {student.first_name} {student.last_name}
                      </td>
                      <td>
                        <a href={`mailto:${student.email}`}>{student.email}</a>
                      </td>
                      <td>
                        {student.notes ? (
                          <span className="text-muted">
                            {student.notes.length > 50 
                              ? `${student.notes.substring(0, 50)}...` 
                              : student.notes
                            }
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            as={Link}
                            to={`/students/${student.id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            View
                          </Button>
                          <Button
                            as={Link}
                            to={`/students/${student.id}/edit`}
                            variant="outline-secondary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => confirmDelete(student)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          Are you sure you want to delete the student "
          {studentToDelete?.first_name} {studentToDelete?.last_name} ({studentToDelete?.student_id})"?
          <br />
          <strong>This action cannot be undone and will also delete all associated attendance records.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStudent}>
            Delete Student
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentList;
