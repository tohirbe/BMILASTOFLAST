// Yuqori header - sarlavha va foydalanuvchi profili
import { Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROL_RANGLAR = {
  admin: 'badge-blue',
  dekanat: 'badge-green',
  oqituvchi: 'badge-yellow',
  talaba: 'badge-red',
}

const ROL_NOMLAR = {
  admin: 'Administrator',
  dekanat: 'Dekanat',
  oqituvchi: "O'qituvchi",
  talaba: 'Talaba',
}

export default function Header({ title }) {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className={ROL_RANGLAR[user.rol] || 'badge-blue'}>
              {ROL_NOMLAR[user.rol] || user.rol}
            </span>
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {user.ism?.[0]}{user.familiya?.[0]}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}