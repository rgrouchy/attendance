import axios from 'axios';

function resolveApiBaseUrl() {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '');
  }
  const { protocol, hostname } = window.location;
  const bracketed = hostname.includes(':') ? `[${hostname}]` : hostname;
  return `${protocol}//${bracketed}:5000/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// Classes API
export const classAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
  addStudent: (id, studentId) => api.post(`/classes/${id}/students`, { student_id: studentId }),
  removeStudent: (classId, studentId) => api.delete(`/classes/${classId}/students/${studentId}`),
};

// Students API
export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByStudentId: (studentId) => api.get(`/students/by-student-id/${studentId}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getClasses: (id) => api.get(`/students/${id}/classes`),
  getAttendance: (id, classId = null) => api.get(`/students/${id}/attendance`, { params: { class_id: classId } }),
};

// Attendance API
export const attendanceAPI = {
  // Sessions
  getAllSessions: (classId = null) => api.get('/attendance/sessions', { params: { class_id: classId } }),
  getSessionById: (id) => api.get(`/attendance/sessions/${id}`),
  createSession: (data) => api.post('/attendance/sessions', data),
  updateSession: (id, data) => api.put(`/attendance/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/attendance/sessions/${id}`),
  getSessionAttendance: (id) => api.get(`/attendance/sessions/${id}/attendance`),
  
  // Records
  recordAttendance: (data) => api.post('/attendance/record', data),
  updateAttendance: (id, data) => api.put(`/attendance/record/${id}`, data),
  deleteAttendance: (id) => api.delete(`/attendance/record/${id}`),
  
  // Stats
  getStats: (classId, studentId = null) => api.get(`/attendance/stats/${classId}`, { params: { student_id: studentId } }),
};

export default api;
