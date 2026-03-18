import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import StatCards from '../components/StatCards'
import ThreatFeed from '../components/ThreatFeed'
import SourceChart from '../components/SourceChart'
import ThreatDetail from '../components/ThreatDetail'

// ── Demo context — shares injected threat across components ──
export const DemoContext = createContext({
  demoThreat: null,
  statBoost: null,
})

const DEMO_THREAT = {
  id: 'demo-' + Date.now(),
  source_type: 'TELEGRAM',
  source_url: 'https://t.me/indo_cc_dumps/8821',
  raw_content: 'Fresh Mandiri fullz 5.2k | CC + NIK + CVV | exp 2026 | harga nego | format: 4539XXXXXXXX|XX/XX|XXX|nama|NIK16digit',
  detected_entities: {
    entities: [
      { type: 'CREDIT_CARD', value: '4539 •••• •••• 1234', confidence: 0.95 },
      { type: 'CREDIT_CARD', value: '4539 •••• •••• 5678', confidence: 0.93 },
      { type: 'NIK', value: '321201 •••••••• 07', confidence: 0.90 },
      { type: 'CVV', value: '***', confidence: 0.75 },
      { type: 'BANK_NAME', value: 'Mandiri', confidence: 1.0 },
    ],
    count: 5,
  },
  content_hash: 'demo',
  risk_score: 94,
  severity: 'CRITICAL',
  status: 'NEW',
  institution_tags: ['Bank Mandiri'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  _isDemo: true,
}

// ── Clock ──
function WibClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000)
      setTime(wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '12px' }}>{time}</span>
}

