// Yuklanish va skeleton komponentlar
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${s} border-4 border-primary-600 border-t-transparent rounded-full animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-slate-400 text-sm">Yuklanmoqda...</span>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-2/3" />
    </div>
  )
}

export function EmptyState({ title = "Ma'lumot yo'q", description = "Hozircha ko'rsatadigan narsa yo'q.", icon = "📭" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs">{description}</p>
    </div>
  )
}

export function ErrorState({ message = "Xatolik yuz berdi", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-600 mb-1">Xatolik</h3>
      <p className="text-slate-400 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">Qayta urinish</button>
      )}
    </div>
  )
}