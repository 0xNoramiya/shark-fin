import { useStats } from '../hooks/useStats'

export default function StatCards() {
  const { data: stats, isLoading } = useStats()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 p-5 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const activeThreats =
    (stats.by_status?.NEW || 0) + (stats.by_status?.VERIFIED || 0)
  const mitigated = stats.by_status?.MITIGATED || 0
  const exposed = stats.total_records_exposed_estimate || 0
  const institutions = stats.institutions_mentioned?.length || 0

  const cards = [
    {
      label: 'Ancaman Aktif',
      value: activeThreats,
      accent: activeThreats > 10 ? 'text-red-400' : 'text-amber-400',
      border: activeThreats > 10 ? 'border-red-900/60' : 'border-amber-900/40',
      bg: activeThreats > 10 ? 'bg-red-950/30' : 'bg-amber-950/20',
    },
    {
      label: 'Estimasi Record Bocor',
      value: exposed.toLocaleString('id-ID'),
      accent: 'text-orange-400',
      border: 'border-orange-900/40',
      bg: 'bg-orange-950/20',
    },
    {
      label: 'Lembaga Terekspos',
      value: institutions,
      accent: 'text-purple-400',
      border: 'border-purple-900/40',
      bg: 'bg-purple-950/20',
    },
    {
      label: 'Sudah Dimitigasi',
      value: mitigated,
      accent: 'text-emerald-400',
      border: 'border-emerald-900/40',
      bg: 'bg-emerald-950/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className={`rounded-xl border ${c.border} ${c.bg} p-5`}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider">{c.label}</p>
          <p className={`text-3xl font-bold mt-1 ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}
