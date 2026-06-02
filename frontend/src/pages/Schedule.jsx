import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { scheduleApi, groupsApi, subjectsApi, usersApi } from '../services/api'
import { CalendarDays, Plus, Trash2, Edit2, X } from 'lucide-react'

const HAFTA_KUNLARI = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']
const JUFTLIKLAR = ['1-juft','2-juft','3-juft','4-juft','5-juft','6-juft','7-juft']

const COLORS = [
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
  'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
]

function SlotModal({ slot, groups, subjects, teachers, onClose, onSaved }) {
  const isEdit = !!slot
  const [form, setForm] = useState(slot ? {
    guruh_id: String(slot.guruh_id),
    fan_id: String(slot.fan_id),
    oqituvchi_id: String(slot.oqituvchi_id),
    hafta_kuni: String(slot.hafta_kuni),
    juftlik: String(slot.juftlik),
    xona: slot.xona || ''
  } : { guruh_id: '', fan_id: '', oqituvchi_id: '', hafta_kuni: '1', juftlik: '1', xona: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!form.guruh_id || !form.fan_id || !form.oqituvchi_id) {
      setErr("Majburiy maydonlarni to'ldiring")
      return
    }
    setSaving(true)
    setErr('')
    const payload = {
      guruh_id: +form.guruh_id,
      fan_id: +form.fan_id,
      oqituvchi_id: +form.oqituvchi_id,
      hafta_kuni: +form.hafta_kuni,
      juftlik: +form.juftlik,
      xona: form.xona || null
    }
    try {
      if (isEdit) await scheduleApi.update(slot.id, payload)
      else await scheduleApi.create(payload)
      onSaved()
      onClose()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isEdit ? 'Jadval yachekasini tahrirlash' : 'Jadvalga qo\'shish'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">{err}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Hafta kuni</label>
              <select value={form.hafta_kuni} onChange={e => setForm(p => ({ ...p, hafta_kuni: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
                {HAFTA_KUNLARI.map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Juftlik</label>
              <select value={form.juftlik} onChange={e => setForm(p => ({ ...p, juftlik: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
                {[1,2,3,4,5,6,7].map(j => <option key={j} value={j}>{j}-juftlik</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Guruh</label>
            <select value={form.guruh_id} onChange={e => setForm(p => ({ ...p, guruh_id: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
              <option value="">Tanlang</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Fan</label>
            <select value={form.fan_id} onChange={e => setForm(p => ({ ...p, fan_id: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
              <option value="">Tanlang</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">O'qituvchi</label>
            <select value={form.oqituvchi_id} onChange={e => setForm(p => ({ ...p, oqituvchi_id: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
              <option value="">Tanlang</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.familiya} {t.ism}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Xona (ixtiyoriy)</label>
            <input type="text" value={form.xona} onChange={e => setForm(p => ({ ...p, xona: e.target.value }))}
              placeholder="101, Lab-2 ..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm placeholder-slate-400" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">Bekor</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Qo\'shish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Schedule() {
  const { user } = useAuth()
  const canManage = ['admin', 'dekanat'].includes(user?.rol)

  const [slots, setSlots] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterGuruh, setFilterGuruh] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [modal, setModal] = useState(null)   // null | 'new' | slot object

  const load = (params = {}) => {
    setLoading(true)
    scheduleApi.list(params)
      .then(r => setSlots(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (canManage) {
      groupsApi.list().then(r => setGroups(r.data))
      subjectsApi.list().then(r => setSubjects(r.data))
      usersApi.list().then(r => setTeachers(r.data.filter(u => u.rol === 'oqituvchi')))
    } else {
      groupsApi.list().then(r => setGroups(r.data))
    }
    load()
  }, [])

  const applyFilter = () => {
    const params = {}
    if (filterGuruh) params.guruh_id = filterGuruh
    if (filterTeacher) params.oqituvchi_id = filterTeacher
    load(params)
  }

  useEffect(() => { applyFilter() }, [filterGuruh, filterTeacher])

  const deleteSlot = async (id) => {
    if (!confirm('Jadval yachekasini o\'chirasizmi?')) return
    await scheduleApi.delete(id)
    load()
  }

  // Grid uchun: grid[juftlik][hafta_kuni] = [slot, ...]
  const grid = {}
  for (let j = 1; j <= 7; j++) {
    grid[j] = {}
    for (let k = 1; k <= 6; k++) grid[j][k] = []
  }
  slots.forEach(s => {
    if (grid[s.juftlik] && grid[s.juftlik][s.hafta_kuni] !== undefined)
      grid[s.juftlik][s.hafta_kuni].push(s)
  })

  const fanColors = {}
  let colorIdx = 0
  slots.forEach(s => {
    if (!fanColors[s.fan_id]) fanColors[s.fan_id] = COLORS[colorIdx++ % COLORS.length]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <CalendarDays className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dars jadvali</h1>
            <p className="text-sm text-slate-500">{slots.length} ta yacheyka</p>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="w-4 h-4" /> Qo'shish
          </button>
        )}
      </div>

      {/* Filtr */}
      {canManage && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
          <select value={filterGuruh} onChange={e => setFilterGuruh(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
          </select>
          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
            <option value="">Barcha o'qituvchilar</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.familiya} {t.ism}</option>)}
          </select>
        </div>
      )}

      {/* Haftalik grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-24">Juftlik</th>
                  {HAFTA_KUNLARI.map((k, i) => (
                    <th key={i} className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {[1,2,3,4,5,6,7].map(juft => (
                  <tr key={juft} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-2 text-xs font-semibold text-slate-500">{JUFTLIKLAR[juft-1]}</td>
                    {[1,2,3,4,5,6].map(kun => (
                      <td key={kun} className="px-2 py-2 min-w-[130px]">
                        {grid[juft][kun].map(s => (
                          <div key={s.id}
                            className={`rounded-xl p-2 mb-1 border text-xs ${fanColors[s.fan_id] || COLORS[0]}`}>
                            <div className="font-semibold truncate">{s.fan_nomi}</div>
                            <div className="opacity-75 truncate">{s.guruh_nomi}</div>
                            {s.xona && <div className="opacity-60">📍 {s.xona}</div>}
                            {canManage && (
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setModal(s)}
                                  className="p-0.5 hover:bg-black/10 rounded transition-colors">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => deleteSlot(s.id)}
                                  className="p-0.5 hover:bg-black/10 rounded transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <SlotModal
          slot={modal === 'new' ? null : modal}
          groups={groups}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