// ── Scanning indicator ──
function ScanIndicator() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs transition-colors"
        style={{ color: '#4a7d9a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#7ab8d9')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4a7d9a')}
      >
        <span className="relative flex h-2 w-2">
          <span className="pulse-green absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#22c55e' }} />
        </span>
        <span className="hidden sm:inline">Memindai 4 sumber</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-50 w-56 rounded-xl p-3 space-y-2"
            style={{ backgroundColor: '#040c17', border: '1px solid rgba(100,180,255,0.2)' }}
          >
            {[
              { name: 'Telegram', time: '2 menit lalu' },
              { name: 'Paste Site', time: '8 menit lalu' },
              { name: 'GitHub', time: '12 menit lalu' },
              { name: 'HIBP', time: '31 menit lalu' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span style={{ color: '#7ab8d9' }}>
                  <span style={{ color: '#22c55e' }}>&#10003;</span> {s.name}
                </span>
                <span style={{ color: '#2a5570' }}>{s.time}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Scan status bar ──
function ScanBar({ phase }) {
  if (!phase) return null
  const configs = {
    scanning: { bg: '#040c17', text: '#22d3ee', msg: 'SHARK-Fin sedang memindai sumber aktif...' },
    detected: { bg: 'rgba(217,119,6,0.9)', text: '#fff', msg: '\u26A0 Konten mencurigakan terdeteksi di Telegram' },
    analyzing: { bg: 'rgba(14,111,163,0.9)', text: '#fff', msg: '\uD83D\uDD0D Menganalisis entitas finansial...' },
    critical: { bg: 'rgba(220,38,38,0.9)', text: '#fff', msg: 'KRITIS \u2014 Kebocoran data dikonfirmasi' },
    out: { bg: 'rgba(220,38,38,0.9)', text: '#fff', msg: 'KRITIS \u2014 Kebocoran data dikonfirmasi' },
  }
  const c = configs[phase] || configs.scanning
  const anim = phase === 'out' ? 'scan-slide-out' : 'scan-slide-in'
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] ${anim}`}
      style={{ backgroundColor: c.bg, borderBottom: '1px solid rgba(100,180,255,0.2)' }}
    >
      <div className="mx-auto max-w-[1440px] px-6 py-2.5 flex items-center gap-3">
        {phase === 'scanning' && (
          <span className="scan-pulse text-xs" style={{ color: c.text }}>●</span>
        )}
        <span className="text-xs font-medium" style={{ color: c.text }}>{c.msg}</span>
      </div>
    </div>
  )
}

// ── Toast notification ──
function Toast({ show, fading, onDetail }) {
  if (!show) return null
  return (
    <div
      className={`fixed top-16 right-6 z-[60] max-w-sm w-full ${fading ? 'toast-out' : 'toast-in'}`}
      style={{
        backgroundColor: '#040c17',
        border: '1px solid rgba(220,38,38,0.3)',
        borderLeft: '3px solid #ef4444',
        borderRadius: '10px',
      }}
    >
      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span style={{ color: '#ef4444' }}>&#x1F534;</span>
          <span className="text-xs font-medium" style={{ color: '#fca5a5' }}>ANCAMAN BARU TERDETEKSI</span>
        </div>
        <p className="text-sm font-medium" style={{ color: '#e8f4ff' }}>Kartu kredit Mandiri — 5.200 record</p>
        <p className="text-xs" style={{ color: '#4a7d9a' }}>Telegram · t.me/indo_cc_dumps · KRITIS</p>
        <p className="text-xs" style={{ color: '#4a7d9a' }}>Entitas: CREDIT_CARD, NIK, CVV</p>
        <p className="text-xs" style={{ color: '#22d3ee' }}>Risk score: 94/100</p>
        <button
          onClick={onDetail}
          className="text-xs font-medium mt-1 transition-colors"
          style={{ color: '#22d3ee' }}
          onMouseEnter={e => (e.target.style.opacity = '0.7')}
          onMouseLeave={e => (e.target.style.opacity = '1')}
        >
          Lihat Detail &rarr;
        </button>
      </div>
    </div>
  )
}

// ── Main Dashboard ──
export default function Dashboard() {
  const [selected, setSelected] = useState(null)
  const [demoThreat, setDemoThreat] = useState(null)
  const [statBoost, setStatBoost] = useState(null)
  const [scanPhase, setScanPhase] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastFading, setToastFading] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const runDemo = useCallback(() => {
    if (demoRunning) return
    setDemoRunning(true)
    setDemoThreat(null)
    setStatBoost(null)
    setShowToast(false)
    setToastFading(false)

    const newThreat = { ...DEMO_THREAT, id: 'demo-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }

    // Step 1: 0s — scanning
    setScanPhase('scanning')

    // Step 2: 2s — detected
    setTimeout(() => setScanPhase('detected'), 2000)

    // Step 3: 3.5s — analyzing
    setTimeout(() => setScanPhase('analyzing'), 3500)

    // Step 4: 5s — critical + toast
    setTimeout(() => {
      setScanPhase('critical')
      setShowToast(true)
    }, 5000)

    // Step 5: 6s — inject threat into feed + boost stats
    setTimeout(() => {
      setDemoThreat(newThreat)
      setStatBoost({ active: 1, exposed: 5200 })
      qc.invalidateQueries({ queryKey: ['stats'] })
    }, 6000)

    // Step 6: 8s — hide scan bar
    setTimeout(() => {
      setScanPhase('out')
      setTimeout(() => setScanPhase(null), 400)
    }, 8000)

    // Toast fade: 14s total
    setTimeout(() => setToastFading(true), 12000)
    setTimeout(() => { setShowToast(false); setToastFading(false) }, 12500)

    setTimeout(() => setDemoRunning(false), 9000)
  }, [demoRunning, qc])

  return (
    <DemoContext.Provider value={{ demoThreat, statBoost }}>
      <div className="min-h-screen" style={{ backgroundColor: '#050e1a', color: '#e8f4ff' }}>
        {/* Scan status bar */}
        <ScanBar phase={scanPhase} />

        {/* Toast */}
        <Toast
          show={showToast}
          fading={toastFading}
          onDetail={() => { setShowToast(false); setSelected(demoThreat || DEMO_THREAT) }}
        />

        {/* Navbar */}
        <nav
          className="sticky top-0 z-40 backdrop-blur"
          style={{ backgroundColor: '#040c17', borderBottom: '1px solid rgba(100,180,255,0.12)' }}
        >
          <div className="mx-auto max-w-[1440px] px-6 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(14,111,163,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                <path d="M18 4 L30 28 Q24 26 18 28 Q12 26 6 28 Z" fill="#22d3ee" opacity="0.9" />
              </svg>
            </button>
            <span className="font-medium text-sm" style={{ color: '#e8f4ff' }}>SHARK-Fin</span>
            <span className="hidden md:inline text-xs" style={{ color: '#4a7d9a' }}>
              Intelijen Ancaman Siber Keuangan
            </span>
            <div className="ml-auto flex items-center gap-4">
              <ScanIndicator />
              <button
                onClick={() => navigate('/')}
                className="text-xs transition-colors hidden sm:inline"
                style={{ color: '#7ab8d9' }}
                onMouseEnter={e => (e.target.style.color = '#22d3ee')}
                onMouseLeave={e => (e.target.style.color = '#7ab8d9')}
              >
                &larr; Beranda
              </button>
              <div className="text-xs flex items-center gap-2" style={{ color: '#4a7d9a' }}>
                <span className="hidden sm:inline">WIB</span>
                <WibClock />
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="mx-auto max-w-[1440px] px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <ThreatFeed onSelect={setSelected} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <StatCards />
              <SourceChart />
            </div>
          </div>
        </main>

        {/* Ocean floor lines */}
        <div className="mt-8" style={{ paddingBottom: '24px' }}>
          {[0.04, 0.03, 0.02].map((op, i) => (
            <div key={i} style={{ height: '0.5px', backgroundColor: `rgba(100,180,255,${op})`, marginBottom: '6px', marginLeft: '10%', marginRight: '10%' }} />
          ))}
        </div>

        {/* Demo mode button */}
        <button
          onClick={runDemo}
          disabled={demoRunning}
          className="fixed bottom-6 right-6 z-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-opacity"
          style={{
            backgroundColor: demoRunning ? '#0e6fa3' : '#22d3ee',
            color: '#050e1a',
            opacity: demoRunning ? 0.6 : 1,
          }}
        >
          {demoRunning ? '● Memindai...' : '\u25B6 Simulasi Deteksi'}
        </button>

        {/* Drawer */}
        {selected && (
          <ThreatDetail threat={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </DemoContext.Provider>
  )
}
