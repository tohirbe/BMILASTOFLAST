// Sozlamalar - 6 tabli premium settings sahifasi
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings, useTranslation } from '../contexts/SettingsContext'
import api from '../services/api'
import {
  User, Lock, Shield, Bell, Palette, Info,
  CheckCircle, AlertCircle, Eye, EyeOff, Save,
  Monitor, Moon, Sun, Languages, Minimize2,
  Activity, Clock, Server, ExternalLink,
  ChevronRight, Zap, BookOpen, Users as UsersIcon,
  Upload, BarChart2, AlertTriangle, Settings as SettingsIcon,
  UserCog, ClipboardList, LayoutDashboard, UserCircle
} from 'lucide-react'

// ===== CONSTANTS =====
const ROLE_LABELS = {
  admin: 'Administrator',
  dekanat: 'Dekanat',
  oqituvchi: "O'qituvchi",
  talaba: 'Talaba'
}

const ROLE_COLORS = {
  admin: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', gradient: 'from-violet-500 to-purple-600' },
  dekanat: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
  oqituvchi: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-600' },
  talaba: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', gradient: 'from-sky-500 to-blue-600' }
}

const ALL_PERMISSIONS = [
  { key: 'view_dashboard', label: 'Dashboard ko\'rish', icon: LayoutDashboard, group: 'Ko\'rish' },
  { key: 'view_all_analytics', label: 'Barcha tahlillar', icon: BarChart2, group: 'Ko\'rish' },
  { key: 'view_group_analytics', label: 'Guruh tahlillari', icon: BarChart2, group: 'Ko\'rish' },
  { key: 'view_own_analytics', label: 'Shaxsiy tahlillar', icon: BarChart2, group: 'Ko\'rish' },
  { key: 'view_predictions', label: 'Bashoratlar', icon: AlertTriangle, group: 'Ko\'rish' },
  { key: 'view_settings', label: 'Sozlamalar', icon: SettingsIcon, group: 'Ko\'rish' },
  { key: 'manage_users', label: 'Foydalanuvchilarni boshqarish', icon: UserCog, group: 'Boshqarish' },
  { key: 'manage_students', label: 'Talabalarni boshqarish', icon: UsersIcon, group: 'Boshqarish' },
  { key: 'manage_subjects', label: 'Fanlarni boshqarish', icon: BookOpen, group: 'Boshqarish' },
  { key: 'enter_grades', label: 'Baho kiritish', icon: ClipboardList, group: 'Kiritish' },
  { key: 'upload_data', label: 'Ma\'lumot yuklash', icon: Upload, group: 'Kiritish' },
  { key: 'export_reports', label: 'Hisobot eksport', icon: ExternalLink, group: 'Eksport' },
]

const ROLE_PERMISSIONS_MAP = {
  admin: ["view_dashboard","manage_users","manage_students","manage_subjects","enter_grades","upload_data","view_all_analytics","view_group_analytics","view_own_analytics","view_predictions","export_reports","view_settings"],
  dekanat: ["view_dashboard","manage_students","manage_subjects","view_all_analytics","view_group_analytics","view_own_analytics","view_predictions","export_reports","view_settings"],
  oqituvchi: ["view_dashboard","enter_grades","view_group_analytics","view_own_analytics","view_settings"],
  talaba: ["view_dashboard","view_own_analytics","view_settings"]
}

const TABS = [
  { key: 'profile', label: 'Profil', icon: User },
  { key: 'security', label: 'Xavfsizlik', icon: Lock },
  { key: 'roles', label: 'Rollar va Ruxsatlar', icon: Shield, adminOnly: true },
  { key: 'notifications', label: 'Bildirishnomalar', icon: Bell },
  { key: 'appearance', label: 'Interfeys', icon: Palette },
  { key: 'about', label: 'Tizim haqida', icon: Info },
]

