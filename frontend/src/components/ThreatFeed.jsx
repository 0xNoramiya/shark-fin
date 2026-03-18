import { useState } from 'react'
import { useThreats } from '../hooks/useThreats'

const SEV_LABEL = { CRITICAL: 'KRITIS', HIGH: 'TINGGI', MEDIUM: 'SEDANG', LOW: 'RENDAH' }
const SEV_STYLE = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-amber-600 text-white',
  MEDIUM: 'bg-purple-600 text-white',
  LOW: 'bg-gray-600 text-gray-200',
}
const SRC_LABEL = { TELEGRAM: 'Telegram', PASTE: 'Paste', GITHUB: 'GitHub', HIBP: 'HIBP' }
const STATUS_LABEL = {
  NEW: 'Baru', VERIFIED: 'Terverifikasi', MITIGATED: 'Dimitigasi', FALSE_POSITIVE: 'Positif Palsu',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return `${d} hari lalu`
}

function buildTitle(t) {
  const entities = t.detected_entities?.entities || []
  const types = [...new Set(entities.map(e => e.type))]
  const dominant = types[0] || 'DATA'
  const typeLabels = {
    CREDIT_CARD: 'Kartu Kredit',
    NIK: 'NIK',
    NPWP: 'NPWP',
    CREDENTIAL: 'Kredensial',
    ACCOUNT_NUMBER: 'Nomor Rekening',
    CVV: 'CVV',
    BANK_NAME: 'Bank',
    BANKING_KEYWORD: 'Keyword',
  }
  const srcLabel = SRC_LABEL[t.source_type] || t.source_type
  const instLabel = t.institution_tags?.length ? ` - ${t.institution_tags.join(', ')}` : ''
  return `${typeLabels[dominant] || dominant} via ${srcLabel}${instLabel}`
}

function truncateUrl(url, max = 50) {
  if (!url) return '-'
  return url.length > max ? url.slice(0, max) + '...' : url
}

export default function ThreatFeed({ onSelect }) {
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const { data, isLoading } = useThreats(filters)

  const threats = (data?.items || []).filter(t => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (t.raw_content || '').toLowerCase().includes(s) ||
      (t.institution_tags || []).some(tag => tag.toLowerCase().includes(s)) ||
      (t.source_url || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden flex flex-col">
      {/* Filter bar */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">
            Feed Ancaman
          </h2>
          <span className="text-xs text-gray-600">{data?.total || 0} total</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600 w-40"
          />
          <FilterSelect
            value={filters.severity || ''}
            onChange={v => setFilters(f => ({ ...f, severity: v || undefined }))}
            options={[
              ['', 'Semua Severity'],
              ['CRITICAL', 'Kritis'],
              ['HIGH', 'Tinggi'],
              ['MEDIUM', 'Sedang'],
              ['LOW', 'Rendah'],
            ]}
          />
          <FilterSelect
            value={filters.source_type || ''}
            onChange={v => setFilters(f => ({ ...f, source_type: v || undefined }))}
            options={[
              ['', 'Semua Sumber'],
              ['TELEGRAM', 'Telegram'],
              ['PASTE', 'Paste'],
              ['GITHUB', 'GitHub'],
              ['HIBP', 'HIBP'],
            ]}
          />
          <FilterSelect
            value={filters.status || ''}
            onChange={v => setFilters(f => ({ ...f, status: v || undefined }))}
            options={[
              ['', 'Semua Status'],
              ['NEW', 'Baru'],
              ['VERIFIED', 'Terverifikasi'],
              ['MITIGATED', 'Dimitigasi'],
              ['FALSE_POSITIVE', 'Positif Palsu'],
            ]}
          />
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-gray-800/60 overflow-y-auto max-h-[600px]">
        {isLoading && (
          <li className="p-6 text-center text-gray-600 text-sm">Memuat...</li>
        )}
        {!isLoading && threats.length === 0 && (
          <li className="p-6 text-center text-gray-600 text-sm">
            Tidak ada ancaman ditemukan.
          </li>
        )}
        {threats.map(t => {
          const entityList = t.detected_entities?.entities || []
          const entityTypes = [...new Set(entityList.map(e => e.type))]
          return (
            <li
              key={t.id}
              onClick={() => onSelect(t)}
              className="px-4 py-3 hover:bg-gray-800/60 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Severity badge */}
                <span
                  className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${SEV_STYLE[t.severity]}`}
                >
                  {SEV_LABEL[t.severity]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {buildTitle(t)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {truncateUrl(t.source_url)} &middot; {entityList.length} entitas &middot; {timeAgo(t.created_at)}
                  </p>
                  {/* Entity tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entityTypes.map(et => (
                      <span
                        key={et}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400"
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="text-xs text-gray-500">Skor</span>
                  <p className="text-sm font-bold text-gray-300">{t.risk_score}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-gray-600"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  )
}
