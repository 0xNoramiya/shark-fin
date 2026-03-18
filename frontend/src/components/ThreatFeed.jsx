import { useState, useContext } from 'react'
import { useThreats } from '../hooks/useThreats'
import { DemoContext } from '../pages/Dashboard'

const SEV_LABEL = { CRITICAL: 'KRITIS', HIGH: 'TINGGI', MEDIUM: 'SEDANG', LOW: 'RENDAH' }
const SEV_STYLE = {
  CRITICAL: { bg: 'rgba(220,38,38,0.2)', color: '#fca5a5', border: 'rgba(220,38,38,0.3)', left: 'rgba(220,38,38,0.6)', score: '#ef4444' },
  HIGH: { bg: 'rgba(217,119,6,0.2)', color: '#fcd34d', border: 'rgba(217,119,6,0.3)', left: 'rgba(217,119,6,0.5)', score: '#d97706' },
  MEDIUM: { bg: 'rgba(14,111,163,0.2)', color: '#7dd3fc', border: 'rgba(14,111,163,0.3)', left: 'rgba(14,111,163,0.5)', score: '#0e6fa3' },
  LOW: { bg: 'rgba(34,197,94,0.15)', color: '#86efac', border: 'rgba(34,197,94,0.25)', left: 'rgba(34,197,94,0.3)', score: '#22c55e' },
}
const SRC_LABEL = { TELEGRAM: 'Telegram', PASTE: 'Paste', GITHUB: 'GitHub', HIBP: 'HIBP' }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

function buildTitle(t) {
  const entities = t.detected_entities?.entities || []
  const types = [...new Set(entities.map(e => e.type))]
  const dominant = types[0] || 'DATA'
  const labels = { CREDIT_CARD: 'Kartu Kredit', NIK: 'NIK', NPWP: 'NPWP', CREDENTIAL: 'Kredensial', ACCOUNT_NUMBER: 'No. Rekening', CVV: 'CVV', BANK_NAME: 'Bank', BANKING_KEYWORD: 'Keyword' }
  const src = SRC_LABEL[t.source_type] || t.source_type
  const inst = t.institution_tags?.length ? ` \u2014 ${t.institution_tags.join(', ')}` : ''
  return `${labels[dominant] || dominant} via ${src}${inst}`
}

function truncateUrl(url, max = 40) {
  if (!url) return '-'
  return url.length > max ? url.slice(0, max) + '...' : url
}

export default function ThreatFeed({ onSelect }) {
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const { data, isLoading } = useThreats(filters)
  const { demoThreat } = useContext(DemoContext)

  let threats = (data?.items || []).filter(t => {
    if (!search) return true
    const s = search.toLowerCase()
    return (t.raw_content || '').toLowerCase().includes(s) ||
      (t.institution_tags || []).some(tag => tag.toLowerCase().includes(s)) ||
      (t.source_url || '').toLowerCase().includes(s)
  })

  // Prepend demo threat
  if (demoThreat) threats = [demoThreat, ...threats]

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: '#060f1c', border: '1px solid rgba(100,180,255,0.12)' }}>
      {/* Header */}
      <div className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(100,180,255,0.08)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-medium text-xs uppercase tracking-widest" style={{ color: '#4a7d9a', letterSpacing: '0.08em' }}>Feed Ancaman</h2>
            <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#ef4444' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#ef4444' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: '#ef4444' }} />
              </span>
              LIVE
            </span>
          </div>
          <span className="text-[10px]" style={{ color: '#2a5570' }}>
            {data?.total || 0} total · Diperbarui setiap 30 detik
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm w-36"
            style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.2)', color: '#7ab8d9', outline: 'none' }}
          />
          {[
            { key: 'severity', opts: [['', 'Semua Severity'], ['CRITICAL', 'Kritis'], ['HIGH', 'Tinggi'], ['MEDIUM', 'Sedang'], ['LOW', 'Rendah']] },
            { key: 'source_type', opts: [['', 'Semua Sumber'], ['TELEGRAM', 'Telegram'], ['PASTE', 'Paste'], ['GITHUB', 'GitHub'], ['HIBP', 'HIBP']] },
            { key: 'status', opts: [['', 'Semua Status'], ['NEW', 'Baru'], ['VERIFIED', 'Terverifikasi'], ['MITIGATED', 'Dimitigasi'], ['FALSE_POSITIVE', 'Positif Palsu']] },
          ].map(f => (
            <select key={f.key} value={filters[f.key] || ''}
              onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value || undefined }))}
              className="px-2 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.2)', color: '#7ab8d9', outline: 'none' }}
            >
              {f.opts.map(([v, l]) => <option key={v} value={v} style={{ backgroundColor: '#040c17' }}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* List */}
      <ul className="overflow-y-auto max-h-[640px]">
        {isLoading && <li className="p-6 text-center text-sm" style={{ color: '#2a5570' }}>Memuat...</li>}
        {!isLoading && threats.length === 0 && <li className="p-6 text-center text-sm" style={{ color: '#2a5570' }}>Tidak ada ancaman ditemukan.</li>}
        {threats.map((t, idx) => {
          const entityList = t.detected_entities?.entities || []
          const entityTypes = [...new Set(entityList.map(e => e.type))]
          const sev = SEV_STYLE[t.severity] || SEV_STYLE.LOW
          const isDemo = t._isDemo
          const isHovered = hoveredId === t.id
          return (
            <li key={t.id}
              onClick={() => onSelect(t)}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`px-4 py-3 cursor-pointer transition-colors ${isDemo ? 'threat-enter threat-pulse-red' : ''}`}
              style={{
                borderBottom: idx < threats.length - 1 ? '1px solid rgba(100,180,255,0.06)' : 'none',
                borderLeft: `3px solid ${sev.left}`,
                backgroundColor: isHovered ? 'rgba(100,180,255,0.04)' : 'transparent',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 px-2 py-0.5 rounded-md uppercase font-medium"
                  style={{ fontSize: '9px', letterSpacing: '0.06em', backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                  {SEV_LABEL[t.severity]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: '#e8f4ff' }}>{buildTitle(t)}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#2a5570' }}>
                    {truncateUrl(t.source_url)} &middot; {entityList.length} entitas &middot; {timeAgo(t.created_at)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {entityTypes.map(et => (
                      <span key={et} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(14,111,163,0.15)', color: '#4a9fd4', border: '1px solid rgba(14,111,163,0.3)' }}>
                        {et}
                      </span>
                    ))}
                    {isHovered && (
                      <span className="text-[10px] ml-1" style={{ color: '#22d3ee' }}>&rarr; lihat</span>
                    )}
                  </div>
                </div>
                {/* Score circle */}
                <div className="shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ border: `2px solid ${sev.score}`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <span className="text-xs font-medium" style={{ color: sev.score }}>{t.risk_score}</span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
