// Hisobotlar - jins, kurs, semestr taqqoslash
import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { useAuth } from '../contexts/AuthContext'
import { Download } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function Reports() {
  const { hasPermission } = useAuth()
  const [genderStats, setGenderStats] = useState([])
  const [courseStats, setCourseStats] = useState([])
  const [semCompare, setSemCompare] = useState([])
  const [sem1, setSem1] = useState(1)
  const [sem2, setSem2] = useState(2)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    try {
      const [gen, crs, sem] = await Promise.all([
        analyticsApi.genderStats(),
        analyticsApi.courseStats(),
        analyticsApi.semesterCompare({ sem1, sem2 }),
      ])
      setGenderStats(gen.data)
      setCourseStats(crs.data)
      setSemCompare(sem.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [sem1, sem2])

  const exportCSV = () => {
    const rows = [['Ko\'rsatkich', 'Qiymat']]
    genderStats.forEach(g => rows.push([`${g.jinsi} - o'rtacha ball`, g.ortacha_ball]))
    courseStats.forEach(c => rows.push([`${c.kurs}-kurs - o'rtacha ball`, c.ortacha_ball]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hisobot.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Semestr taqqoslash filtri */}
      <div className="card flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-slate-700">Semestr taqqoslash:</span>
        <select value={sem1} onChange={(e) => setSem1(+e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
        </select>
        <span className="text-slate-400">va</span>
        <select value={sem2} onChange={(e) => setSem2(+e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
        </select>
        {hasPermission('export_reports') && (
          <button onClick={exportCSV} className="ml-auto btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            CSV eksport
          </button>
        )}
      </div>

      {/* Grafiklar 1-qator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Jins bo'yicha tahlil</h3>
          {genderStats.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={genderStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="jinsi" tickFormatter={(v) => v === 'erkak' ? 'Erkak' : 'Ayol'} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="ozlashtirish" name="O'zlashtirish %" fill="#06b6d4" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Kurslar bo'yicha tahlil</h3>
          {courseStats.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={courseStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="kurs" tickFormatter={(v) => `${v}-kurs`} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="ozlashtirish" name="O'zlashtirish %" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Semestr taqqoslash */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">
          {sem1}-semestr va {sem2}-semestr taqqoslash (fan bo'yicha)
        </h3>
        {semCompare.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={semCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fan" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey={`sem_${sem1}`} name={`${sem1}-semestr`} fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey={`sem_${sem2}`} name={`${sem2}-semestr`} fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState description="Tanlangan semestrlar uchun ma'lumot yo'q" />}
      </div>

      {/* Jadval */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Jins bo'yicha jadval</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium">Jinsi</th>
                <th className="text-right py-2 text-slate-500 font-medium">O'rtacha</th>
                <th className="text-right py-2 text-slate-500 font-medium">O'zlashtirish</th>
              </tr>
            </thead>
            <tbody>
              {genderStats.map(g => (
                <tr key={g.jinsi} className="border-b border-slate-50">
                  <td className="py-2 capitalize">{g.jinsi === 'erkak' ? 'Erkak' : 'Ayol'}</td>
                  <td className="py-2 text-right font-medium text-primary-600">{g.ortacha_ball}</td>
                  <td className="py-2 text-right">{g.ozlashtirish}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Kurslar bo'yicha jadval</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium">Kurs</th>
                <th className="text-right py-2 text-slate-500 font-medium">O'rtacha</th>
                <th className="text-right py-2 text-slate-500 font-medium">O'zlashtirish</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.map(c => (
                <tr key={c.kurs} className="border-b border-slate-50">
                  <td className="py-2">{c.kurs}-kurs</td>
                  <td className="py-2 text-right font-medium text-primary-600">{c.ortacha_ball}</td>
                  <td className="py-2 text-right">{c.ozlashtirish}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}