// ===== HELPER: Password Strength =====
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: 'Juda zaif', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Zaif', color: 'bg-orange-500' }
  if (score === 3) return { score: 3, label: 'O\'rtacha', color: 'bg-yellow-500' }
  if (score === 4) return { score: 4, label: 'Kuchli', color: 'bg-green-500' }
  return { score: 5, label: 'Juda kuchli', color: 'bg-emerald-500' }
}

// ===== TAB 1: PROFILE =====
function ProfileTab({ user }) {
  const [ism, setIsm] = useState(user?.ism || '')
  const [familiya, setFamiliya] = useState(user?.familiya || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const rolColors = ROLE_COLORS[user?.rol] || ROLE_COLORS.talaba

  const handleSave = async () => {
    if (!ism.trim() || !familiya.trim()) { setError('Barcha maydonlarni to\'ldiring'); return }
    setLoading(true); setError('')
    try {
      await api.put(`/users/${user.id}`, { ism: ism.trim(), familiya: familiya.trim() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Avatar & Name Header */}
      <div className="card relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-r ${rolColors.gradient} opacity-10 rounded-t-2xl`} />
        <div className="relative flex items-start gap-5 pt-2">
          <div className={`w-20 h-20 bg-gradient-to-br ${rolColors.gradient} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            <span className="text-2xl font-bold text-white">
              {user?.ism?.[0]}{user?.familiya?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">{user?.familiya} {user?.ism}</h3>
            <p className="text-sm text-slate-500 mt-0.5">@{user?.login}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${rolColors.bg} ${rolColors.text}`}>
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[user?.rol] || user?.rol}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" />
          Profil ma'lumotlari
        </h3>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-green-100 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profil muvaffaqiyatli yangilandi!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ism</label>
            <input value={ism} onChange={(e) => setIsm(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
            <input value={familiya} onChange={(e) => setFamiliya(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { label: 'Login', value: user?.login, locked: true },
            { label: 'Rol', value: ROLE_LABELS[user?.rol], locked: true },
            { label: 'ID', value: `#${user?.id}`, locked: true },
          ].map(({ label, value, locked }) => (
            <div key={label} className="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-500">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{value}</span>
                {locked && <Lock className="w-3 h-3 text-slate-300" />}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={loading}
          className="btn-primary flex items-center gap-2 px-6">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Saqlash
        </button>
      </div>
    </div>
  )
}

// ===== TAB 2: SECURITY =====
function SecurityTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(newPassword)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword

  const requirements = [
    { met: newPassword.length >= 6, label: 'Kamida 6 ta belgi' },
    { met: /[A-Z]/.test(newPassword), label: 'Katta harf (A-Z)' },
    { met: /[0-9]/.test(newPassword), label: 'Raqam (0-9)' },
    { met: /[^A-Za-z0-9]/.test(newPassword), label: 'Maxsus belgi (!@#$)' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword) { setError('Yangi parolni kiriting'); return }
    if (newPassword.length < 6) { setError('Parol kamida 6 ta belgi bo\'lishi kerak'); return }
    if (newPassword !== confirmPassword) { setError('Parollar mos kelmaydi'); return }
    setLoading(true); setError('')
    try {
      await api.put(`/users/${user.id}`, { parol: newPassword })
      setSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally { setLoading(false) }
  }

  const PasswordInput = ({ value, onChange, show, onToggle, placeholder, label }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-600" />
          Parolni o'zgartirish
        </h3>
        <p className="text-sm text-slate-500 mb-6">Hisobingiz xavfsizligini ta'minlash uchun kuchli parol tanlang</p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2 border border-green-100 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Parol muvaffaqiyatli o'zgartirildi!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)}
            placeholder="Joriy parol" label="Joriy parol" />

          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            show={showNew} onToggle={() => setShowNew(!showNew)}
            placeholder="Kamida 6 ta belgi" label="Yangi parol" />

          {/* Strength meter */}
          {newPassword && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score ? strength.color : 'bg-slate-200'
                  }`} />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.score <= 2 ? 'text-red-600' : strength.score === 3 ? 'text-yellow-600' : 'text-green-600'
              }`}>{strength.label}</p>
            </div>
          )}

          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
            placeholder="Parolni tasdiqlang" label="Parolni tasdiqlang" />

          {confirmPassword && (
            <div className={`flex items-center gap-2 text-xs font-medium animate-fadeIn ${
              passwordsMatch ? 'text-green-600' : 'text-red-600'
            }`}>
              {passwordsMatch ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {passwordsMatch ? 'Parollar mos' : 'Parollar mos kelmaydi'}
            </div>
          )}

          <button type="submit" disabled={loading || !passwordsMatch}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Parolni o'zgartirish
          </button>
        </form>
      </div>

      {/* Requirements checklist */}
      <div className="card bg-slate-50 border-slate-100">
        <h4 className="font-medium text-slate-700 mb-3 text-sm">Parol talablari</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {requirements.map(({ met, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                met ? 'bg-green-500' : 'bg-slate-200'
              }`}>
                <CheckCircle className={`w-3 h-3 ${met ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <span className={`text-sm transition-colors ${met ? 'text-green-700 font-medium' : 'text-slate-500'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===== TAB 3: ROLES & PERMISSIONS (admin only) =====
function RolesTab() {
  const roles = ['admin', 'dekanat', 'oqituvchi', 'talaba']
  const storageKey = 'bmi_role_permissions'
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [permsMap, setPermsMap] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(ROLE_PERMISSIONS_MAP))
    } catch { return JSON.parse(JSON.stringify(ROLE_PERMISSIONS_MAP)) }
  })

  const permGroups = {}
  ALL_PERMISSIONS.forEach(p => {
    if (!permGroups[p.group]) permGroups[p.group] = []
    permGroups[p.group].push(p)
  })

  const togglePerm = (role, permKey) => {
    setPermsMap(prev => {
      const updated = { ...prev }
      const rolePerms = [...(updated[role] || [])]
      if (rolePerms.includes(permKey)) {
        updated[role] = rolePerms.filter(p => p !== permKey)
      } else {
        updated[role] = [...rolePerms, permKey]
      }
      return updated
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(permsMap))
    setSuccess(true)
    setHasChanges(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleReset = () => {
    const defaults = JSON.parse(JSON.stringify(ROLE_PERMISSIONS_MAP))
    setPermsMap(defaults)
    localStorage.removeItem(storageKey)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Save bar */}
      {(hasChanges || success) && (
        <div className={`sticky top-0 z-10 px-4 py-3 rounded-xl flex items-center justify-between animate-fadeIn ${
          success ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Ruxsatlar muvaffaqiyatli saqlandi!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Saqlanmagan o'zgarishlar mavjud</span>
              </>
            )}
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Qaytarish
              </button>
              <button onClick={handleSave}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Saqlash
              </button>
            </div>
          )}
        </div>
      )}

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roles.map(role => {
          const colors = ROLE_COLORS[role]
          const rolePerms = permsMap[role] || []
          return (
            <div key={role} className={`card border ${colors.border} hover:shadow-md transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{ROLE_LABELS[role]}</h4>
                  <p className="text-xs text-slate-500">{rolePerms.length} ta ruxsat</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PERMISSIONS.map(ap => {
                  const active = rolePerms.includes(ap.key)
                  return (
                    <button key={ap.key} onClick={() => togglePerm(role, ap.key)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all duration-200 border cursor-pointer ${
                        active
                          ? `${colors.bg} ${colors.text} ${colors.border}`
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}>
                      {active ? <CheckCircle className="w-2.5 h-2.5" /> : <span className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                      {ap.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Permission matrix */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            Ruxsatlar matritsasi
          </h3>
          <p className="text-xs text-slate-500 mt-1">Belgilash yoki olib tashlash uchun bosing</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-56">Ruxsat</th>
                {roles.map(role => (
                  <th key={role} className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 bg-gradient-to-br ${ROLE_COLORS[role].gradient} rounded-md flex items-center justify-center`}>
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      {ROLE_LABELS[role]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permGroups).map(([groupName, perms], gi) => (
                <>
                  <tr key={`group-${gi}`} className="bg-slate-50/50">
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {groupName}
                    </td>
                  </tr>
                  {perms.map((perm) => {
                    const Icon = perm.icon
                    return (
                      <tr key={perm.key} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">{perm.label}</span>
                          </div>
                        </td>
                        {roles.map(role => {
                          const has = (permsMap[role] || []).includes(perm.key)
                          return (
                            <td key={role} className="px-3 py-2.5 text-center">
                              <button onClick={() => togglePerm(role, perm.key)}
                                className={`inline-flex w-7 h-7 rounded-lg items-center justify-center transition-all duration-200 cursor-pointer ${
                                  has
                                    ? 'bg-green-100 hover:bg-green-200'
                                    : 'bg-slate-100 hover:bg-slate-200'
                                }`}>
                                {has ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <span className="w-2 h-2 bg-slate-300 rounded-full" />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ===== TAB 4: NOTIFICATIONS =====
function NotificationsTab() {
  const storageKey = 'bmi_notification_prefs'
  const defaults = { newGrade: true, riskChange: true, systemUpdate: false, weeklyReport: false }

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : defaults
    } catch { return defaults }
  })

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const notifications = [
    { key: 'newGrade', label: 'Yangi baho kiritilganda', desc: 'Talabaga yangi baho qo\'yilganda bildirishnoma', icon: ClipboardList, color: 'text-blue-500' },
    { key: 'riskChange', label: 'Xavf darajasi o\'zgarganda', desc: 'Talabaning xavf holati o\'zgarganda ogohlantirish', icon: AlertTriangle, color: 'text-amber-500' },
    { key: 'systemUpdate', label: 'Tizim yangilanganda', desc: 'Tizimga yangilanish kelganda xabar', icon: Zap, color: 'text-violet-500' },
    { key: 'weeklyReport', label: 'Haftalik hisobot', desc: 'Har hafta umumiy statistika xulosa', icon: BarChart2, color: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-600" />
          Bildirishnoma sozlamalari
        </h3>
        <p className="text-sm text-slate-500 mb-6">Qaysi hodisalar haqida xabardor bo'lishni tanlang</p>

        <div className="space-y-3">
          {notifications.map(({ key, label, desc, icon: Icon, color }) => (
            <div key={key}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => toggle(key)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
              {/* Toggle switch */}
              <div className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                prefs[key] ? 'bg-primary-600' : 'bg-slate-300'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  prefs[key] ? 'left-[22px]' : 'left-0.5'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===== TAB 5: APPEARANCE =====
function AppearanceTab() {
  const { settings, updateSettings } = useSettings()
  const { t } = useTranslation()

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Theme */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary-600" />
          {t('theme')}
        </h3>
        <p className="text-sm text-slate-500 mb-4">{t('theme_desc')}</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'light', label: t('theme_light'), icon: Sun, desc: t('theme_light_desc'), colors: 'bg-white border-slate-200' },
            { key: 'dark', label: t('theme_dark'), icon: Moon, desc: t('theme_dark_desc'), colors: 'bg-slate-900 border-slate-700' },
            { key: 'system', label: t('theme_system'), icon: Monitor, desc: t('theme_system_desc'), colors: 'bg-gradient-to-br from-white to-slate-900 border-slate-300' },
          ].map(({ key, label, icon: Icon, desc, colors }) => (
            <button key={key} onClick={() => updateSettings('theme', key)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                settings.theme === key
                  ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
              <div className={`w-10 h-10 ${colors} rounded-lg mb-2 flex items-center justify-center border shadow-sm`}>
                <Icon className={`w-5 h-5 ${key === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} />
              </div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary-600" />
          {t('language')}
        </h3>
        <p className="text-sm text-slate-500 mb-4">{t('language_desc')}</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
            { key: 'ru', label: 'Русский', flag: '🇷🇺' },
          ].map(({ key, label, flag }) => (
            <button key={key} onClick={() => updateSettings('language', key)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                settings.language === key
                  ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
              <span className="text-2xl">{flag}</span>
              <span className="text-sm font-semibold text-slate-800">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact mode */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Minimize2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('compact_mode')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('compact_desc')}</p>
            </div>
          </div>
          <div onClick={() => updateSettings('compact', !settings.compact)}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
              settings.compact ? 'bg-primary-600' : 'bg-slate-300'
            }`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
              settings.compact ? 'left-[22px]' : 'left-0.5'
            }`} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== TAB 6: ABOUT SYSTEM =====
function AboutTab() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [apiLatency, setApiLatency] = useState(null)

  useEffect(() => {
    const check = async () => {
      const start = Date.now()
      try {
        await api.get('/')
        setApiLatency(Date.now() - start)
        setApiStatus('online')
      } catch {
        setApiStatus('offline')
      }
    }
    check()
  }, [])

  const loginTime = new Date().toLocaleString('uz-UZ')

  const techStack = [
    { name: 'React 18', color: 'bg-sky-100 text-sky-700' },
    { name: 'Vite', color: 'bg-violet-100 text-violet-700' },
    { name: 'Tailwind CSS', color: 'bg-teal-100 text-teal-700' },
    { name: 'FastAPI', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'SQLAlchemy', color: 'bg-orange-100 text-orange-700' },
    { name: 'SQLite', color: 'bg-blue-100 text-blue-700' },
    { name: 'scikit-learn', color: 'bg-amber-100 text-amber-700' },
    { name: 'JWT Auth', color: 'bg-red-100 text-red-700' },
    { name: 'Recharts', color: 'bg-pink-100 text-pink-700' },
    { name: 'Axios', color: 'bg-indigo-100 text-indigo-700' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* System info */}
      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">BMI Talabalar O'zlashtirish Tizimi</h3>
            <p className="text-sm text-slate-500 mt-0.5">Diplom loyihasi — Talabalar o'zlashtirish ko'rsatkichlarini tahlil qilish</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-blue">v1.0.0</span>
              <span className="badge-green">Stable</span>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="p-4 bg-slate-50 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">API Server</p>
                <p className="text-xs text-slate-500">http://localhost:8000</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === 'checking' && (
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Tekshirilmoqda...</span>
                </div>
              )}
              {apiStatus === 'online' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 font-medium">{apiLatency}ms</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-green-700">Online</span>
                  </div>
                </div>
              )}
              {apiStatus === 'offline' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-xs font-semibold text-red-700">Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session info */}
        <div className="space-y-3">
          {[
            { icon: Clock, label: 'Sessiya vaqti', value: loginTime },
            { icon: Activity, label: 'Token muddati', value: '24 soat' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{label}</span>
              </div>
              <span className="text-sm font-medium text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary-600" />
          Texnologiyalar
        </h3>
        <div className="flex flex-wrap gap-2">
          {techStack.map(({ name, color }) => (
            <span key={name} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Quick link */}
      <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
        className="card flex items-center justify-between hover:shadow-md transition-all duration-300 group cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Swagger API Docs</p>
            <p className="text-xs text-slate-500">Interaktiv API hujjatlari</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </a>
    </div>
  )
}

// ===== MAIN SETTINGS COMPONENT =====
export default function Settings() {
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const visibleTabs = TABS.filter(tab => {
    if (tab.adminOnly && !hasPermission('manage_users')) return false
    return true
  })

  const renderTab = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab user={user} />
      case 'security': return <SecurityTab user={user} />
      case 'roles': return <RolesTab />
      case 'notifications': return <NotificationsTab />
      case 'appearance': return <AppearanceTab />
      case 'about': return <AboutTab />
      default: return <ProfileTab user={user} />
    }
  }

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* Sidebar tabs */}
      <div className="w-56 flex-shrink-0">
        <nav className="card p-2 sticky top-6">
          <div className="space-y-0.5">
            {visibleTabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === key ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className="truncate">{label}</span>
                {activeTab === key && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-w-0">
        {renderTab()}
      </div>
    </div>
  )
}