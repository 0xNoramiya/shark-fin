import { useState } from 'react'
import { useUpdateStatus } from '../hooks/useThreats'

const SEV_LABEL = { CRITICAL: 'KRITIS', HIGH: 'TINGGI', MEDIUM: 'SEDANG', LOW: 'RENDAH' }
const SEV_STYLE = {
  CRITICAL: 'bg-red-600', HIGH: 'bg-amber-600', MEDIUM: 'bg-purple-600', LOW: 'bg-gray-600',
}
const STATUS_LABEL = {
  NEW: 'Baru', VERIFIED: 'Terverifikasi', MITIGATED: 'Dimitigasi', FALSE_POSITIVE: 'Positif Palsu',
}
const SRC_LABEL = { TELEGRAM: 'Telegram', PASTE: 'Paste Site', GITHUB: 'GitHub', HIBP: 'HIBP' }
const ENTITY_LABEL = {
  CREDIT_CARD: 'Kartu Kredit', NIK: 'NIK', NPWP: 'NPWP',
  CREDENTIAL: 'Kredensial', ACCOUNT_NUMBER: 'No. Rekening',
  CVV: 'CVV', BANK_NAME: 'Nama Bank', BANKING_KEYWORD: 'Keyword',
}

function maskValue(val) {
  if (!val || val.length <= 8) return val
  return val.slice(0, 4) + '*'.repeat(Math.max(val.length - 8, 4)) + val.slice(-4)
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function generateReport(t) {
  const entities = t.detected_entities?.entities || []
  const lines = [
    '=== LAPORAN INSIDEN ANCAMAN SIBER KEUANGAN ===',
    `Tanggal Laporan : ${new Date().toLocaleString('id-ID')}`,
    `ID Ancaman      : ${t.id}`,
    '',
    '--- RINGKASAN ---',
    `Sumber          : ${SRC_LABEL[t.source_type] || t.source_type}`,
    `URL Sumber      : ${t.source_url || '-'}`,
    `Skor Risiko     : ${t.risk_score}/100`,
    `Tingkat Keparahan: ${SEV_LABEL[t.severity]}`,
    `Status          : ${STATUS_LABEL[t.status]}`,
    `Lembaga Terkait : ${(t.institution_tags || []).join(', ') || '-'}`,
    `Waktu Deteksi   : ${formatDate(t.created_at)}`,
    '',
    '--- ENTITAS TERDETEKSI ---',
    ...entities.map((e, i) =>
      `  ${i + 1}. [${ENTITY_LABEL[e.type] || e.type}] ${e.value} (confidence: ${(e.confidence * 100).toFixed(0)}%)`
    ),
    '',
    '--- CATATAN ---',
    'Laporan ini dihasilkan secara otomatis oleh sistem SIAK-Fin.',
    'Untuk tindak lanjut, hubungi tim BSSN/OJK terkait.',
    '',
    '=== AKHIR LAPORAN ===',
  ]
  return lines.join('\n')
}

function downloadReport(t) {
  const text = generateReport(t)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `laporan-ancaman-${t.id.slice(0, 8)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ThreatDetail({ threat: t, onClose }) {
  const [status, setStatus] = useState(t.status)
  const mutation = useUpdateStatus()

  const entities = t.detected_entities?.entities || []

  function handleStatusChange(newStatus) {
    setStatus(newStatus)
    mutation.mutate({ id: t.id, status: newStatus })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-gray-900 border-l border-gray-800 z-50 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${SEV_STYLE[t.severity]}`}>
              {SEV_LABEL[t.severity]}
            </span>
            <h2 className="font-semibold text-sm">Detail Ancaman</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Metadata */}
          <section className="space-y-2.5">
            <Row label="ID" value={t.id} mono />
            <Row label="Sumber" value={SRC_LABEL[t.source_type] || t.source_type} />
            <Row label="URL Sumber" value={t.source_url || '-'} mono truncate />
            <Row label="Skor Risiko" value={`${t.risk_score} / 100`} />
            <Row label="Lembaga" value={(t.institution_tags || []).join(', ') || '-'} />
            <Row label="Waktu Deteksi" value={formatDate(t.created_at)} />
            <Row label="Terakhir Diubah" value={formatDate(t.updated_at)} />
          </section>

          {/* Status update */}
          <section>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={mutation.isPending}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {mutation.isPending && (
              <p className="text-xs text-gray-500 mt-1">Menyimpan...</p>
            )}
          </section>

          {/* Detected entities table */}
          <section>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Entitas Terdeteksi ({entities.length})
            </h3>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800/60 text-gray-400">
                    <th className="text-left px-3 py-2 font-medium">Tipe</th>
                    <th className="text-left px-3 py-2 font-medium">Nilai</th>
                    <th className="text-right px-3 py-2 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {entities.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="px-3 py-2 text-gray-300">
                        {ENTITY_LABEL[e.type] || e.type}
                      </td>
                      <td className="px-3 py-2 text-gray-400 font-mono">
                        {maskValue(e.value)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={
                          (e.confidence || 0) >= 0.8
                            ? 'text-emerald-400'
                            : (e.confidence || 0) >= 0.5
                              ? 'text-amber-400'
                              : 'text-gray-500'
                        }>
                          {((e.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {entities.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-gray-600">
                        Tidak ada entitas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Export button */}
          <button
            onClick={() => downloadReport(t)}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
          >
            Export ke OJK (.txt)
          </button>
        </div>
      </aside>
    </>
  )
}

function Row({ label, value, mono = false, truncate = false }) {
  return (
    <div className="flex text-sm">
      <dt className="w-32 shrink-0 text-gray-500">{label}</dt>
      <dd className={`text-gray-200 min-w-0 ${mono ? 'font-mono text-xs mt-0.5' : ''} ${truncate ? 'truncate' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
