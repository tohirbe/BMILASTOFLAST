// Fanlar tahlili sahifasi
import { useState, useEffect } from 'react'
import { analyticsApi, subjectsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { BookOpen } from 'lucide-react'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Subjects() {
  const [subjectsAnalytics, setSubjectsAnalytics] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [an, sb] = await Promise.all([analyticsApi.subjects(), subjectsApi.list()])
      setSubjectsAnalytics(an.data)
      setSubjects(sb.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetch} />

  const sorted = [...subjectsAnalytics].sort((a, b) => b.ortacha_ball - a.ortacha_ball)
  const engQiyin = sorted[sorted.length - 1]
  const engOson = sorted[0]

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <BookOpen className="w-8 h-8 text-primary-600 mb-2" />
          <div className="text-2xl font-bold">{subjects.length}</div>
          <div className="text-sm text-slate-500">Jami fanlar</div>
        </div>
        {engOson && (
          <div className="card border-l-4 border-l-green-500">
            <div className="text-xs text-slate-400 mb-1">Eng oson fan</div>
            <div className="font-bold text-slate-800">{engOson.fan}</div>
            <div className="text-sm text-green-600">{engOson.ortacha_ball} ball</div>
          </div>
        )}
        {engQiyin && (
          <div className="card border-l-4 border-l-red-500">
            <div className="text-xs text-slate-400 mb-1">Eng qiyin fan</div>
            <div className="font-bold text-slate-800">{engQiyin.fan}</div>
            <div className="text-sm text-red-500">{engQiyin.ortacha_ball} ball</div>
          </div>
        )}
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Fan bo'yicha o'rtacha ball</h3>
          {subjectsAnalytics.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={subjectsAnalytics} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="fan" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#6366f1" radius={[0,4,4,0]} />
                <Bar dataKey="ozlashtirish" name="O'zlashtirish %" fill="#06b6d4" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">O'zlashtirish foizi taqsimoti</h3>
          {subjectsAnalytics.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={subjectsAnalytics} dataKey="ozlashtirish" nameKey="fan"
                  cx="50%" cy="50%" outerRadius={110} label={({ fan, ozlashtirish }) => `${fan.split(' ')[0]}: ${ozlashtirish}%`}>
                  {subjectsAnalytics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Fanlar jadvali</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fan nomi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kredit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Semestr</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">O'rtacha ball</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">O'zlashtirish</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Talabalar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {subjects.map((subj) => {
              const an = subjectsAnalytics.find(a => a.fan === subj.nomi)
              return (
                <tr key={subj.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{subj.nomi}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{subj.kredit}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{subj.semestr}-semestr</td>
                  <td className="px-6 py-3 text-sm font-medium text-primary-600">{an?.ortacha_ball ?? '-'}</td>
                  <td className="px-6 py-3">
                    {an ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-20">
                          <div className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${an.ozlashtirish}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{an.ozlashtirish}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">{an?.talabalar ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}