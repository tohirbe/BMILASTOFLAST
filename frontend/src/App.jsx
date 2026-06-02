// Asosiy ilova - routing va layout
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/Common/PrivateRoute'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import Subjects from './pages/Subjects'
import Groups from './pages/Groups'
import RiskAnalysis from './pages/RiskAnalysis'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Upload from './pages/Upload'
import Settings from './pages/Settings'
import Grades from './pages/Grades'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/students': 'Talabalar',
  '/subjects': 'Fanlar',
  '/groups': 'Guruhlar',
  '/risk': 'Xavf tahlili',
  '/reports': 'Hisobotlar',
  '/upload': "Ma'lumot yuklash",
  '/users': 'Foydalanuvchilar',
  '/settings': 'Sozlamalar',
  '/profile': 'Profilim',
  '/grades': 'Baholar',
}

function AppLayout({ children, title }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="relative flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function ProtectedPage({ children, title, permission }) {
  return (
    <PrivateRoute permission={permission}>
      <AppLayout title={title}>
        {children}
      </AppLayout>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedPage title="Dashboard" permission="view_dashboard">
              <Dashboard />
            </ProtectedPage>
          } />

          <Route path="/students" element={
            <ProtectedPage title="Talabalar">
              <Students />
            </ProtectedPage>
          } />

          <Route path="/students/:id" element={
            <ProtectedPage title="Talaba profili">
              <StudentProfile />
            </ProtectedPage>
          } />

          <Route path="/subjects" element={
            <ProtectedPage title="Fanlar">
              <Subjects />
            </ProtectedPage>
          } />

          <Route path="/groups" element={
            <ProtectedPage title="Guruhlar">
              <Groups />
            </ProtectedPage>
          } />

          <Route path="/risk" element={
            <ProtectedPage title="Xavf tahlili" permission="view_predictions">
              <RiskAnalysis />
            </ProtectedPage>
          } />

          <Route path="/reports" element={
            <ProtectedPage title="Hisobotlar">
              <Reports />
            </ProtectedPage>
          } />

          <Route path="/upload" element={
            <ProtectedPage title="Ma'lumot yuklash" permission="upload_data">
              <Upload />
            </ProtectedPage>
          } />

          <Route path="/users" element={
            <ProtectedPage title="Foydalanuvchilar" permission="manage_users">
              <Users />
            </ProtectedPage>
          } />

          <Route path="/settings" element={
            <ProtectedPage title="Sozlamalar">
              <Settings />
            </ProtectedPage>
          } />

          <Route path="/grades" element={
            <ProtectedPage title="Baholar" permission="enter_grades">
              <Grades />
            </ProtectedPage>
          } />

          <Route path="/profile" element={
            <ProtectedPage title="Profilim">
              <StudentProfile />
            </ProtectedPage>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}