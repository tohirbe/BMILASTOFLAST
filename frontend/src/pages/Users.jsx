// Foydalanuvchilar boshqaruvi (faqat admin)
import { useState, useEffect } from 'react'
import { usersApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { UserPlus, Pencil, Trash2, X, Check } from 'lucide-react'

const ROL_BADGE = {
  admin: 'badge-blue',
  dekanat: 'badge-green',
  oqituvchi: 'badge-yellow',
  talaba: 'badge-red',
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { login: '', parol: '', ism: '', familiya: '', rol: 'talaba' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      if (user) {
        const data = { ism: form.ism, familiya: form.familiya, rol: form.rol }
        if (form.parol) data.parol = form.parol
        await usersApi.update(user.id, data)
      } else {
        await usersApi.create(form)
      }
      onSave()
    } catch (e) {
      setError(e.response?.data?.detail || "Xatolik")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{user ? "Tahrirlash" : "Yangi foydalanuvchi"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
              <input value={form.login} onChange={(e) => setForm({...form, login: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ism</label>
            <input value={form.ism} onChange={(e) => setForm({...form, ism: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Familiya</label>
            <input value={form.familiya} onChange={(e) => setForm({...form, familiya: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="admin">Admin</option>
              <option value="dekanat">Dekanat</option>
              <option value="oqituvchi">O'qituvchi</option>
              <option value="talaba">Talaba</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {user ? "Yangi parol (ixtiyoriy)" : "Parol"}
            </label>
            <input type="password" value={form.parol || ''} onChange={(e) => setForm({...form, parol: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Bekor</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'new' | user object

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await usersApi.list()
      setUsers(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return
    try {
      await usersApi.delete(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      alert(e.response?.data?.detail || "Xatolik")
    }
  }

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetch} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Jami: {users.length} ta foydalanuvchi</p>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Yangi foydalanuvchi
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {users.length === 0 ? <EmptyState /> : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ism Familiya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{u.familiya} {u.ism}</td>
                  <td className="px-6 py-3 text-sm text-slate-500 font-mono">{u.login}</td>
                  <td className="px-6 py-3">
                    <span className={ROL_BADGE[u.rol] || 'badge-blue'}>{u.rol}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setModal(u)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetch() }}
        />
      )}
    </div>
  )
}