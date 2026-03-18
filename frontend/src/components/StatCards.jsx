import { useContext } from 'react'
import { useStats } from '../hooks/useStats'
import { DemoContext } from '../pages/Dashboard'

function Icon({ children }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--text-muted)' }}>{children}</svg>
}
function ShieldIcon() { return <Icon><path d="M10 2 L17 5 V10 C17 14.4 13.8 17.5 10 18.5 C6.2 17.5 3 14.4 3 10 V5 Z" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M10 7 V11 M10 13 V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></Icon> }
function DatabaseIcon() { return <Icon><ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M3 5 V15 C3 16.4 6.1 17.5 10 17.5 C13.9 17.5 17 16.4 17 15 V5" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M3 10 C3 11.4 6.1 12.5 10 12.5 C13.9 12.5 17 11.4 17 10" stroke="currentColor" strokeWidth="1.2" fill="none" /></Icon> }
function BuildingIcon() { return <Icon><rect x="4" y="3" width="12" height="15" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" /><rect x="7" y="6" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" /><rect x="11" y="6" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" /><rect x="7" y="10" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" /><rect x="11" y="10" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" /><rect x="8.5" y="14" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.5" /></Icon> }
function CheckIcon() { return <Icon><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" /><path d="M7 10 L9.5 12.5 L13 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Icon> }

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
          <div key={i} className="rounded-xl p-5 h-[104px] animate-pulse"
            style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--border-card)' }} />
        ))}
      </div>
    )
  }

  const active = (stats.by_status?.NEW || 0) + (stats.by_status?.VERIFIED || 0) + (statBoost?.active || 0)
  const exposed = (stats.total_records_exposed_estimate || 0) + (statBoost?.exposed || 0)
  const mitigated = stats.by_status?.MITIGATED || 0
  const institutions = stats.institutions_mentioned?.length || 0

  const cards = [
    { label: 'Ancaman Aktif', value: active, trend: '\u2191 +3 dalam 24 jam terakhir', icon: <ShieldIcon />,
      leftBorder: active > 10 ? '3px solid var(--sev-kritis-bar)' : undefined, flash: statBoost?.active },
    { label: 'Estimasi Record Bocor', value: formatExposed(exposed), trend: 'dari 18 sumber aktif', icon: <DatabaseIcon />, flash: statBoost?.exposed },
    { label: 'Lembaga Terekspos', value: institutions, trend: 'bank, fintech, e-wallet', icon: <BuildingIcon /> },
    { label: 'Sudah Dimitigasi', value: mitigated, trend: '\u2193 3 insiden diselesaikan', icon: <CheckIcon />,
      leftBorder: '3px solid var(--sev-rendah-bar)' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(c => (
        <div key={c.label} className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderLeft: c.leftBorder || '1px solid var(--border-card)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{c.label}</p>
            {c.icon}
          </div>
          <p className={`text-2xl font-medium mt-2 ${c.flash ? 'flash-value' : ''}`} style={{ color: 'var(--accent)' }}>{c.value}</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>{c.trend}</p>
        </div>
      ))}
    </div>
  )
}
