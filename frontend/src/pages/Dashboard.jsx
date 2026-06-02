// Dashboard - KPI kartalar va ko'p grafik
import { useState, useEffect } from 'react'
import { analyticsApi, groupsApi, debtsApi, attendanceApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import Heatmap from '../components/Charts/Heatmap'
import {
  Users, TrendingUp, Award, AlertTriangle, Activity,
  Star, TrendingDown, AlertCircle, CalendarCheck
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function FilterBar({ groups, filters, onChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.group_id || ''}
        onChange={(e) => onChange({ ...filters, group_id: e.target.value || undefined })}
      >
        <option value="">Barcha guruhlar</option>
        {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
      </select>
      <select
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.semestr || ''}
        onChange={(e) => onChange({ ...filters, semestr: e.target.value || undefined })}
      >
        <option value="">Barcha semestrlar</option>
        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
      </select>
    </div>
  )
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [trend, setTrend] = useState([])
  const [subjects, setSubjects] = useState([])
  const [distribution, setDistribution] = useState([])
  const [histogram, setHistogram] = useState([])
  const [scatter, setScatter] = useState({ data: [], korrelyatsiya: 0 })
  const [heatmap, setHeatmap] = useState({ guruhlar: [], fanlar: [], matrix: [] })
  const [genderStats, setGenderStats] = useState([])
  const [courseStats, setCourseStats] = useState([])
  const [groups, setGroups] = useState([])
  const [filters, setFilters] = useState({})
  const [openDebts, setOpenDebts] = useState(null)
  const [attOverview, setAttOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, tr, subj, dist, hist, sc, hm, gen, crs, grp] = await Promise.all([
        analyticsApi.overview(filters),
        analyticsApi.trend(filters),
        analyticsApi.subjects(filters),
        analyticsApi.distribution(filters),
        analyticsApi.histogram(filters),
        analyticsApi.attendanceGrade(filters),
        analyticsApi.heatmap(),
        analyticsApi.genderStats(),
        analyticsApi.courseStats(),
        groupsApi.list(),
      ])
      setOverview(ov.data)
      setTrend(tr.data)
      setSubjects(subj.data)
      setDistribution(dist.data)
      setHistogram(hist.data)
      setScatter(sc.data)
      setHeatmap(hm.data)
      setGenderStats(gen.data)
      setCourseStats(crs.data)
      setGroups(grp.data)
      // Yangi KPIlar
      debtsApi.openCount().then(r => setOpenDebts(r.data.ochiq_qarzdorliklar)).catch(() => {})
      attendanceApi.overview().then(r => setAttOverview(r.data)).catch(() => {})
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [JSON.stringify(filters)])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetchAll} />

  return (
    <div className="space-y-6">
      {/* Filtrlar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-slate-600">Umumiy ko'rinish</h2>
        <FilterBar groups={groups} filters={filters} onChange={setFilters} />
      </div>

      {/* KPI kartalar */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Jami talabalar" value={overview.jami_talaba} color="blue" />
          <KpiCard icon={Award} label="O'rtacha GPA" value={`${overview.ortacha_gpa}`} color="green" />
          <KpiCard icon={TrendingUp} label="O'zlashtirish" value={`${overview.ozlashtirish_foizi}%`} color="purple" />
          <KpiCard icon={AlertTriangle} label="Xavf ostida" value={overview.xavf_ostida} color="red" />
          <KpiCard icon={Activity} label="O'rtacha davomat" value={`${overview.ortacha_davomat}%`} color="yellow" />
          <KpiCard icon={Star} label="Eng yaxshi guruh" value={overview.eng_yaxshi_guruh} color="green" />
          <KpiCard icon={TrendingDown} label="Eng zaif guruh" value={overview.eng_zaif_guruh} color="red" />
          {openDebts !== null && (
            <KpiCard icon={AlertCircle} label="Ochiq qarzdorliklar" value={openDebts} color="red" />
          )}
          {attOverview && (
            <KpiCard icon={CalendarCheck} label="Real davomat" value={`${attOverview.o_rtacha_foiz}%`} color="yellow" sub={`${attOverview.jami_darslar} ta dars`} />
          )}
        </div>
      )}

      {/* Grafiklar - 1-qator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semestr tendensiyasi */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Semestr bo'yicha dinamika</h3>
          {trend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorBall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="semestr" tickFormatter={(v) => `${v}-sem`} tick={{ fontSize: 12 }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v} ball`, "O'rtacha"]} />
                <Area type="monotone" dataKey="ortacha_ball" stroke="#6366f1" strokeWidth={2}
                  fill="url(#colorBall)" dot={{ r: 4, fill: '#6366f1' }} name="O'rtacha ball" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        {/* Baho taqsimoti */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Baho darajalari taqsimoti</h3>
          {distribution.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={distribution} dataKey="soni" nameKey="daraja" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90} paddingAngle={3} label={({ daraja, percent }) =>
                    `${(percent * 100).toFixed(0)}%`}>
                  {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Grafiklar - 2-qator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan bo'yicha */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Fanlar bo'yicha o'rtacha ball</h3>
          {subjects.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjects} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="fan" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="ortacha_ball" fill="#6366f1" radius={[0, 4, 4, 0]} name="O'rtacha ball" />
                <Bar dataKey="ozlashtirish" fill="#06b6d4" radius={[0, 4, 4, 0]} name="O'zlashtirish %" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        {/* Histogramma */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Ball taqsimoti (histogramma)</h3>
          {histogram.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="interval" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="soni" name="Talabalar soni" radius={[4, 4, 0, 0]}>
                  {histogram.map((entry, i) => {
                    const interval = entry.interval
                    const start = parseInt(interval.split('-')[0])
                    const color = start >= 86 ? '#10b981' : start >= 71 ? '#6366f1' : start >= 56 ? '#f59e0b' : '#ef4444'
                    return <Cell key={i} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Grafiklar - 3-qator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter - davomat vs ball */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Davomat vs Ball bog'liqligi</h3>
            <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium">
              r = {scatter.korrelyatsiya}
            </span>
          </div>
          {scatter.data?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="davomat" name="Davomat %" unit="%" tick={{ fontSize: 12 }} domain={[40, 100]} />
                <YAxis dataKey="ball" name="Ball" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => payload?.[0] ? (
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow">
                      <p className="font-medium">{payload[0].payload.ism}</p>
                      <p>Davomat: {payload[0].payload.davomat}%</p>
                      <p>Ball: {payload[0].payload.ball}</p>
                    </div>
                  ) : null} />
                <Scatter data={scatter.data} fill="#6366f1" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        {/* Jins kesimida */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Jins bo'yicha va kurs bo'yicha tahlil</h3>
          <div className="grid grid-cols-2 gap-4 h-[240px]">
            {genderStats.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="jinsi" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
            {courseStats.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="kurs" tickFormatter={(v) => `${v}-kurs`} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="ortacha_ball" name="O'rtacha ball" fill="#06b6d4" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Guruh × Fan o'rtacha ball matritsasi</h3>
        <Heatmap {...heatmap} />
      </div>
    </div>
  )
}