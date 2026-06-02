import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { analyticsApi } from '../services/api'
import {
  TrendingUp, Users, BookOpen, BarChart2, AlertCircle,
  Award, ChevronUp, ChevronDown, Minus
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from 'recharts'

function StatCard({ icon: Icon, label, value, color = 'indigo', sub }) {
  const colors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    green:  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber:  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className={`inline-flex p-2.5 rounded-xl ${colors[color]} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{value ?? '—'}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function RankBadge({ rank, total }) {
  const pct = total > 1 ? rank / total : 0.5
  if (pct <= 0.33) return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><ChevronUp className="w-3.5 h-3.5" />Yuqori</span>
  if (pct >= 0.67) return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><ChevronDown className="w-3.5 h-3.5" />Past</span>
  return <span className="flex items-center gap-1 text-slate-500 text-xs font-semibold"><Minus className="w-3.5 h-3.5" />O'rtacha</span>
}

export default function TeacherPerformance() {
  const { user } = useAuth()
  const isTeacher = user?.rol === 'oqituvchi'

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.teachersList()
      .then(r => setList(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>
  }

  if (isTeacher) {
    const me = list[0]
    if (!me) return <div className="text-center py-20 text-slate-400">Ma'lumot topilmadi</div>
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mening samaradorligim</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Fanlar" value={me.fanlar_soni} color="indigo" />
          <StatCard icon={BarChart2} label="O'rtacha ball" value={me.o_rtacha_ball} color="green" />
          <StatCard icon={Users} label="O'zlashtirish" value={me.ozlashtirish_foizi != null ? `${me.ozlashtirish_foizi}%` : null} color="amber" />
          <StatCard icon={AlertCircle} label="Ochiq qarzlar" value={me.ochiq_qarzlar} color="red" />
        </div>
        {me.fan_tafsilot?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Fanlar bo'yicha</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={me.fan_tafsilot} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fan_nomi" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [v, n === 'o_rtacha_ball' ? "O'rtacha ball" : "O'zlashtirish %"]} />
                <Bar dataKey="o_rtacha_ball" name="O'rtacha ball" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="ozlashtirish_foizi" name="O'zlashtirish %" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  // Dekanat/Admin: barcha o'qituvchilar taqqoslamasi
  const sorted = [...list].sort((a, b) => (b.o_rtacha_ball || 0) - (a.o_rtacha_ball || 0))
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const barData = sorted.map(t => ({
    name: t.ism.split(' ')[0],
    ball: t.o_rtacha_ball,
    ozlashtirish: t.ozlashtirish_foizi,
    davomat: t.o_rtacha_davomat,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">O'qituvchilar samaradorligi</h1>
          <p className="text-sm text-slate-500">{list.length} ta o'qituvchi</p>
        </div>
      </div>

      {/* Eng yuqori / past */}
      {best && worst && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">Eng yuqori samaradorlik</span>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{best.ism}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ball: <strong>{best.o_rtacha_ball}</strong> • O'zlashtirish: <strong>{best.ozlashtirish_foizi}%</strong>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">Eng past samaradorlik</span>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{worst.ism}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ball: <strong>{worst.o_rtacha_ball}</strong> • O'zlashtirish: <strong>{worst.ozlashtirish_foizi}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {barData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">O'qituvchilar taqqoslamasi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === 'ball' ? "O'rtacha ball" : n === 'ozlashtirish' ? "O'zlashtirish %" : "Davomat %"]} />
              <Bar dataKey="ball" name="ball" fill="#6366f1" radius={[4,4,0,0]}>
                {barData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : i === barData.length - 1 ? '#f43f5e' : '#6366f1'} />)}
              </Bar>
              <Bar dataKey="ozlashtirish" name="ozlashtirish" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Jadval */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">Batafsil jadval</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">O'qituvchi</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Fanlar</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">O'rtacha ball</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">O'zlashtirish</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Davomat</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Ochiq qarz</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Daraja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sorted.map((t, i) => (
                <tr key={t.teacher_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-500">{i + 1}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200">{t.ism}</td>
                  <td className="px-5 py-3.5 text-center text-sm text-slate-600 dark:text-slate-400">{t.fanlar_soni}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-sm font-semibold ${
                      t.o_rtacha_ball >= 75 ? 'text-green-600' :
                      t.o_rtacha_ball >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>{t.o_rtacha_ball ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-slate-600 dark:text-slate-400">
                    {t.ozlashtirish_foizi != null ? `${t.ozlashtirish_foizi}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-slate-600 dark:text-slate-400">
                    {t.o_rtacha_davomat != null ? `${t.o_rtacha_davomat}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-sm font-semibold ${t.ochiq_qarzlar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {t.ochiq_qarzlar}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <RankBadge rank={i + 1} total={sorted.length} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
