import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Admin API
export const adminAPI = {
  // Subjects
  getSubjects: () => api.get('/subjects'),
  createSubject: (data: { name: string }) => api.post('/subjects', data),
  updateSubject: (id: string, data: { name: string }) =>
    api.put(`/subjects/${id}`, data),
  deleteSubject: (id: string) => api.delete(`/subjects/${id}`),

  // Classes
  getClasses: () => api.get('/classes'),
  createClass: (data: { programId: number; divisionId: number | null; batchYear: number; isActive: boolean }) =>
    api.post('/classes', data),
  updateClass: (id: string, data: Partial<{ programId: number; divisionId: number | null; batchYear: number; isActive: boolean }>) =>
    api.put(`/classes/${id}`, data),
  deleteClass: (id: string) => api.delete(`/classes/${id}`),

  // Faculty
  getFaculty: () => api.get('/faculty'),
  createFaculty: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/faculty', data),
  updateFaculty: (id: string, data: Partial<{ name: string; email: string }>) =>
    api.put(`/faculty/${id}`, data),
  deleteFaculty: (id: string) => api.delete(`/faculty/${id}`),

  // Students
  getStudents: () => api.get('/students'),
  createStudent: (data: { name: string; email: string; password: string; rollNo: number; classId: string }) =>
    api.post('/students', data),
  updateStudent: (id: string, data: Partial<{ name: string; email: string; rollNo: number; isActive: boolean; classId: string }>) =>
    api.put(`/students/${id}`, data),
  deleteStudent: (id: string) => api.delete(`/students/${id}`),
  deactivateStudent: (id: string) => api.patch(`/students/${id}/deactivate`),
  activateStudent: (id: string) => api.patch(`/students/${id}/activate`),

  // Mappings
  getMappings: () => api.get('/mappings'),
  createMapping: (data: { facultyId: string; subjectId: string; classId: string }) =>
    api.post('/admin/map', data),
  deleteMapping: (id: string) => api.delete(`/mappings/${id}`),

  // Timetable
  getTimetable: () => api.get('/timetable'),
  createTimetableSlot: (data: {
    mappingId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => api.post('/timetable', data),
  updateTimetableSlot: (id: string, data: Partial<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>) => api.put(`/timetable/${id}`, data),
  deleteTimetableSlot: (id: string) => api.delete(`/timetable/${id}`),

  // Programs & Divisions
  getPrograms: () => api.get('/admin/programs'),
  createProgram: (data: { name: string }) => api.post('/admin/program', data),
  getDivisions: () => api.get('/admin/divisions'),
  createDivision: (data: { name: string }) => api.post('/admin/division', data),

  // Reports
  getAbuseReports: () => api.get('/reports/abuse'),
  resolveAbuseReport: (id: string) => api.patch(`/reports/abuse/${id}/resolve`),
};

// Faculty API
export const facultyAPI = {
  getTodayLectures: () => api.get('/faculty/today'),
  getLectureDetails: (id: string) => api.get(`/faculty/lectures/${id}`),
  startSession: (lectureId: string) => api.post(`/attendance/sessions`, { lectureId }),
  getSession: (sessionId: string) => api.get(`/attendance/sessions/${sessionId}`),
  markAttendance: (sessionId: string, studentId: string, status: 'present' | 'absent') =>
    api.post(`/attendance/sessions/${sessionId}/mark`, { studentId, status }),
  lockSession: (sessionId: string) => api.patch(`/attendance/sessions/${sessionId}/lock`),
  getSessionStudents: (sessionId: string) => api.get(`/attendance/sessions/${sessionId}/students`),
};

// Student API
export const studentAPI = {
  getAttendance: () => api.get('/student/attendance'),
  getSubjectAttendance: (subjectId: string) => api.get(`/student/attendance/${subjectId}`),
  getOverallPercentage: () => api.get('/student/attendance/percentage'),
};

export default api;

