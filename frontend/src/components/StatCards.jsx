import { useContext } from 'react'
import { useStats } from '../hooks/useStats'
import { DemoContext } from '../pages/Dashboard'

const S = {
  card: '#060f1c',
  border: 'rgba(100,180,255,0.12)',
  accent: '#22d3ee',
  muted: '#4a7d9a',
  text: '#e8f4ff',
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2 L17 5 V10 C17 14.4 13.8 17.5 10 18.5 C6.2 17.5 3 14.4 3 10 V5 Z" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
      <path d="M10 7 V11 M10 13 V13.5" stroke="#4a7d9a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
      <path d="M3 5 V15 C3 16.4 6.1 17.5 10 17.5 C13.9 17.5 17 16.4 17 15 V5" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
      <path d="M3 10 C3 11.4 6.1 12.5 10 12.5 C13.9 12.5 17 11.4 17 10" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="3" width="12" height="15" rx="1" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
      <rect x="7" y="6" width="2" height="2" rx="0.5" fill="#4a7d9a" opacity="0.5" />
      <rect x="11" y="6" width="2" height="2" rx="0.5" fill="#4a7d9a" opacity="0.5" />
      <rect x="7" y="10" width="2" height="2" rx="0.5" fill="#4a7d9a" opacity="0.5" />
      <rect x="11" y="10" width="2" height="2" rx="0.5" fill="#4a7d9a" opacity="0.5" />
      <rect x="8.5" y="14" width="3" height="4" rx="0.5" fill="#4a7d9a" opacity="0.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="#4a7d9a" strokeWidth="1.2" fill="none" />
      <path d="M7 10 L9.5 12.5 L13 7.5" stroke="#4a7d9a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function formatExposed(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`
  if (n >= 1000) return `${Math.round(n / 1000)}rb`
  return String(n)
}

export default function StatCards() {
  const { data: stats, isLoading } = useStats()
  const { statBoost } = useContext(DemoContext)

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 h-[104px] animate-pulse"
            style={{ backgroundColor: 'rgba(100,180,255,0.05)', border: `1px solid ${S.border}` }}
          />
        ))}
      </div>
    )
  }

  const baseActive = (stats.by_status?.NEW || 0) + (stats.by_status?.VERIFIED || 0)
  const baseExposed = stats.total_records_exposed_estimate || 0
  const active = baseActive + (statBoost?.active || 0)
  const exposed = baseExposed + (statBoost?.exposed || 0)
  const mitigated = stats.by_status?.MITIGATED || 0
  const institutions = stats.institutions_mentioned?.length || 0

  const cards = [
    {
      label: 'Ancaman Aktif',
      value: active,
      trend: '\u2191 +3 dalam 24 jam terakhir',
      icon: <ShieldIcon />,
      leftBorder: active > 10 ? '3px solid rgba(220,38,38,0.6)' : undefined,
      flash: statBoost?.active,
    },
    {
      label: 'Estimasi Record Bocor',
      value: formatExposed(exposed),
      trend: 'dari 18 sumber aktif',
      icon: <DatabaseIcon />,
      flash: statBoost?.exposed,
    },
    {
      label: 'Lembaga Terekspos',
      value: institutions,
      trend: 'bank, fintech, e-wallet',
      icon: <BuildingIcon />,
    },
    {
      label: 'Sudah Dimitigasi',
      value: mitigated,
      trend: '\u2193 3 insiden diselesaikan',
      icon: <CheckIcon />,
      leftBorder: '3px solid rgba(34,197,94,0.4)',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className="rounded-xl p-4"
          style={{
            backgroundColor: S.card,
            border: `1px solid ${S.border}`,
            borderLeft: c.leftBorder || `1px solid ${S.border}`,
          }}
        >
          <div className="flex items-start justify-between">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: S.muted, letterSpacing: '0.08em' }}>
              {c.label}
            </p>
            {c.icon}
          </div>
          <p
            className={`text-2xl font-medium mt-2 ${c.flash ? 'flash-value' : ''}`}
            style={{ color: S.accent }}
          >
            {c.value}
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#2a5570' }}>
            {c.trend}
          </p>
        </div>
      ))}
    </div>
  )
}
