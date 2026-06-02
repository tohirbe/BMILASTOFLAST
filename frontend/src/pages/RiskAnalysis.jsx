// Xavf tahlili - ML bashorat, rangli indikatorlar
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { predictionsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { AlertTriangle, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DARAJA_CONFIG = {
  yuqori: { label: 'Yuqori xavf', bg: 'bg-red-50', border: 'border-red-200', badge: 'badge-red', dot: 'bg-red-500' },
  "o'rta": { label: "O'rta xavf", bg: 'bg-orange-50', border: 'border-orange-200', badge: 'badge-yellow', dot: 'bg-orange-500' },
  past: { label: 'Past xavf', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'badge-yellow', dot: 'bg-yellow-400' },
}

export default function RiskAnalysis() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('barchasi')

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await predictionsApi.atRisk()
      setData(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetch} />

  const filtered = filter === 'barchasi' ? data : data.filter(d => d.daraja === filter)
  const yuqori = data.filter(d => d.daraja === 'yuqori').length
  const orta = data.filter(d => d.daraja === "o'rta").length
  const past = data.filter(d => d.daraja === 'past').length

  // Grafik uchun top 10
  const chartData = data.slice(0, 10).map(d => ({
    ism: `${d.familiya.slice(0,1)}. ${d.ism}`,
    xavf: Math.round(d.xavf_ehtimoli * 100),
    ball: d.ortacha_ball
  }))

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-600">{yuqori}</div>
          <div className="text-sm text-slate-500">Yuqori xavf</div>
          <div className="text-xs text-slate-400">Xavf &gt; 70%</div>
        </div>
        <div className="card border-l-4 border-l-orange-400">
          <div className="text-2xl font-bold text-orange-500">{orta}</div>
          <div className="text-sm text-slate-500">O'rta xavf</div>
          <div className="text-xs text-slate-400">Xavf 50-70%</div>
        </div>
        <div className="card border-l-4 border-l-yellow-400">
          <div className="text-2xl font-bold text-yellow-500">{past}</div>
          <div className="text-sm text-slate-500">Past xavf</div>
          <div className="text-xs text-slate-400">Xavf 30-50%</div>
        </div>
      </div>

      {/* Grafik */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Top 10 xavf ostidagi talabalar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="ism" width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Xavf ehtimoli']} />
              <Bar dataKey="xavf" name="Xavf %" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.xavf > 70 ? '#ef4444' : entry.xavf > 50 ? '#f97316' : '#eab308'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtr */}
      <div className="flex gap-2">
        {['barchasi', 'yuqori', "o'rta", 'past'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f === 'barchasi' ? 'Barchasi' : f === 'yuqori' ? 'Yuqori' : f === "o'rta" ? "O'rta" : 'Past'}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'barchasi' ? data.length : f === 'yuqori' ? yuqori : f === "o'rta" ? orta : past})
            </span>
          </button>
        ))}
      </div>

      {/* Ro'yxat */}
      {filtered.length === 0 ? (
        <EmptyState title="Xavf ostidagi talabalar yo'q" icon="✅" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = DARAJA_CONFIG[item.daraja] || DARAJA_CONFIG.past
            return (
              <div key={item.student_id} className={`card flex items-center gap-4 border ${cfg.border} ${cfg.bg} py-4`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">
                      {item.familiya} {item.ism}
                    </span>
                    <span className={cfg.badge}>{cfg.label}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.guruh} • O'rtacha ball: <b>{item.ortacha_ball}</b> • Davomat: <b>{item.davomat_foizi}%</b>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Sabab: {item.sabab}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{
                      color: item.xavf_ehtimoli > 0.7 ? '#ef4444' : item.xavf_ehtimoli > 0.5 ? '#f97316' : '#eab308'
                    }}>
                      {Math.round(item.xavf_ehtimoli * 100)}%
                    </div>
                    <div className="text-xs text-slate-400">Xavf</div>
                  </div>
                  <Link to={`/students/${item.student_id}`}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}