// Axios instance - barcha API so'rovlari uchun
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

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
  teachersList: () => api.get('/analytics/teachers'),
  teacherDetail: (id) => api.get(`/analytics/teachers/${id}`),
}

export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  profile: (id) => api.get(`/students/${id}/profile`),
  create: (data) => api.post('/students', data),
  delete: (id) => api.delete(`/students/${id}`),
}

export const subjectsApi = {
  list: () => api.get('/subjects'),
  get: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

export const groupsApi = {
  list: () => api.get('/groups'),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
}

export const gradesApi = {
  list: (params) => api.get('/grades', { params }),
  create: (data) => api.post('/grades', data),
  update: (id, data, izoh) => api.put(`/grades/${id}`, data, { params: izoh ? { izoh } : {} }),
  delete: (id) => api.delete(`/grades/${id}`),
  history: (id) => api.get(`/grades/${id}/history`),
}

export const componentsApi = {
  getWeights: (subject_id) => api.get(`/components/weights/${subject_id}`),
  setWeights: (subject_id, data) => api.put(`/components/weights/${subject_id}`, data),
  updateGrade: (grade_id, data) => api.put(`/components/grade/${grade_id}`, data),
}

export const gradeWindowsApi = {
  list: () => api.get('/grade-windows'),
  check: (guruh_id, fan_id, semestr) => api.get('/grade-windows/check', { params: { guruh_id, fan_id, semestr } }),
  lock: (id) => api.post(`/grade-windows/${id}/lock`),
  unlock: (id) => api.post(`/grade-windows/${id}/unlock`),
  ensure: (guruh_id, fan_id, semestr) => api.post('/grade-windows/ensure', null, { params: { guruh_id, fan_id, semestr } }),
  myAssignments: () => api.get('/me/assignments'),
}

export const attendanceApi = {
  createLesson: (data) => api.post('/attendance/lessons', data),
  listLessons: (params) => api.get('/attendance/lessons', { params }),
  saveRecords: (lessonId, data) => api.post(`/attendance/lessons/${lessonId}/records`, data),
  getLessonRecords: (lessonId) => api.get(`/attendance/lessons/${lessonId}/records`),
  studentStats: (studentId, fan_id) => api.get(`/attendance/stats/student/${studentId}`, { params: fan_id ? { fan_id } : {} }),
  groupStats: (groupId, fan_id) => api.get(`/attendance/stats/group/${groupId}`, { params: fan_id ? { fan_id } : {} }),
  overview: () => api.get('/attendance/stats/overview'),
}

export const debtsApi = {
  list: (params) => api.get('/debts', { params }),
  openCount: () => api.get('/debts/count/open'),
  retake: (id, yangi_ball) => api.post(`/debts/${id}/retake`, { yangi_ball }),
}

export const scheduleApi = {
  list: (params) => api.get('/schedule', { params }),
  create: (data) => api.post('/schedule', data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
}

export const predictionsApi = {
  atRisk: () => api.get('/prediction/at-risk'),
  student: (id) => api.get(`/prediction/student/${id}`),
}

export const uploadApi = {
  grades: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/grades', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  template: () => api.get('/upload/template', { responseType: 'blob' }),
}

export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api
