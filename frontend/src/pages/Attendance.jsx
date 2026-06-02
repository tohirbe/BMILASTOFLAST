import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { attendanceApi, groupsApi, subjectsApi } from '../services/api'
import { CalendarCheck, Plus, ChevronDown, Check, X, Clock, AlertCircle, Save, BarChart2 } from 'lucide-react'

const HOLAT_CONFIG = {
  keldi:    { label: 'Keldi',    color: 'bg-green-100 text-green-700',  icon: Check },
  kechikdi: { label: 'Kechikdi', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sababli:  { label: 'Sababli',  color: 'bg-blue-100 text-blue-700',    icon: AlertCircle },
  kelmadi:  { label: 'Kelmadi',  color: 'bg-red-100 text-red-700',      icon: X },
}

function HolatBadge({ holat }) {
  const cfg = HOLAT_CONFIG[holat] || HOLAT_CONFIG.kelmadi
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function YoqlamaModal({ lesson, onClose, onSaved }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    attendanceApi.getLessonRecords(lesson.id)
      .then(r => setRecords(r.data))
      .finally(() => setLoading(false))
  }, [lesson.id])

  const toggle = (talaba_id, holat) => {
    setRecords(prev => prev.map(r => r.talaba_id === talaba_id ? { ...r, holat } : r))
  }

  const save = async () => {
    setSaving(true)
    try {
      await attendanceApi.saveRecords(lesson.id, { records })
      onSaved()
      onClose()
    } catch {
      alert('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Yo'qlama</h3>
          <p className="text-sm text-slate-500 mt-1">{lesson.guruh_nomi} — {lesson.fan_nomi} — {lesson.sana}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Yuklanmoqda...</div>
          ) : records.map((r) => (
            <div key={r.talaba_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {r.familiya} {r.ism}
              </span>
              <div className="flex gap-1">
                {Object.keys(HOLAT_CONFIG).map(h => (
                  <button key={h}
                    onClick={() => toggle(r.talaba_id, h)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      r.holat === h
                        ? HOLAT_CONFIG[h].color + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-300'
                    }`}>
                    {HOLAT_CONFIG[h].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Bekor
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewLessonModal({ groups, subjects, onClose, onCreated }) {
  const [form, setForm] = useState({ guruh_id: '', fan_id: '', sana: new Date().toISOString().split('T')[0], mavzu: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.guruh_id || !form.fan_id || !form.sana) return alert("Majburiy maydonlarni to'ldiring")
    setSaving(true)
    try {
      await attendanceApi.createLesson({ ...form, guruh_id: +form.guruh_id, fan_id: +form.fan_id })
      onCreated()
      onClose()
    } catch (e) {
      alert(e.response?.data?.detail || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Yangi dars yaratish</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Guruh</label>
            <select value={form.guruh_id} onChange={e => setForm(p => ({ ...p, guruh_id: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
              <option value="">Tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fan</label>
            <select value={form.fan_id} onChange={e => setForm(p => ({ ...p, fan_id: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
              <option value="">Tanlang</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sana</label>
            <input type="date" value={form.sana} onChange={e => setForm(p => ({ ...p, sana: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mavzu (ixtiyoriy)</label>
            <input type="text" value={form.mavzu} onChange={e => setForm(p => ({ ...p, mavzu: e.target.value }))}
              placeholder="Dars mavzusi..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm placeholder-slate-400" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Bekor
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saqlanmoqda...' : 'Yaratish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Attendance() {
  const { user } = useAuth()
  const isTeacher = user?.rol === 'oqituvchi'
  const isStudent = user?.rol === 'talaba'

  const [lessons, setLessons] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeLesson, setActiveLesson] = useState(null)
  const [filterGuruh, setFilterGuruh] = useState('')
  const [filterFan, setFilterFan] = useState('')
  const [myStats, setMyStats] = useState(null)

  const loadLessons = () => {
    setLoading(true)
    const params = {}
    if (filterGuruh) params.guruh_id = filterGuruh
    if (filterFan) params.fan_id = filterFan
    attendanceApi.listLessons(params)
      .then(r => setLessons(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isStudent) {
      groupsApi.list().then(r => setGroups(r.data))
      subjectsApi.list().then(r => setSubjects(r.data))
    }
    if (isStudent && user?.student_id) {
      attendanceApi.studentStats(user.student_id)
        .then(r => setMyStats(r.data))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!isStudent) loadLessons()
  }, [filterGuruh, filterFan])

  if (isStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Davomatim</h1>
        </div>
        {myStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{myStats.foiz}%</div>
                <div className="text-sm text-slate-500 mt-1">Umumiy davomat</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-3xl font-bold text-green-600">{myStats.keldi}</div>
                <div className="text-sm text-slate-500 mt-1">Keldi</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{myStats.jami}</div>
                <div className="text-sm text-slate-500 mt-1">Jami dars</div>
              </div>
            </div>
            {myStats.fanlar?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Fanlar bo'yicha davomat</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {myStats.fanlar.map(f => (
                    <div key={f.fan_id} className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.fan_nomi}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${f.foiz}%` }} />
                        </div>
                        <span className={`text-sm font-semibold ${f.foiz >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {f.foiz}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">Ma'lumot yuklanmoqda...</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Davomat</h1>
            <p className="text-sm text-slate-500">{lessons.length} ta dars</p>
          </div>
        </div>
        {isTeacher && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="w-4 h-4" /> Yangi dars
          </button>
        )}
      </div>

      {/* Filtrlar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
        <select value={filterGuruh} onChange={e => setFilterGuruh(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
          <option value="">Barcha guruhlar</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
        </select>
        <select value={filterFan} onChange={e => setFilterFan(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
          <option value="">Barcha fanlar</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
        </select>
      </div>

      {/* Darslar jadvali */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Yuklanmoqda...</div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Darslar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sana</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Guruh</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mavzu</th>
                  {isTeacher && <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amal</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {lessons.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">{l.sana}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium">{l.guruh_nomi}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{l.fan_nomi}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 italic">{l.mavzu || '—'}</td>
                    {isTeacher && (
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => setActiveLesson(l)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                          Yo'qlama
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewLessonModal groups={groups} subjects={subjects}
          onClose={() => setShowNew(false)}
          onCreated={loadLessons} />
      )}
      {activeLesson && (
        <YoqlamaModal lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onSaved={loadLessons} />
      )}
    </div>
  )
}
