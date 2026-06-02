// Sozlamalar - profil va parol o'zgartirish
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { CheckCircle } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [parol, setParol] = useState('')
  const [yangiParol, setYangiParol] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleParolChange = async (e) => {
    e.preventDefault()
    if (!yangiParol) { setError("Yangi parol kiritilmadi"); return }
    setLoading(true)
    setError('')
    try {
      await api.put(`/users/${user.id}`, { parol: yangiParol })
      setSuccess(true)
      setParol('')
      setYangiParol('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || "Xatolik")
    } finally {
      setLoading(false)
    }
  }

  const ROL_NOMLAR = { admin: 'Administrator', dekanat: 'Dekanat', oqituvchi: "O'qituvchi", talaba: 'Talaba' }

  return (
    <div className="max-w-xl space-y-6">
      {/* Profil */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Profil ma'lumotlari</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700">
              {user?.ism?.[0]}{user?.familiya?.[0]}
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-lg">{user?.familiya} {user?.ism}</div>
            <div className="text-sm text-slate-500">{user?.login}</div>
            <div className="text-xs text-primary-600 font-medium mt-0.5">{ROL_NOMLAR[user?.rol] || user?.rol}</div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Login", value: user?.login },
            { label: "Ism", value: user?.ism },
            { label: "Familiya", value: user?.familiya },
            { label: "Rol", value: ROL_NOMLAR[user?.rol] },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Parol o'zgartirish */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Parolni o'zgartirish</h3>
        {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>}
        {success && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Parol muvaffaqiyatli o'zgartirildi
          </div>
        )}
        <form onSubmit={handleParolChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yangi parol</label>
            <input type="password" value={yangiParol} onChange={(e) => setYangiParol(e.target.value)}
              placeholder="Kamida 6 ta belgi"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Saqlash
          </button>
        </form>
      </div>

      {/* Tizim haqida */}
      <div className="card bg-slate-50">
        <h3 className="font-semibold text-slate-700 mb-2">Tizim haqida</h3>
        <p className="text-sm text-slate-500">BMI Talabalar O'zlashtirish Tahlil Tizimi v1.0</p>
        <p className="text-xs text-slate-400 mt-1">Diplom loyihasi — React + FastAPI + SQLAlchemy + ML</p>
      </div>
    </div>
  )
}