# Class Attendance Management System

A full-stack web application for managing class attendance with React frontend, Express.js backend, and MySQL database.

## Features

### Class Management

- Create, edit, and delete classes
- Track course information (number, name, instructor, semester)
- Manage student enrollment in classes

### Student Management

- Add, edit, and delete students
- Track student information (ID, name, email, notes)
- View student attendance history and statistics

### Attendance Tracking

- Create attendance sessions for specific classes and dates
- Mark student attendance (Present, Late, Absent, Excused)
- Add notes for individual attendance records
- View attendance statistics and reports

### Dashboard

- Overview of system statistics
- Recent attendance sessions
- Quick actions for common tasks

## Technology Stack

- **Frontend**: React 18, React Bootstrap, React Router
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Additional Libraries**: 
  - Axios for API communication
  - React DatePicker for date selection
  - MySQL2 for database connectivity

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL](https://www.mysql.com/) (v8.0 or higher)
- [Git](https://git-scm.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd class-attendance-app
```

### 2. Install Dependencies

Install root dependencies (for running both frontend and backend):

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### 3. Database Setup

1. **Create MySQL Database**:
   
   ```sql
   CREATE DATABASE class_attendance_db;
   ```

2. **Configure Database Connection**:
   Create a `.env` file in the `backend` directory:
   
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=class_attendance_db
   CLIENT_URL=http://localhost:3000
   ```

3. **Run Database Migration**:
   
   ```bash
   cd backend
   npm run migrate
   ```
   
   This will create all necessary tables and insert sample data.

### 4. Start the Application

#### Option 1: Start Both Services Together (Recommended)

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

#### Option 2: Start Services Separately

**Start Backend**:

```bash
cd backend
npm run dev
```

**Start Frontend** (in a new terminal):

```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api

## Project Structure

```
class-attendance-app/
├── backend/                    # Express.js backend
│   ├── config/
│   │   └── database.js        # Database configuration
│   ├── migrations/
│   │   └── migrate.js         # Database migration script
│   ├── models/                # Database models
│   │   ├── Class.js
│   │   ├── Student.js
│   │   └── Attendance.js
│   ├── routes/                # API routes
│   │   ├── classes.js
│   │   ├── students.js
│   │   └── attendance.js
│   ├── package.json
│   └── server.js              # Main server file
├── frontend/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── classes/
│   │   │   ├── students/
│   │   │   └── attendance/
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── DATABASE_SCHEMA.md         # Database schema documentation
├── package.json               # Root package.json
└── README.md                  # This file
```

## API Endpoints

### Classes

- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `GET /api/classes/:id/students` - Get students in class
- `POST /api/classes/:id/students` - Add student to class
- `DELETE /api/classes/:id/students/:studentId` - Remove student from class

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/by-student-id/:studentId` - Get student by student ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/classes` - Get classes for student
- `GET /api/students/:id/attendance` - Get attendance history for student

### Attendance

- `GET /api/attendance/sessions` - Get all attendance sessions
- `GET /api/attendance/sessions/:id` - Get attendance session by ID
- `POST /api/attendance/sessions` - Create attendance session
- `PUT /api/attendance/sessions/:id` - Update attendance session
- `DELETE /api/attendance/sessions/:id` - Delete attendance session
- `GET /api/attendance/sessions/:id/attendance` - Get attendance for session
- `POST /api/attendance/record` - Record student attendance
- `PUT /api/attendance/record/:id` - Update attendance record
- `DELETE /api/attendance/record/:id` - Delete attendance record
- `GET /api/attendance/stats/:classId` - Get attendance statistics

## Usage Guide

### 1. Setting Up Classes

1. Navigate to "Classes" in the navigation
2. Click "Add New Class"
3. Fill in course information (course number, name, semester, instructor)
4. Save the class

### 2. Adding Students

1. Navigate to "Students" in the navigation
2. Click "Add New Student"
3. Enter student information (ID, name, email, notes)
4. Save the student

### 3. Enrolling Students in Classes

1. Go to a specific class detail page
2. Click "Add Student" 
3. Select from available students
4. Confirm enrollment

### 4. Taking Attendance

1. Navigate to "Attendance" in the navigation
2. Click "Create New Session"
3. Select the class and date
4. Click "Create Session & Take Attendance"
5. Mark each student as Present, Late, Absent, or Excused
6. Add notes as needed

### 5. Viewing Reports

- Dashboard provides overview statistics
- Student detail pages show individual attendance history
- Class detail pages show recent sessions
- Attendance statistics available in student profiles

## Sample Data

The migration script includes sample data:

- 2 sample classes (CS101, MATH201)
- 3 sample students (John Doe, Jane Smith, Bob Wilson)

## Environment Variables

### Backend (.env file in backend directory)

```
PORT=5000                    # Server port
DB_HOST=localhost           # MySQL host
DB_USER=root               # MySQL username
DB_PASSWORD=your_password  # MySQL password
DB_NAME=class_attendance_db # Database name
CLIENT_URL=http://localhost:3000 # Frontend URL for CORS
```

### Frontend

The frontend uses the `proxy` setting in package.json to connect to the backend. If you need to change the backend URL, update the proxy value or set `REACT_APP_API_URL` environment variable.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   
   - Verify MySQL is running
   - Check database credentials in .env file
   - Ensure database exists

2. **Port Already in Use**
   
   - Change PORT in backend .env file
   - Kill existing processes using the ports

3. **Frontend Can't Connect to Backend**
   
   - Ensure backend is running on port 5000
   - Check proxy setting in frontend package.json

4. **Migration Fails**
   
   - Ensure database exists
   - Check MySQL user permissions
   - Verify connection parameters

### Reset Database

To reset the database and sample data:

```bash
cd backend
npm run migrate
```

## Development

### Adding New Features

1. Backend: Add routes in `backend/routes/`, models in `backend/models/`
2. Frontend: Add components in `frontend/src/components/`
3. Update API service in `frontend/src/services/api.js`

### Database Changes

1. Modify `backend/migrations/migrate.js`
2. Update corresponding models
3. Run migration script

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the API documentation at http://localhost:5000/api
3. Check the browser console for frontend errors
4. Check the server logs for backend errors



Create Network:

docker network create --driver bridge attend-net

 docker run -e MYSQL_ROOT_PASSWORD=rootpass --name attend-db -d --network attend-net mysql