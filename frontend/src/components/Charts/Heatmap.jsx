// Custom Heatmap komponenti (Recharts'da to'g'ridan-to'g'ri yo'q)
// Div + Tailwind bilan rang intensivligi asosida rangli grid

function getColor(value, min, max) {
  if (!value || max === min) return '#f1f5f9'
  const ratio = (value - min) / (max - min)
  if (ratio > 0.8) return '#1d4ed8'
  if (ratio > 0.6) return '#3b82f6'
  if (ratio > 0.4) return '#60a5fa'
  if (ratio > 0.2) return '#93c5fd'
  return '#dbeafe'
}

export default function Heatmap({ guruhlar = [], fanlar = [], matrix = [] }) {
  if (!guruhlar.length || !fanlar.length) {
    return <div className="text-center text-slate-400 py-8">Ma'lumot yo'q</div>
  }

  const allValues = matrix.flat().filter(v => v > 0)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-medium text-slate-500 pb-2 pr-3 whitespace-nowrap">Guruh</th>
            {fanlar.map((fan, i) => (
              <th key={i} className="font-medium text-slate-500 pb-2 px-1 text-center max-w-16 whitespace-nowrap overflow-hidden" style={{ maxWidth: 72 }}>
                <div className="truncate" style={{ maxWidth: 68 }} title={fan}>
                  {fan.split(' ')[0]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guruhlar.map((guruh, gi) => (
            <tr key={gi}>
              <td className="font-medium text-slate-700 pr-3 py-1 whitespace-nowrap">{guruh}</td>
              {fanlar.map((fan, fi) => {
                const val = matrix[gi]?.[fi] || 0
                const color = getColor(val, min, max)
                const textColor = val > (min + max) / 2 + 10 ? '#fff' : '#334155'
                return (
                  <td key={fi} className="px-1 py-1">
                    <div
                      className="rounded text-center font-semibold py-1 px-1 cursor-default transition-transform hover:scale-110"
                      style={{ backgroundColor: color, color: textColor, minWidth: 44 }}
                      title={`${guruh} × ${fan}: ${val}`}
                    >
                      {val > 0 ? val.toFixed(0) : '-'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Rang shkalasi */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
        <span>Past</span>
        {['#dbeafe','#93c5fd','#60a5fa','#3b82f6','#1d4ed8'].map((c, i) => (
          <div key={i} className="w-8 h-3 rounded" style={{ backgroundColor: c }} />
        ))}
        <span>Yuqori</span>
      </div>
    </div>
  )
}