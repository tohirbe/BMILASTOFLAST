// Axios instance - barcha API so'rovlari uchun
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

// Token interceptor - har so'rovga JWT qo'shadi
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Javob interceptor - 401 bo'lsa logoutga yo'naltiradi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Analytics
export const analyticsApi = {
  overview: (params) => api.get('/analytics/overview', { params }),
  trend: (params) => api.get('/analytics/trend', { params }),
  subjects: (params) => api.get('/analytics/subjects', { params }),
  groups: (params) => api.get('/analytics/groups', { params }),
  distribution: (params) => api.get('/analytics/distribution', { params }),
  histogram: (params) => api.get('/analytics/grade-histogram', { params }),
  attendanceGrade: (params) => api.get('/analytics/attendance-vs-grade', { params }),
  heatmap: () => api.get('/analytics/group-subject-matrix'),
  semesterCompare: (params) => api.get('/analytics/semester-compare', { params }),
  genderStats: () => api.get('/analytics/gender-stats'),
  courseStats: () => api.get('/analytics/course-stats'),
  top: (params) => api.get('/analytics/top', { params }),
  bottom: (params) => api.get('/analytics/bottom', { params }),
}

// Students
export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  profile: (id) => api.get(`/students/${id}/profile`),
  create: (data) => api.post('/students', data),
  delete: (id) => api.delete(`/students/${id}`),
}

// Subjects
export const subjectsApi = {
  list: () => api.get('/subjects'),
  get: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// Groups
export const groupsApi = {
  list: () => api.get('/groups'),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
}

// Grades
export const gradesApi = {
  list: (params) => api.get('/grades', { params }),
  create: (data) => api.post('/grades', data),
  delete: (id) => api.delete(`/grades/${id}`),
}

// Predictions
export const predictionsApi = {
  atRisk: () => api.get('/prediction/at-risk'),
  student: (id) => api.get(`/prediction/student/${id}`),
}

// Upload
export const uploadApi = {
  grades: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/grades', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  template: () => api.get('/upload/template', { responseType: 'blob' }),
}

// Users
export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api