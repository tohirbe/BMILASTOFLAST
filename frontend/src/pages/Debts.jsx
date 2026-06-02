import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { debtsApi, groupsApi, subjectsApi } from '../services/api'
import { AlertCircle, CheckCircle, Clock, RefreshCw, Filter } from 'lucide-react'

const HOLAT_CFG = {
  ochiq:    { label: 'Ochiq',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    icon: AlertCircle },
  yopilgan: { label: 'Yopilgan', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
}

function HolatBadge({ holat }) {
  const cfg = HOLAT_CFG[holat] || HOLAT_CFG.ochiq
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </span>
  )
}

function RetakeModal({ debt, onClose, onDone }) {
  const [ball, setBall] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const b = parseFloat(ball)
    if (isNaN(b) || b < 0 || b > 100) return alert("Ball 0–100 oralig'ida bo'lishi kerak")
    setSaving(true)
    try {
      await debtsApi.retake(debt.id, b)
      onDone()
      onClose()
    } catch (e) {
      alert(e.response?.data?.detail || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Qayta topshirish</h3>
          <p className="text-sm text-slate-500 mt-1">
            {debt.talaba_ism} — {debt.fan_nomi} ({debt.semestr}-semestr)
          </p>
        </div>
        <div className="p-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yangi ball</label>
          <input type="number" min="0" max="100" value={ball}
            onChange={e => setBall(e.target.value)}
            placeholder="0–100"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {ball && parseFloat(ball) >= 56 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Qarzdorlik yopiladi
            </p>
          )}
          {ball && parseFloat(ball) < 56 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Ball yetarli emas, qarzdorlik ochiq qoladi
            </p>
          )}
        </div>
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Bekor
          </button>
          <button onClick={save} disabled={saving || !ball}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Debts() {
  const { user } = useAuth()
  const isStudent = user?.rol === 'talaba'
  const canManage = ['admin', 'dekanat', 'oqituvchi'].includes(user?.rol)

  const [debts, setDebts] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterGuruh, setFilterGuruh] = useState('')
  const [filterFan, setFilterFan] = useState('')
  const [filterHolat, setFilterHolat] = useState('ochiq')
  const [retakeDebt, setRetakeDebt] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (filterGuruh) params.guruh_id = filterGuruh
    if (filterFan) params.fan_id = filterFan
    if (filterHolat) params.holat = filterHolat
    debtsApi.list(params)
      .then(r => setDebts(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isStudent) {
      groupsApi.list().then(r => setGroups(r.data))
      subjectsApi.list().then(r => setSubjects(r.data))
    }
  }, [])

  useEffect(() => { load() }, [filterGuruh, filterFan, filterHolat])

  const ochiq = debts.filter(d => d.holat === 'ochiq').length
  const yopilgan = debts.filter(d => d.holat === 'yopilgan').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isStudent ? 'Qarzdorliklarim' : 'Akademik qarzdorliklar'}
          </h1>
          <p className="text-sm text-slate-500">{ochiq} ta ochiq, {yopilgan} ta yopilgan</p>
        </div>
      </div>

      {/* KPI kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{ochiq}</div>
          <div className="text-sm text-slate-500 mt-1">Ochiq qarzdorliklar</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{yopilgan}</div>
          <div className="text-sm text-slate-500 mt-1">Yopilgan</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">{debts.length}</div>
          <div className="text-sm text-slate-500 mt-1">Jami</div>
        </div>
      </div>

      {/* Filtrlar */}
      {!isStudent && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
          </div>
          <select value={filterHolat} onChange={e => setFilterHolat(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
            <option value="">Barcha holatlar</option>
            <option value="ochiq">Ochiq</option>
            <option value="yopilgan">Yopilgan</option>
          </select>
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
      )}

      {/* Jadval */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Yuklanmoqda...</div>
        ) : debts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-500" />
            <p>Qarzdorlik topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  {!isStudent && <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Talaba</th>}
                  {!isStudent && <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Guruh</th>}
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Semestr</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Holat</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Yangi ball</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sana</th>
                  {canManage && <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Amal</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {debts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    {!isStudent && <td className="px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200">{d.talaba_ism}</td>}
                    {!isStudent && <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">{d.guruh_nomi}</span>
                    </td>}
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">{d.fan_nomi}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{d.semestr}-semestr</td>
                    <td className="px-5 py-3.5"><HolatBadge holat={d.holat} /></td>
                    <td className="px-5 py-3.5 text-sm">
                      {d.yangi_ball != null ? (
                        <span className={`font-semibold ${d.yangi_ball >= 56 ? 'text-green-600' : 'text-orange-600'}`}>{d.yangi_ball}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {d.qayta_topshirish_sana
                        ? new Date(d.qayta_topshirish_sana).toLocaleDateString('uz-UZ')
                        : new Date(d.yuzaga_kelgan_sana).toLocaleDateString('uz-UZ')}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-center">
                        {d.holat === 'ochiq' && (
                          <button onClick={() => setRetakeDebt(d)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 mx-auto">
                            <RefreshCw className="w-3.5 h-3.5" /> Qayta
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {retakeDebt && (
        <RetakeModal debt={retakeDebt} onClose={() => setRetakeDebt(null)} onDone={load} />
      )}
    </div>
  )
}
