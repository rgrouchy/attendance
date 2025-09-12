import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          📚 Class Attendance System
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={location.pathname === '/'}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/classes" 
              active={location.pathname.startsWith('/classes')}
            >
              Classes
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/students" 
              active={location.pathname.startsWith('/students')}
            >
              Students
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/attendance" 
              active={location.pathname.startsWith('/attendance')}
            >
              Attendance
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
