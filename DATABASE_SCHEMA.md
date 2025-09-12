# Class Attendance Application - Database Schema

## Tables Design

### 1. classes
Stores information about each class/course
```sql
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_number VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    semester_year INT NOT NULL,
    semester_season ENUM('Spring', 'Summer', 'Fall', 'Winter') NOT NULL,
    instructor_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class (course_number, semester_year, semester_season)
);
```

### 2. students
Stores student information
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. student_classes
Maps students to classes (many-to-many relationship)
```sql
CREATE TABLE student_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, class_id)
);
```

### 4. attendance_sessions
Stores information about when attendance was taken for a class
```sql
CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session_date DATE NOT NULL,
    session_title VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session (class_id, session_date)
);
```

### 5. student_attendance
Tracks individual student attendance for each session
```sql
CREATE TABLE student_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'late', 'absent', 'excused') NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(255),
    FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_session (attendance_session_id, student_id)
);
```

## Database Setup Commands

```sql
-- Create database
CREATE DATABASE class_attendance_db;
USE class_attendance_db;

-- Run the CREATE TABLE commands above in order

-- Insert sample data
INSERT INTO classes (course_number, course_name, semester_year, semester_season, instructor_name) 
VALUES 
('CS101', 'Introduction to Computer Science', 2024, 'Fall', 'Dr. Smith'),
('MATH201', 'Calculus II', 2024, 'Fall', 'Prof. Johnson');

INSERT INTO students (student_id, first_name, last_name, email) 
VALUES 
('STU001', 'John', 'Doe', 'john.doe@email.com'),
('STU002', 'Jane', 'Smith', 'jane.smith@email.com');
```
