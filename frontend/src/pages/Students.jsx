// Talabalar ro'yxati - qidiruv va filtr bilan
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentsApi, groupsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { Search, UserPlus, Eye, Trash2, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const DARAJA_COLORS = {
  erkak: 'badge-blue',
  ayol: 'badge-red',
}

export default function Students() {
  const { hasPermission } = useAuth()
  const [students, setStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [groupId, setGroupId] = useState('')
  const [kurs, setKurs] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (groupId) params.group_id = groupId
      if (kurs) params.kurs = kurs
      const [st, gr] = await Promise.all([studentsApi.list(params), groupsApi.list()])
      setStudents(st.data.filter(Boolean))
      setGroups(gr.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [search, groupId, kurs])

  const handleDelete = async (id) => {
    if (!window.confirm("Talabani o'chirishni tasdiqlaysizmi?")) return
    try {
      await studentsApi.delete(id)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || "Xatolik")
    }
  }

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetch} />

  return (
    <div className="space-y-4">
      {/* Filtrlar */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ism yoki familiya bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
          </select>
          <select
            value={kurs}
            onChange={(e) => setKurs(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Barcha kurslar</option>
            {[1,2,3,4].map(k => <option key={k} value={k}>{k}-kurs</option>)}
          </select>
          <div className="ml-auto text-sm text-slate-500 py-2">
            Jami: <span className="font-semibold text-slate-700">{students.length}</span> ta talaba
          </div>
        </div>
      </div>

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        {students.length === 0 ? (
          <EmptyState title="Talaba topilmadi" description="Filtrni o'zgartiring yoki yangi talaba qo'shing" />
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ism Familiya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Guruh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kurs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jinsi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qabul yili</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {students.map((student, i) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-700">
                          {student.ism?.[0]}{student.familiya?.[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800">
                        {student.familiya} {student.ism}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{student.group?.nomi || '-'}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{student.kurs}-kurs</td>
                  <td className="px-6 py-3">
                    <span className={DARAJA_COLORS[student.jinsi]}>
                      {student.jinsi === 'erkak' ? 'Erkak' : 'Ayol'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{student.qabul_yili}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/students/${student.id}`}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {hasPermission('manage_students') && (
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}