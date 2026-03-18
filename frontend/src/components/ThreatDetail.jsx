import { useState } from 'react'
import { useUpdateStatus } from '../hooks/useThreats'
import client from '../api/client'

const SEV_LABEL = { CRITICAL: 'KRITIS', HIGH: 'TINGGI', MEDIUM: 'SEDANG', LOW: 'RENDAH' }
const SEV_STYLE = {
  CRITICAL: { bg: 'rgba(220,38,38,0.2)', color: '#fca5a5', border: 'rgba(220,38,38,0.3)' },
  HIGH: { bg: 'rgba(217,119,6,0.2)', color: '#fcd34d', border: 'rgba(217,119,6,0.3)' },
  MEDIUM: { bg: 'rgba(14,111,163,0.2)', color: '#7dd3fc', border: 'rgba(14,111,163,0.3)' },
  LOW: { bg: 'rgba(34,197,94,0.15)', color: '#86efac', border: 'rgba(34,197,94,0.25)' },
}
const STATUS_LABEL = { NEW: 'Baru', VERIFIED: 'Terverifikasi', MITIGATED: 'Dimitigasi', FALSE_POSITIVE: 'Positif Palsu' }
const SRC_LABEL = { TELEGRAM: 'Telegram', PASTE: 'Paste Site', GITHUB: 'GitHub', HIBP: 'HIBP' }
const ENTITY_LABEL = {
  CREDIT_CARD: 'Kartu Kredit', NIK: 'NIK', NPWP: 'NPWP',
  CREDENTIAL: 'Kredensial', ACCOUNT_NUMBER: 'No. Rekening',
  CVV: 'CVV', BANK_NAME: 'Nama Bank', BANKING_KEYWORD: 'Keyword',
}
const ENTITY_PLAIN = {
  CREDIT_CARD: 'nomor kartu kredit', NIK: 'Nomor Induk Kependudukan (NIK)',
  NPWP: 'Nomor Pokok Wajib Pajak (NPWP)', CREDENTIAL: 'kredensial akses (username/password)',
  ACCOUNT_NUMBER: 'nomor rekening bank', CVV: 'kode keamanan kartu (CVV/CVC)',
}

const REKOMENDASI = {
  CREDIT_CARD: 'Koordinasi dengan issuer untuk blokir batch kartu terdampak. Notifikasi nasabah via SMS/email.',
  NIK: 'Laporkan ke Dukcapil. Monitor penggunaan NIK di layanan onboarding.',
  CREDENTIAL: 'Force password reset akun terdampak. Aktifkan 2FA wajib.',
  CVV: 'Aktifkan 3D Secure untuk transaksi online. Tingkatkan monitoring transaksi CNP.',
  NPWP: 'Koordinasi dengan DJP. Pantau aktivitas perpajakan mencurigakan.',
  ACCOUNT_NUMBER: 'Tingkatkan monitoring transaksi pada rekening terekspos. Hubungi nasabah.',
}

