// Talaba profili - semestr dinamikasi, radar, GPA, ML xavf
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { studentsApi, predictionsApi } from '../services/api'
import { PageLoader, ErrorState } from '../components/Common/Loader'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, User, BookOpen, TrendingUp, AlertCircle } from 'lucide-react'
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  RadialBarChart, RadialBar
} from 'recharts'

function RiskGauge({ value }) {
  const pct = Math.round(value * 100)
  const color = pct > 70 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
  const label = pct > 70 ? 'Yuqori xavf' : pct > 50 ? "O'rta xavf" : 'Past xavf'
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-sm font-medium mt-2" style={{ color }}>{label}</span>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const colorMap = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', yellow: 'text-yellow-600 bg-yellow-50' }
  return (
    <div className="card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

export default function StudentProfile() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const [profile, setProfile] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [pr] = await Promise.all([studentsApi.profile(id)])
        setProfile(pr.data)
        try {
          const pred = await predictionsApi.student(id)
          setPrediction(pred.data)
        } catch {}
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />
  if (!profile) return null

  const { student, gpa, davomat, semester_trend, subject_radar } = profile

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Orqaga */}
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Talabalar ro'yxatiga qaytish
      </Link>

      {/* Profil sarlavha */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-700">
            {student.ism?.[0]}{student.familiya?.[0]}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{student.familiya} {student.ism}</h2>
          <p className="text-slate-500 text-sm">{student.guruh} — {student.kurs}-kurs</p>
          <span className={`badge-${student.jinsi === 'erkak' ? 'blue' : 'red'} mt-1`}>
            {student.jinsi === 'erkak' ? 'Erkak' : 'Ayol'}
          </span>
        </div>
        <div className="ml-auto hidden md:block">
          {prediction && <RiskGauge value={prediction.xavf_ehtimoli} />}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="O'rtacha GPA" value={`${gpa} ball`} icon={TrendingUp} color="green" />
        <StatCard label="O'rtacha davomat" value={`${davomat}%`} icon={User} color="blue" />
        <StatCard label="Jami baholar" value={profile.jami_baholar} icon={BookOpen} color="yellow" />
        {prediction && (
          <StatCard label="Xavf ehtimoli" value={`${Math.round(prediction.xavf_ehtimoli * 100)}%`} icon={AlertCircle}
            color={prediction.xavf_ehtimoli > 0.5 ? 'red' : 'green'} />
        )}
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Semestr dinamikasi */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Semestr bo'yicha dinamika</h3>
          {semester_trend.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={semester_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="semestr" tickFormatter={(v) => `${v}-sem`} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="ortacha_ball" stroke="#6366f1" strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1' }} name="O'rtacha ball" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm">Ma'lumot yo'q</p>}
        </div>

        {/* Fan kesimi radar */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Fanlar kesimida (Radar)</h3>
          {subject_radar.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={subject_radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="fan" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Ball" dataKey="ball" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm">Ma'lumot yo'q</p>}
        </div>
      </div>

      {/* ML bashorat */}
      {prediction && (
        <div className="card border-l-4 border-l-primary-500">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary-600" />
            ML Bashorat
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Sabab:</span> {prediction.sabab}
            </p>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Tavsiyalar:</p>
              <ul className="list-disc list-inside space-y-1">
                {prediction.tavsiyalar?.map((t, i) => (
                  <li key={i} className="text-sm text-slate-500">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}