// Login sahifasi - chiroyli dizayn bilan
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [login, setLogin] = useState('')
  const [parol, setParol] = useState('')
  const [showParol, setShowParol] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login: doLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await doLogin(login, parol)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login yoki parol noto\'g\'ri')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">BMI Talabalar Tizimi</h1>
          <p className="text-slate-500 mt-1 text-sm">O'zlashtirish ko'rsatkichlari tahlili</p>
        </div>

        {/* Karta */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Tizimga kirish</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Loginni kiriting"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showParol ? 'text' : 'password'}
                  value={parol}
                  onChange={(e) => setParol(e.target.value)}
                  placeholder="Parolni kiriting"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowParol(!showParol)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showParol ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>

          {/* Demo loginlar */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2 font-medium">Demo loginlar:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { login: 'admin', parol: 'admin123', rol: 'Admin' },
                { login: 'dekanat', parol: 'dekan123', rol: 'Dekanat' },
                { login: 'oqituvchi', parol: 'teacher123', rol: "O'qituvchi" },
                { login: 'talaba', parol: 'student123', rol: 'Talaba' },
              ].map((demo) => (
                <button
                  key={demo.login}
                  onClick={() => { setLogin(demo.login); setParol(demo.parol) }}
                  className="text-left px-3 py-2 bg-slate-50 hover:bg-primary-50 rounded-lg text-xs transition-colors border border-slate-100"
                >
                  <div className="font-medium text-slate-700">{demo.rol}</div>
                  <div className="text-slate-400">{demo.login}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}