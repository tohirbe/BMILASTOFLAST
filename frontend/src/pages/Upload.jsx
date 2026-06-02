// Ma'lumot yuklash sahifasi
import { useState } from 'react'
import { uploadApi } from '../services/api'
import { Upload as UploadIcon, Download, CheckCircle, AlertCircle } from 'lucide-react'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await uploadApi.grades(file)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || "Yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await uploadApi.template()
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'shablon_baholar.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert("Shablonni yuklab bo'lmadi")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Shablon */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Namuna shablon</h3>
          <p className="text-sm text-slate-500 mt-0.5">CSV shablonni yuklab oling va to'ldiring</p>
        </div>
        <button onClick={handleDownloadTemplate} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Shablon yuklab olish
        </button>
      </div>

      {/* Fayl tanlash */}
      <div
        className={`card border-2 border-dashed transition-colors cursor-pointer ${
          dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const dropped = e.dataTransfer.files[0]
          if (dropped) setFile(dropped)
        }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input id="fileInput" type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
        <div className="text-center py-8">
          <UploadIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          {file ? (
            <div>
              <p className="font-semibold text-slate-700">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-slate-600">Faylni bu yerga tashlang</p>
              <p className="text-sm text-slate-400 mt-1">yoki bosing (CSV, XLSX qabul qilinadi)</p>
            </div>
          )}
        </div>
      </div>

      {/* Yuklash tugmasi */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? 'Yuklanmoqda...' : 'Bazaga yuklash'}
      </button>

      {/* Natija */}
      {result && (
        <div className={`card ${result.xato_soni === 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.xato_soni === 0
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <AlertCircle className="w-5 h-5 text-yellow-600" />
            }
            <h3 className="font-semibold text-slate-800">Yuklash natijasi</h3>
          </div>
          <p className="text-sm text-slate-600">
            ✅ Qo'shildi: <strong>{result.qoshildi}</strong> ta baho
          </p>
          {result.xato_soni > 0 && (
            <p className="text-sm text-slate-600">⚠️ Xatolar: <strong>{result.xato_soni}</strong> ta</p>
          )}
          {result.xatolar?.length > 0 && (
            <div className="mt-3 bg-red-50 rounded-lg p-3 space-y-1">
              {result.xatolar.map((x, i) => (
                <p key={i} className="text-xs text-red-600">{x}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Ustunlar haqida */}
      <div className="card bg-slate-50">
        <h4 className="font-medium text-slate-700 mb-2">Kerakli ustunlar:</h4>
        <div className="grid grid-cols-2 gap-2">
          {['student_id', 'subject_id', 'semestr', 'ball', 'davomat_foizi'].map(col => (
            <code key={col} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-mono">
              {col}
            </code>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">ball: 0-100 orasida, davomat_foizi: 0-100 orasida</p>
      </div>
    </div>
  )
}