function maskValue(val, type) {
  if (!val) return '-'
  if (type === 'CREDIT_CARD') {
    const d = val.replace(/[^0-9\u2022*X]/g, '')
    if (d.length >= 8) return `${val.slice(0, 4)} \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${val.slice(-4)}`
  }
  if (type === 'NIK' && val.length >= 10) return `${val.slice(0, 6)} \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 ${val.slice(-2)}`
  if (type === 'CREDENTIAL' && val.includes('@')) {
    const at = val.indexOf('@'), dot = val.lastIndexOf('.')
    if (at > 2 && dot > at) return `${val.slice(0, 3)}\u2022\u2022\u2022@\u2022\u2022\u2022\u2022${val.slice(dot)}`
  }
  if (val.length <= 8) return val
  return val.slice(0, 4) + '\u2022'.repeat(Math.max(val.length - 8, 4)) + val.slice(-4)
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateWib(iso) {
  const d = new Date(iso)
  const wib = new Date(d.getTime() + (7 * 60 + d.getTimezoneOffset()) * 60000)
  const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${String(wib.getDate()).padStart(2, '0')} ${bulan[wib.getMonth() + 1]} ${wib.getFullYear()}, ${String(wib.getHours()).padStart(2, '0')}:${String(wib.getMinutes()).padStart(2, '0')} WIB`
}

function sensitiveTypes(entities) {
  return [...new Set(entities.map(e => e.type).filter(t => !['BANK_NAME', 'BANKING_KEYWORD'].includes(t)))]
}

function entityTypesPlain(entities) {
  return sensitiveTypes(entities).map(t => ENTITY_PLAIN[t] || ENTITY_LABEL[t] || t).join(', ') || 'data keuangan'
}

// ── Draft Notifikasi OJK (SEOJK 29/2022 Bab IX) ──
function generateNotifikasiOJK(t) {
  const entities = t.detected_entities?.entities || []
  const tags = (t.institution_tags || []).join(', ') || '[ISI NAMA BANK]'
  const src = SRC_LABEL[t.source_type] || t.source_type
  const dataPlain = entityTypesPlain(entities)
  const reks = sensitiveTypes(entities).filter(k => REKOMENDASI[k]).slice(0, 3).map((k, i) => `   ${i + 1}. ${REKOMENDASI[k]}`)
  while (reks.length < 3) reks.push(`   ${reks.length + 1}. [ISI LANGKAH MITIGASI]`)

  const entityCounts = {}
  entities.forEach(e => { entityCounts[e.type] = (entityCounts[e.type] || 0) + 1 })
  const table = Object.entries(entityCounts).sort().map(([t, c]) => `   ${(ENTITY_LABEL[t] || t).padEnd(35)} ${String(c).padStart(8)}`).join('\n')

  return [
    '\u2501'.repeat(45),
    'DRAFT NOTIFIKASI AWAL INSIDEN SIBER',
    '[BELUM RESMI \u2014 Perlu ditinjau dan ditandatangani pejabat berwenang',
    ' sebelum disampaikan ke OJK]',
    'Mengacu: SEOJK No. 29/SEOJK.03/2022 Bab IX huruf (a)',
    `Nomor Draft    : DRAFT-SHARK-${(t.id || '').slice(0, 8).toUpperCase()}`,
    'Dibuat oleh    : SHARK-Fin Threat Intelligence Platform',
    `Tanggal draft  : ${formatDateWib(t.created_at)}`,
    '\u2501'.repeat(45),
    '',
    'A. IDENTITAS BANK PELAPOR',
    '   Nama Bank         : [ISI NAMA BANK]',
    '   Kode Bank         : [ISI KODE BANK]',
    '   Nama Penanggung   : [ISI NAMA PEJABAT]',
    '   Jabatan           : [ISI JABATAN]',
    '   Kontak            : [ISI EMAIL/TELEPON]',
    '',
    'B. INFORMASI INSIDEN',
    '   Tanggal/Waktu insiden pertama terdeteksi oleh SHARK-Fin:',
    `     ${formatDateWib(t.created_at)}`,
    '',
    `   Sumber deteksi    : ${src}`,
    `   URL sumber        : ${t.source_url || '-'}`,
    `   Risk score        : ${t.risk_score}/100 (${SEV_LABEL[t.severity] || t.severity})`,
    '',
    '   Deskripsi singkat insiden:',
    `   Ditemukan indikasi kebocoran data ${dataPlain}`,
    `   nasabah ${tags} sebanyak estimasi ${entities.length} entitas`,
    `   yang dipublikasikan di ${src}.`,
    `   Data yang terekspos meliputi ${dataPlain}.`,
    '',
    'C. ESTIMASI DAMPAK AWAL',
    `   Jenis data terekspos  : ${dataPlain}`,
    `   ${'Tipe Data'.padEnd(35)} ${'Jumlah'.padStart(8)}`,
    `   ${'-'.repeat(45)}`,
    table,
    `   ${'-'.repeat(45)}`,
    `   ${'TOTAL'.padEnd(35)} ${String(entities.length).padStart(8)}`,
    `   Lembaga terdampak     : ${tags}`,
    '',
    '   CATATAN: Estimasi ini bersumber dari deteksi otomatis SHARK-Fin',
    '   dan PERLU DIVERIFIKASI oleh tim keamanan internal sebelum',
    '   dicantumkan dalam laporan resmi.',
    '',
    'D. LANGKAH MITIGASI AWAL',
    '   [Isi sesuai tindakan yang telah diambil oleh bank]',
    '',
    '   Rekomendasi SHARK-Fin berdasarkan tipe data:',
    ...reks,
    '',
    'E. STATUS PELAPORAN',
    `   Status saat ini   : ${STATUS_LABEL[t.status] || t.status}`,
    '   Diverifikasi oleh : [ISI NAMA ANALIS]',
    '   Tanggal verifikasi: [ISI TANGGAL]',
    '',
    '\u2501'.repeat(45),
    'DOKUMEN BERIKUTNYA YANG DIPERLUKAN:',
    'Laporan Insiden Siber lengkap (SEOJK 29/2022 Bab IX huruf b)',
    'wajib disampaikan melalui sistem pelaporan OJK dalam 5 hari kerja.',
    '\u2501'.repeat(45),
  ].join('\n')
}

// ── Laporan Intelijen Internal ──
function generateIntelReport(t) {
  const entities = t.detected_entities?.entities || []
  const tags = (t.institution_tags || []).join(', ') || '-'
  const entityLines = entities.map((e, i) =>
    `   ${i + 1}. [${ENTITY_LABEL[e.type] || e.type}] ${e.value} (confidence: ${(e.confidence * 100).toFixed(0)}%)`
  )
  const counts = {}
  entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1 })
  const reks = []
  const seen = new Set()
  entities.forEach(e => {
    if (REKOMENDASI[e.type] && !seen.has(e.type)) { seen.add(e.type); reks.push(REKOMENDASI[e.type]) }
  })

  return [
    'LAPORAN INTELIJEN INTERNAL \u2014 SHARK-Fin',
    '='.repeat(42),
    `Nomor          : INTEL-SHARK-${(t.id || '').slice(0, 8).toUpperCase()}`,
    `Tanggal        : ${formatDateWib(t.created_at)}`,
    `Tingkat        : ${SEV_LABEL[t.severity] || t.severity}`,
    `Status         : ${STATUS_LABEL[t.status] || t.status}`,
    `Skor Risiko    : ${t.risk_score}/100`,
    `Sumber         : ${SRC_LABEL[t.source_type] || t.source_type}`,
    `URL            : ${t.source_url || '-'}`,
    `Lembaga Terkait: ${tags}`,
    '',
    `ENTITAS TERDETEKSI (${entities.length})`,
    '-'.repeat(36),
    ...entityLines,
    '',
    'DISTRIBUSI TIPE',
    '-'.repeat(15),
    ...Object.entries(counts).sort().map(([t, c]) => `   ${ENTITY_LABEL[t] || t}: ${c}`),
    '',
    'REKOMENDASI TEKNIS',
    '-'.repeat(18),
    ...reks.slice(0, 6).map((r, i) => `   ${i + 1}. ${r}`),
    '',
    'CUPLIKAN KONTEN',
    '-'.repeat(15),
    (t.raw_content || t.raw_text_preview || '-').slice(0, 500),
    '',
    '='.repeat(42),
    'Dokumen internal SHARK-Fin. Tidak untuk distribusi eksternal.',
  ].join('\n')
}

function buildRiskFactors(t) {
  const factors = []
  const entities = t.detected_entities?.entities || []
  const types = sensitiveTypes(entities)
  if (entities.length > 5) factors.push({ label: `Volume tinggi: ${entities.length} entitas`, color: 'rgba(217,119,6,0.3)', text: '#fcd34d' })
  if (t.risk_score >= 80) factors.push({ label: 'Sumber: carding forum', color: 'rgba(220,38,38,0.3)', text: '#fca5a5' })
  const age = (Date.now() - new Date(t.created_at).getTime()) / 3600000
  if (age < 6) factors.push({ label: `Data segar: <${Math.ceil(age)} jam`, color: 'rgba(34,211,238,0.2)', text: '#22d3ee' })
  if (types.length >= 3) factors.push({ label: `Multi-entitas: ${types.join('+')}`, color: 'rgba(124,58,237,0.2)', text: '#a78bfa' })
  if (!factors.length) factors.push({ label: 'Analisis standar', color: 'rgba(100,180,255,0.1)', text: '#4a7d9a' })
  return factors
}

export default function ThreatDetail({ threat: t, onClose }) {
  const [status, setStatus] = useState(t.status)
  const [exportingOjk, setExportingOjk] = useState(false)
  const [exportingIntel, setExportingIntel] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const mutation = useUpdateStatus()
  const entities = t.detected_entities?.entities || []
  const sev = SEV_STYLE[t.severity] || SEV_STYLE.LOW
  const isDemo = t._isDemo
  const rawPreview = t.raw_content || t.raw_text_preview || ''
  const factors = buildRiskFactors(t)
  const entityTypes = sensitiveTypes(entities).filter(k => REKOMENDASI[k])

  function handleStatusChange(v) {
    setStatus(v)
    if (!isDemo) mutation.mutate({ id: t.id, status: v })
  }

  async function handleExportOjk() {
    setExportingOjk(true)
    try {
      if (isDemo) {
        downloadTxt(generateNotifikasiOJK(t), `DRAFT-NOTIFIKASI-OJK-${(t.id || '').slice(0, 8)}`)
      } else {
        const resp = await client.get(`/threats/${t.id}/report?format=ojk`)
        downloadTxt(resp.data, `DRAFT-NOTIFIKASI-OJK-${(t.id || '').slice(0, 8)}`)
      }
    } catch { /* ignore */ }
    setExportingOjk(false)
  }

  async function handleExportIntel() {
    setExportingIntel(true)
    try {
      if (isDemo) {
        downloadTxt(generateIntelReport(t), `INTEL-SHARKFIN-${(t.id || '').slice(0, 8)}`)
      } else {
        const resp = await client.get(`/threats/${t.id}/report?format=intel`)
        downloadTxt(resp.data, `INTEL-SHARKFIN-${(t.id || '').slice(0, 8)}`)
      }
    } catch { /* ignore */ }
    setExportingIntel(false)
  }

  function downloadTxt(text, prefix) {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix}-${d}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(2,8,20,0.75)' }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full max-w-[480px] z-50 overflow-y-auto"
        style={{ backgroundColor: '#060f1c', borderLeft: '1px solid rgba(100,180,255,0.2)' }}>

        {/* Header */}
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10"
          style={{ backgroundColor: '#040c17', borderBottom: '1px solid rgba(100,180,255,0.12)' }}>
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <path d="M18 4 L30 28 Q24 26 18 28 Q12 26 6 28 Z" fill="#22d3ee" opacity="0.7" />
            </svg>
            <span className="px-2 py-0.5 rounded-md uppercase font-medium"
              style={{ fontSize: '9px', letterSpacing: '0.06em', backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
              {SEV_LABEL[t.severity]}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ border: '2px solid #22d3ee', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <span className="text-[11px] font-medium" style={{ color: '#22d3ee' }}>{t.risk_score}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition-colors" style={{ color: '#4a7d9a' }}
            onMouseEnter={e => (e.target.style.color = '#e8f4ff')} onMouseLeave={e => (e.target.style.color = '#4a7d9a')}>&times;</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Title */}
          <section>
            <h2 className="text-base font-medium mb-1" style={{ color: '#e8f4ff' }}>
              {entities.length > 0 ? `${ENTITY_LABEL[entities[0].type] || entities[0].type} via ${SRC_LABEL[t.source_type] || t.source_type}` : 'Detail Ancaman'}
              {t.institution_tags?.length ? ` \u2014 ${t.institution_tags.join(', ')}` : ''}
            </h2>
            {t.source_url && <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="text-xs truncate block" style={{ color: '#4a9fd4' }}>{t.source_url}</a>}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs" style={{ color: '#4a7d9a' }}>{formatDate(t.created_at)}</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ backgroundColor: 'rgba(100,180,255,0.08)', color: '#7ab8d9', border: '1px solid rgba(100,180,255,0.15)' }}>
                {STATUS_LABEL[status] || status}
              </span>
            </div>
          </section>

          {/* Metadata */}
          <section className="space-y-2">
            <Row label="ID" value={t.id} mono />
            <Row label="Sumber" value={SRC_LABEL[t.source_type] || t.source_type} />
            <Row label="Skor Risiko" value={`${t.risk_score} / 100`} accent />
            <Row label="Lembaga" value={(t.institution_tags || []).join(', ') || '-'} />
          </section>

          {/* Entities table */}
          <section>
            <SectionLabel>Entitas Terdeteksi ({entities.length})</SectionLabel>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(100,180,255,0.12)' }}>
              <table className="w-full text-xs">
                <thead><tr style={{ backgroundColor: 'rgba(100,180,255,0.05)' }}>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: '#4a7d9a' }}>Tipe</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: '#4a7d9a' }}>Nilai</th>
                  <th className="text-right px-3 py-2 font-medium" style={{ color: '#4a7d9a' }}>Confidence</th>
                </tr></thead>
                <tbody>
                  {entities.map((e, i) => {
                    const conf = e.confidence || 0
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(100,180,255,0.03)', borderTop: '1px solid rgba(100,180,255,0.06)' }}>
                        <td className="px-3 py-2" style={{ color: '#7ab8d9' }}>{ENTITY_LABEL[e.type] || e.type}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: '#22d3ee', fontSize: '11px' }}>{maskValue(e.value, e.type)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(100,180,255,0.15)' }}>
                              <div className="h-full rounded-full" style={{ width: `${conf * 100}%`, backgroundColor: '#22d3ee' }} />
                            </div>
                            <span style={{ color: '#7ab8d9' }}>{(conf * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!entities.length && <tr><td colSpan={3} className="px-3 py-4 text-center" style={{ color: '#2a5570' }}>Tidak ada entitas.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Raw preview */}
          {rawPreview && (
            <section>
              <SectionLabel>Cuplikan Konten Asli</SectionLabel>
              <div className="rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-hidden"
                style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.08)', color: '#4a7d9a', maxHeight: '4.5em', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                {rawPreview}
              </div>
            </section>
          )}

          {/* Risk factors */}
          <section>
            <SectionLabel>Faktor Risiko</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {factors.map(f => (
                <span key={f.label} className="text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: f.color, color: f.text, border: `1px solid ${f.color}` }}>{f.label}</span>
              ))}
            </div>
          </section>

          {/* Rekomendasi */}
          {entityTypes.length > 0 && (
            <section>
              <SectionLabel>Rekomendasi</SectionLabel>
              <ol className="space-y-2 list-decimal list-inside text-xs leading-relaxed" style={{ color: '#7ab8d9' }}>
                {entityTypes.slice(0, 4).map((k, i) => <li key={i}>{REKOMENDASI[k]}</li>)}
              </ol>
            </section>
          )}

          {/* Status */}
          <section>
            <SectionLabel>Status</SectionLabel>
            <select value={status} onChange={e => handleStatusChange(e.target.value)} disabled={mutation.isPending}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.2)', color: '#7ab8d9', outline: 'none' }}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#040c17' }}>{v}</option>)}
            </select>
            {mutation.isPending && <p className="text-xs mt-1" style={{ color: '#2a5570' }}>Menyimpan...</p>}
          </section>

          {/* Export buttons */}
          <section className="space-y-3">
            {/* OJK notifikasi */}
            <div className="relative">
              <button onClick={handleExportOjk} disabled={exportingOjk}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{ border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', backgroundColor: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.08)'; setShowTooltip(true) }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; setShowTooltip(false) }}>
                {exportingOjk ? (
                  <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Mengunduh...</>
                ) : 'Siapkan Draft Notifikasi OJK'}
              </button>
              {showTooltip && (
                <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 rounded-lg text-[10px] leading-relaxed"
                  style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.2)', color: '#7ab8d9' }}>
                  Draft notifikasi awal mengacu elemen wajib SEOJK 29/SEOJK.03/2022 Bab IX.
                  Wajib disampaikan ke OJK dalam 24 jam setelah insiden dikonfirmasi.
                </div>
              )}
            </div>

            {/* Internal intel report */}
            <button onClick={handleExportIntel} disabled={exportingIntel}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(100,180,255,0.15)', color: '#7ab8d9', backgroundColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(100,180,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {exportingIntel ? (
                <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Mengunduh...</>
              ) : 'Laporan Intelijen Lengkap'}
            </button>
          </section>
        </div>
      </aside>
    </>
  )
}

function SectionLabel({ children }) {
  return <h3 className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#4a7d9a', letterSpacing: '0.06em' }}>{children}</h3>
}

function Row({ label, value, mono = false, accent = false }) {
  return (
    <div className="flex text-sm">
      <dt className="w-28 shrink-0" style={{ color: '#4a7d9a' }}>{label}</dt>
      <dd className={`min-w-0 truncate ${mono ? 'font-mono text-xs mt-0.5' : ''}`} style={{ color: accent ? '#22d3ee' : '#e8f4ff' }}>{value}</dd>
    </div>
  )
}
