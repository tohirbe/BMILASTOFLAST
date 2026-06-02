// Baholar kiritish sahifasi (o'qituvchi uchun)
import { useState, useEffect } from 'react'
import { gradesApi, studentsApi, subjectsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Grades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ student_id: '', subject_id: '', semestr: 1, ball: '', davomat_foizi: 85 })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const [gr, st, su] = await Promise.all([gradesApi.list(), studentsApi.list(), subjectsApi.list()])
      setGrades(gr.data)
      setStudents(st.data.filter(Boolean))
      setSubjects(su.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await gradesApi.create({
        student_id: +form.student_id,
        subject_id: +form.subject_id,
        semestr: +form.semestr,
        ball: +form.ball,
        davomat_foizi: +form.davomat_foizi
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      setForm({ student_id: '', subject_id: '', semestr: 1, ball: '', davomat_foizi: 85 })
      fetch()
    } catch (e) {
      alert(e.response?.data?.detail || "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return
    await gradesApi.delete(id)
    setGrades(prev => prev.filter(g => g.id !== id))
  }

  const getBall = (ball) => {
    if (ball >= 86) return { label: "A'lo", color: 'badge-green' }
    if (ball >= 71) return { label: 'Yaxshi', color: 'badge-blue' }
    if (ball >= 56) return { label: 'Qoniqarli', color: 'badge-yellow' }
    return { label: 'Qoniqarsiz', color: 'badge-red' }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Baho kiritish formasi */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary-600" />
          Yangi baho kiritish
        </h3>
        {success && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Baho muvaffaqiyatli kiritildi
          </div>
        )}
        <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Talaba</label>
            <select required value={form.student_id} onChange={(e) => setForm({...form, student_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tanlang...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.familiya} {s.ism}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fan</label>
            <select required value={form.subject_id} onChange={(e) => setForm({...form, subject_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tanlang...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Semestr</label>
            <select value={form.semestr} onChange={(e) => setForm({...form, semestr: +e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ball (0-100)</label>
            <input type="number" required min="0" max="100" step="0.1"
              value={form.ball} onChange={(e) => setForm({...form, ball: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="85" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Davomat % (0-100)</label>
            <input type="number" min="0" max="100" step="1"
              value={form.davomat_foizi} onChange={(e) => setForm({...form, davomat_foizi: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="85" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Kiritish
            </button>
          </div>
        </form>
      </div>

      {/* Baholar jadvali */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Baholar ro'yxati</h3>
          <span className="text-sm text-slate-400">Jami: {grades.length} ta</span>
        </div>
        {grades.length === 0 ? <EmptyState title="Baholar yo'q" /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Talaba</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Semestr</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ball</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Daraja</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Davomat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {grades.slice(0, 50).map(g => {
                  const d = getBall(g.ball)
                  return (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-sm text-slate-700">ID:{g.student_id}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">ID:{g.subject_id}</td>
                      <td className="px-4 py-2 text-sm text-slate-500">{g.semestr}-semestr</td>
                      <td className="px-4 py-2 text-sm font-bold text-slate-800">{g.ball}</td>
                      <td className="px-4 py-2"><span className={d.color}>{d.label}</span></td>
                      <td className="px-4 py-2 text-sm text-slate-500">{g.davomat_foizi}%</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleDelete(g.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}