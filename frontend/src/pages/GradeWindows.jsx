// Baholash oynalarini boshqarish sahifasi (dekanat / admin)
import { useState, useEffect, useCallback } from 'react'
import { gradeWindowsApi, groupsApi, subjectsApi } from '../services/api'
import { PageLoader, ErrorState, EmptyState } from '../components/Common/Loader'
import { Lock, Unlock, RefreshCw, Plus, Filter } from 'lucide-react'

function WindowBadge({ holati }) {
  return holati === 'ochiq'
    ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <Unlock className="w-3 h-3" /> Ochiq
      </span>
    : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <Lock className="w-3 h-3" /> Yopiq
      </span>
}

export default function GradeWindows() {
  const [windows, setWindows] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterGroup, setFilterGroup] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [actionId, setActionId] = useState(null)

  // Yangi oyna yaratish holati
  const [newGuruh, setNewGuruh] = useState('')
  const [newFan, setNewFan] = useState('')
  const [newSem, setNewSem] = useState(1)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [win, grp, sub] = await Promise.all([
        gradeWindowsApi.list(),
        groupsApi.list(),
        subjectsApi.list()
      ])
      setWindows(win.data)
      setGroups(grp.data)
      setSubjects(sub.data)
    } catch (e) {
      setError(e.response?.data?.detail || "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleToggle = async (win) => {
    setActionId(win.id)
    try {
      if (win.holati === 'ochiq') {
        await gradeWindowsApi.lock(win.id)
      } else {
        await gradeWindowsApi.unlock(win.id)
      }
      setWindows(prev => prev.map(w => w.id === win.id
        ? { ...w, holati: w.holati === 'ochiq' ? 'yopiq' : 'ochiq' }
        : w
      ))
    } catch (e) {
      alert(e.response?.data?.detail || "Xatolik")
    } finally {
      setActionId(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newGuruh || !newFan) return
    setCreating(true)
    try {
      const r = await gradeWindowsApi.ensure(+newGuruh, +newFan, +newSem)
      // Allaqachon mavjud bo'lsa ham OK
      setWindows(prev => {
        const exists = prev.find(w => w.id === r.data.id)
        return exists ? prev : [...prev, r.data]
      })
      setShowCreate(false)
      setNewGuruh(''); setNewFan(''); setNewSem(1)
    } catch (e) {
      alert(e.response?.data?.detail || "Xatolik")
    } finally {
      setCreating(false)
    }
  }

  const filtered = windows.filter(w => {
    if (filterGroup && w.guruh_id !== +filterGroup) return false
    if (filterSem && w.semestr !== +filterSem) return false
    return true
  })

  const ochiq = windows.filter(w => w.holati === 'ochiq').length
  const yopiq = windows.filter(w => w.holati === 'yopiq').length

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={fetchAll} />

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-slate-800">{windows.length}</div>
          <div className="text-sm text-slate-500">Jami oynalar</div>
        </div>
        <div className="card text-center border-l-4 border-l-green-500">
          <div className="text-2xl font-bold text-green-600">{ochiq}</div>
          <div className="text-sm text-slate-500">Ochiq</div>
        </div>
        <div className="card text-center border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-600">{yopiq}</div>
          <div className="text-sm text-slate-500">Yopiq</div>
        </div>
      </div>

      {/* Filter va yangi oyna */}
      <div className="card py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
          </select>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Barcha semestrlar</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
          </select>
          <button onClick={fetchAll} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Yangilash">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="ml-auto btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Oyna yaratish
          </button>
        </div>

        {/* Yangi oyna formasi */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Guruh</label>
              <select required value={newGuruh} onChange={e => setNewGuruh(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Tanlang...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.nomi}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fan</label>
              <select required value={newFan} onChange={e => setNewFan(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Tanlang...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.nomi}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Semestr</label>
              <select value={newSem} onChange={e => setNewSem(+e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}-semestr</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating}
                className="w-full btn-primary flex items-center justify-center gap-2">
                {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Yaratish
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Jadval */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="Oynalar yo'q"
            description="Hali baholash oynasi yaratilmagan. 'Oyna yaratish' tugmasini bosing."
            icon="🪟"
          />
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Guruh</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fan</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Semestr</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Holati</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">O'zgartirgan</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filtered.map(win => (
                <tr key={win.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-primary-700">{win.guruh}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 max-w-48 truncate" title={win.fan}>{win.fan}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{win.semestr}-semestr</td>
                  <td className="px-5 py-3">
                    <WindowBadge holati={win.holati} />
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {win.o_zgartirgan || '—'}
                    {win.yangilangan_sana && (
                      <div className="text-xs">{new Date(win.yangilangan_sana).toLocaleDateString('uz-UZ')}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggle(win)}
                      disabled={actionId === win.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                        ${win.holati === 'ochiq'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                    >
                      {actionId === win.id
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : win.holati === 'ochiq'
                          ? <><Lock className="w-3.5 h-3.5" /> Yopish</>
                          : <><Unlock className="w-3.5 h-3.5" /> Ochish</>
                      }
                    </button>
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
