// Baho kiritish va tahrirlash sahifasi (o'qituvchi)
// Oyna yopiq bo'lsa — read-only rejim
import { useState, useEffect, useCallback } from 'react'
import { gradesApi, studentsApi, subjectsApi, groupsApi, gradeWindowsApi, componentsApi } from '../services/api'
import { PageLoader, EmptyState } from '../components/Common/Loader'
import { useAuth } from '../contexts/AuthContext'
import {
  PlusCircle, Trash2, CheckCircle, Lock, Unlock,
  AlertTriangle, History, X, Save, Edit2
} from 'lucide-react'

// ===== Tarix modali =====
function HistoryModal({ gradeId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gradesApi.history(gradeId)
      .then(r => setLogs(r.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [gradeId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-primary-600" />
            O'zgarishlar tarixi
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Yuklanmoqda...</div>
          ) : logs.length === 0 ? (
            <EmptyState title="Tarix yo'q" description="Bu baho hali o'zgartirilmagan" icon="📋" />
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="border border-slate-100 rounded-xl p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{log.kim}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.sana).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Eski ball</div>
                      <div className="text-lg font-bold text-red-500">{log.eski_ball}</div>
                    </div>
                    <div className="text-slate-300">→</div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Yangi ball</div>
                      <div className="text-lg font-bold text-green-600">{log.yangi_ball}</div>
                    </div>
                    {log.eski_davomat !== log.yangi_davomat && (
                      <>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Davomat</div>
                          <div className="text-sm font-medium">
                            <span className="text-red-400">{log.eski_davomat}%</span>
                            {' → '}
                            <span className="text-green-600">{log.yangi_davomat}%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {log.izoh && (
                    <div className="mt-2 text-xs text-slate-500 italic">"{log.izoh}"</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Inline tahrirlash qatori =====
function GradeRow({ grade, student, windowOpen, canAudit, weights, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [jn, setJn] = useState(grade.jn_ball ?? '')
  const [on_, setOn] = useState(grade.on_ball ?? '')
  const [yn, setYn] = useState(grade.yn_ball ?? '')
  const [davomat, setDavomat] = useState(grade.davomat_foizi)
  const [saving, setSaving] = useState(false)
  const [historyId, setHistoryId] = useState(null)

  const wj = weights?.jn_ulush ?? 0.30
  const wo = weights?.on_ulush ?? 0.30
  const wy = weights?.yn_ulush ?? 0.40

  const calcYakuniy = (j, o, y) => {
    if (j === '' || o === '' || y === '') return null
    return Math.round((parseFloat(j) * wj + parseFloat(o) * wo + parseFloat(y) * wy) * 10) / 10
  }

  const previewBall = calcYakuniy(jn, on_, yn)
  const displayBall = grade.yakuniy_ball ?? grade.ball
  const daraja = displayBall >= 86 ? { label: "A'lo", cls: 'badge-green' }
    : displayBall >= 71 ? { label: 'Yaxshi', cls: 'badge-blue' }
    : displayBall >= 56 ? { label: 'Qoniqarli', cls: 'badge-yellow' }
    : { label: 'Qoniqarsiz', cls: 'badge-red' }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (jn !== '') payload.jn_ball = parseFloat(jn)
      if (on_ !== '') payload.on_ball = parseFloat(on_)
      if (yn !== '') payload.yn_ball = parseFloat(yn)
      await componentsApi.updateGrade(grade.id, payload)
      // davomat ni ham saqlash
      await gradesApi.update(grade.id, {
        student_id: grade.student_id,
        subject_id: grade.subject_id,
        semestr: grade.semestr,
        ball: previewBall ?? displayBall,
        davomat_foizi: parseFloat(davomat)
      })
      onUpdated({ ...grade, jn_ball: payload.jn_ball, on_ball: payload.on_ball, yn_ball: payload.yn_ball,
        yakuniy_ball: previewBall ?? displayBall, ball: previewBall ?? displayBall, davomat_foizi: parseFloat(davomat) })
      setEditing(false)
    } catch (e) {
      alert(e.response?.data?.detail || "Saqlashda xatolik")
    } finally {
      setSaving(false)
    }
  }

  const numInput = (val, setter) => (
    <input type="number" min="0" max="100" step="0.5"
      value={val} onChange={e => setter(e.target.value)}
      className="w-16 px-1.5 py-1 border border-primary-400 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
  )

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3 text-sm font-medium text-slate-800">
          {student?.familiya} {student?.ism}
        </td>
        <td className="px-3 py-3 text-center">
          {editing ? numInput(jn, setJn) : <span className="text-sm text-indigo-700 font-medium">{grade.jn_ball ?? '—'}</span>}
        </td>
        <td className="px-3 py-3 text-center">
          {editing ? numInput(on_, setOn) : <span className="text-sm text-violet-700 font-medium">{grade.on_ball ?? '—'}</span>}
        </td>
        <td className="px-3 py-3 text-center">
          {editing ? numInput(yn, setYn) : <span className="text-sm text-emerald-700 font-medium">{grade.yn_ball ?? '—'}</span>}
        </td>
        <td className="px-4 py-3 text-center">
          {editing && previewBall !== null ? (
            <span className="text-sm font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg">{previewBall}</span>
          ) : (
            <span className="font-bold text-slate-800">{displayBall}</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {editing ? (
            <input type="number" min="0" max="100" step="1"
              value={davomat} onChange={e => setDavomat(e.target.value)}
              className="w-16 px-1.5 py-1 border border-primary-400 rounded-lg text-xs text-center focus:outline-none" />
          ) : (
            <span className="text-sm text-slate-600">{grade.davomat_foizi}%</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={daraja.cls}>{daraja.label}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {canAudit && (
              <button onClick={() => setHistoryId(grade.id)}
                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="O'zgarishlar tarixi">
                <History className="w-4 h-4" />
              </button>
            )}
            {windowOpen ? (
              editing ? (
                <>
                  <button onClick={handleSave} disabled={saving}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Saqlash">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditing(false); setJn(grade.jn_ball??''); setOn(grade.on_ball??''); setYn(grade.yn_ball??''); setDavomat(grade.davomat_foizi) }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleted(grade.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )
            ) : (
              <span className="text-xs text-slate-400 italic">o'qish</span>
            )}
          </div>
        </td>
      </tr>
      {historyId && <HistoryModal gradeId={historyId} onClose={() => setHistoryId(null)} />}
    </>
  )
}

// ===== Asosiy sahifa =====
export default function Grades() {
  const { hasPermission, user } = useAuth()
  const canAudit = hasPermission('view_grade_audit')

  const [subjects, setSubjects] = useState([])
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])

  const [selSubject, setSelSubject] = useState('')
  const [selGroup, setSelGroup] = useState('')
  const [selSemestr, setSelSemestr] = useState(1)

  const [windowInfo, setWindowInfo] = useState(null)
  const [weights, setWeights] = useState(null)
  const [loading, setLoading] = useState(false)

  // Yangi baho formasi
  const [newStudentId, setNewStudentId] = useState('')
  const [newBall, setNewBall] = useState('')
  const [newDavomat, setNewDavomat] = useState(85)
  const [addLoading, setAddLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([subjectsApi.list(), groupsApi.list()])
      .then(([s, g]) => { setSubjects(s.data); setGroups(g.data) })
  }, [])

  const loadData = useCallback(async () => {
    if (!selSubject || !selGroup) return
    setLoading(true)
    try {
      const [st, gr, win, wt] = await Promise.all([
        studentsApi.list({ group_id: selGroup }),
        gradesApi.list({ subject_id: selSubject, semestr: selSemestr }),
        gradeWindowsApi.check(selGroup, selSubject, selSemestr),
        componentsApi.getWeights(selSubject)
      ])
      setStudents(st.data.filter(Boolean))
      setGrades(gr.data)
      setWindowInfo(win.data)
      setWeights(wt.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selSubject, selGroup, selSemestr])

  useEffect(() => { loadData() }, [loadData])

  const windowOpen = !windowInfo || windowInfo.holati === 'ochiq'

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newStudentId || !newBall) return
    setAddLoading(true)
    try {
      await gradesApi.create({
        student_id: +newStudentId, subject_id: +selSubject,
        semestr: +selSemestr, ball: +newBall, davomat_foizi: +newDavomat
      })
      setSuccess(true); setTimeout(() => setSuccess(false), 2000)
      setNewStudentId(''); setNewBall(''); setNewDavomat(85)
      loadData()
    } catch (e) { alert(e.response?.data?.detail || "Xatolik") }
    finally { setAddLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bahoni o'chirishni tasdiqlaysizmi?")) return
    try { await gradesApi.delete(id); setGrades(p => p.filter(g => g.id !== id)) }
    catch (e) { alert(e.response?.data?.detail || "Xatolik") }
  }

  const handleUpdated = (updated) => {
    setGrades(p => p.map(g => g.id === updated.id ? updated : g))
  }

  // Jadvalga talabalarni moslashtirish
  const studentsInGrade = students.filter(s =>
    grades.some(g => g.student_id === s.id)
  )
  const studentsWithoutGrade = students.filter(s =>
    !grades.some(g => g.student_id === s.id)
  )

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Filtr */}
      <div className="card py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fan</label>
            <select value={selSubject} onChange={e => setSelSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tanlang...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Guruh</label>
            <select value={selGroup} onChange={e => setSelGroup(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Tanlang...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Semestr</label>
            <select value={selSemestr} onChange={e => setSelSemestr(+e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
            </select>
          </div>
          <div className="flex items-end">
            {windowInfo && (
              <div className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                ${windowOpen
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {windowOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {windowOpen ? 'Oyna ochiq' : 'Oyna yopiq'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Oyna yopiq ogohlantirish */}
      {selSubject && selGroup && !windowOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Baholash oynasi yopilgan</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Dekanat yoki administrator oynani ochgunicha baholarni o'zgartirib bo'lmaydi. Faqat ko'rish mumkin.
            </p>
          </div>
        </div>
      )}

      {/* Yangi baho qo'shish */}
      {selSubject && selGroup && windowOpen && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary-600" />
            Yangi baho kiritish
          </h3>
          {success && (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Baho qo'shildi
            </div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Talaba</label>
              <select required value={newStudentId} onChange={e => setNewStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Tanlang...</option>
                {studentsWithoutGrade.map(s => (
                  <option key={s.id} value={s.id}>{s.familiya} {s.ism}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ball (0-100)</label>
              <input type="number" required min="0" max="100" step="0.5"
                value={newBall} onChange={e => setNewBall(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="85" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={addLoading}
                className="w-full btn-primary flex items-center justify-center gap-2">
                {addLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Kiritish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Baholar jadvali */}
      {selSubject && selGroup && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Baholar jadvali</h3>
            <span className="text-sm text-slate-400">{grades.length} ta baho</span>
          </div>
          {loading ? (
            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : grades.length === 0 ? (
            <EmptyState title="Baholar yo'q" description="Hali baho kiritilmagan" icon="📝" />
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Talaba</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-indigo-500 uppercase">
                    JN {weights ? `(${Math.round(weights.jn_ulush*100)}%)` : ''}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-violet-500 uppercase">
                    ON {weights ? `(${Math.round(weights.on_ulush*100)}%)` : ''}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-emerald-500 uppercase">
                    YN {weights ? `(${Math.round(weights.yn_ulush*100)}%)` : ''}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Yakuniy</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Davomat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Daraja</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {grades.map(g => {
                  const student = students.find(s => s.id === g.student_id)
                  return (
                    <GradeRow key={g.id} grade={g} student={student}
                      windowOpen={windowOpen} canAudit={canAudit}
                      weights={weights}
                      onUpdated={handleUpdated}
                      onDeleted={handleDelete} />
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selSubject || !selGroup ? (
        <EmptyState title="Fan va guruhni tanlang" description="Baholarni ko'rish uchun fan va guruhni tanlang" icon="☝️" />
      ) : null}
    </div>
  )
}
