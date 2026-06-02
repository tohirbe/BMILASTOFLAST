// Guruhlar taqqoslashi - bar, radar, heatmap
import { useState, useEffect } from 'react'
import { analyticsApi, groupsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import Heatmap from '../components/Charts/Heatmap'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function Groups() {
  const [groupsAnalytics, setGroupsAnalytics] = useState([])
  const [heatmap, setHeatmap] = useState({ guruhlar: [], fanlar: [], matrix: [] })
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [ga, hm, gr] = await Promise.all([
        analyticsApi.groups(),
        analyticsApi.heatmap(),
        groupsApi.list(),
      ])
      setGroupsAnalytics(ga.data)
      setHeatmap(hm.data)
      setGroups(gr.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetch} />

  const sorted = [...groupsAnalytics].sort((a, b) => b.ortacha_ball - a.ortacha_ball)

  return (
    <div className="space-y-6">
      {/* Reytingi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.slice(0, 4).map((g, i) => (
          <div key={g.guruh} className={`card border-l-4 ${i === 0 ? 'border-l-yellow-400' : i === 1 ? 'border-l-slate-400' : 'border-l-slate-300'}`}>
            <div className="text-xs text-slate-400 mb-1">#{i + 1} o'rin</div>
            <div className="font-bold text-slate-800 text-lg">{g.guruh}</div>
            <div className="text-sm text-primary-600 font-medium">{g.ortacha_ball} ball</div>
            <div className="text-xs text-slate-400">O'zlashtirish: {g.ozlashtirish}%</div>
          </div>
        ))}
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Guruhlar taqqoslashi</h3>
          {groupsAnalytics.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={groupsAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="guruh" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="ortacha_davomat" name="Davomat %" fill="#06b6d4" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Guruhlar reytingi (Radar)</h3>
          {groupsAnalytics.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={groupsAnalytics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="guruh" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="O'rtacha ball" dataKey="ortacha_ball" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Radar name="Davomat %" dataKey="ortacha_davomat" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Guruh × Fan matritsasi</h3>
        <Heatmap {...heatmap} />
      </div>

      {/* Guruhlar jadvali */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Guruhlar ro'yxati</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Guruh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kurs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Yo'nalish</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">O'rtacha ball</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">O'zlashtirish</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Davomat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {groups.map((g) => {
              const an = groupsAnalytics.find(a => a.guruh === g.nomi)
              return (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-semibold text-primary-700">{g.nomi}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{g.kurs}-kurs</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{g.yonalish}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{an?.ortacha_ball ?? '-'}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{an?.ozlashtirish ? `${an.ozlashtirish}%` : '-'}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{an?.ortacha_davomat ? `${an.ortacha_davomat}%` : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}