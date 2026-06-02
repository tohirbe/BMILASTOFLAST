// Dinamik sidebar - menyu /auth/me dan keladi, til SettingsContext dan
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/SettingsContext'
import {
  LayoutDashboard, Users, BookOpen, Group, AlertTriangle, BarChart2,
  Upload, UserCog, Settings, UserCircle, ClipboardList, ChevronLeft,
  ChevronRight, LogOut, GraduationCap, Calendar, CalendarCheck,
  CalendarDays, AlertCircle, TrendingUp
} from 'lucide-react'

const ICONS = {
  LayoutDashboard, Users, BookOpen, Group, AlertTriangle, BarChart2,
  Upload, UserCog, Settings, UserCircle, ClipboardList, Calendar,
  CalendarCheck, CalendarDays, AlertCircle, TrendingUp
}

const MENU_TRANSLATION_MAP = {
  'dashboard': 'dashboard',
  'students': 'students',
  'subjects': 'subjects',
  'groups': 'groups',
  'risk': 'risk',
  'reports': 'reports',
  'upload': 'upload',
  'users': 'users',
  'settings': 'settings',
  'profile': 'profile',
  'grades': 'grades',
  'attendance': 'attendance',
  'debts': 'debts',
  'schedule': 'schedule',
  'teacher-performance': 'teacher_performance',
  'grade-windows': 'grade_windows',
}

export default function Sidebar() {
  const { user, menu, logout } = useAuth()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`
      flex flex-col h-screen bg-white border-r border-slate-100 shadow-sm
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-primary-700 text-sm leading-tight">{t('system_name')}</div>
            <div className="text-xs text-slate-400">{t('system_subtitle')}</div>
          </div>
        )}
      </div>

      {/* Menyu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menu.map((item) => {
          const Icon = ICONS[item.icon] || LayoutDashboard
          const translatedLabel = t(MENU_TRANSLATION_MAP[item.key] || item.key) || item.label
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors group
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
              title={collapsed ? translatedLabel : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{translatedLabel}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Foydalanuvchi */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed && user && (
          <div className="px-2 py-2 mb-2">
            <div className="text-sm font-medium text-slate-800 truncate">
              {user.ism} {user.familiya}
            </div>
            <div className="text-xs text-slate-400 capitalize">{t(`role_${user.rol}`) || user.rol}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title={t('logout')}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>

      {/* Yig'ish/yoyish */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-slate-500" />
          : <ChevronLeft className="w-3 h-3 text-slate-500" />
        }
      </button>
    </aside>
  )
}