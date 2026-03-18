import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

function SharkFinLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 4 L30 28 Q24 26 18 28 Q12 26 6 28 Z" fill="var(--accent)" opacity="0.9" />
      <path d="M6 28 Q12 26 18 28 Q24 26 30 28" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  )
}

function SharkFinHero() {
  return (
    <svg width="280" height="100" viewBox="0 0 280 100" fill="none" className="mx-auto mt-8">
      <defs>
        <linearGradient id="waterFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="15%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="85%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M140 10 L168 70 Q154 65 140 70 Q126 65 112 70 Z" fill="var(--accent)" opacity="0.12" />
      <path d="M140 10 L168 70 Q154 65 140 70 Q126 65 112 70 Z" stroke="var(--accent)" strokeWidth="0.5" fill="none" opacity="0.2" />
      <rect x="0" y="72" width="280" height="2" fill="url(#waterFade)" rx="1" />
      <path d="M0 82 Q40 78 80 82 Q120 76 140 78 Q160 76 200 82 Q240 78 280 82" stroke="var(--logo-fin)" strokeWidth="0.5" fill="none" opacity="0.12" />
    </svg>
  )
}

function SvgIcon({ children }) {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>{children}</svg>
}
function DetectionIcon() { return <SvgIcon><circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" /><line x1="21" y1="21" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" /><circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1" opacity="0.5" /></SvgIcon> }
function ClassifierIcon() { return <SvgIcon><rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" /></SvgIcon> }
function ReportIcon() { return <SvgIcon><rect x="6" y="3" width="20" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" /><line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" /><line x1="10" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5" /><line x1="10" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" /><circle cx="22" cy="23" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M22 21 L22 23 L24 24" stroke="currentColor" strokeWidth="1" /></SvgIcon> }
function WebhookIcon() { return <SvgIcon><circle cx="16" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" /><circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" /><line x1="16" y1="12" x2="10" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" /><line x1="16" y1="12" x2="22" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" /></SvgIcon> }

const SEV = {
  KRITIS: { bg: 'var(--sev-kritis-bg)', text: 'var(--sev-kritis-text)' },
  TINGGI: { bg: 'var(--sev-tinggi-bg)', text: 'var(--sev-tinggi-text)' },
  SEDANG: { bg: 'var(--sev-sedang-bg)', text: 'var(--sev-sedang-text)' },
}

const MOCK_THREATS = [
  { sev: 'KRITIS', title: 'Dump kartu kredit BRI — 240rb record', meta: 'Telegram · NIK + CVV', time: '6j lalu' },
  { sev: 'KRITIS', title: 'KYC dump e-wallet — 89rb NIK + selfie', meta: 'Paste site · DANA/OVO/GoPay', time: '3j lalu' },
  { sev: 'TINGGI', title: 'Credential combo BCA/Mandiri/BNI — 12,4rb', meta: 'Forum underground', time: '12j lalu' },
  { sev: 'SEDANG', title: 'NPWP dump — 3,2rb record', meta: 'GitHub repo · .env commit', time: '1h lalu' },
]

export default function Landing({ theme, toggleTheme }) {
  const navigate = useNavigate()
  const goDemo = () => navigate('/dashboard')

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} className="min-h-screen">
      <nav className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--landing-border)' }}>
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SharkFinLogo size={32} />
            <div>
              <span className="font-medium text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>SHARK-Fin</span>
              <span className="hidden md:inline text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Source Hunting Alert and Risk Knowledge</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-5">
              {['Fitur', 'Cara Kerja', 'Tentang'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l}</a>
              ))}
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button onClick={goDemo} className="text-xs font-medium px-4 py-1.5 rounded-md transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-page)' }}>Lihat Demo</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center relative"
        style={{ backgroundImage: `linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)`, backgroundSize: '40px 40px' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8"
          style={{ backgroundColor: 'var(--landing-card)', border: '1px solid var(--landing-border)', color: 'var(--text-secondary)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--accent)' }} />
          </span>
          Threat Intelligence · Sektor Keuangan Indonesia
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight max-w-3xl mx-auto" style={{ color: 'var(--text-primary)' }}>
          Ancaman siber keuangan terdeteksi sebelum menyerang
        </h1>
        <p className="mt-5 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          SHARK-Fin memantau Telegram, paste site, dan forum underground 24/7 untuk mendeteksi kebocoran data finansial Indonesia — NIK, nomor kartu, kredensial perbankan — sebelum dieksploitasi.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={goDemo} className="text-sm font-medium px-6 py-2.5 rounded-md transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-page)' }}>Lihat Demo Live</button>
          <a href="#cara-kerja" className="text-sm font-medium px-6 py-2.5 rounded-md"
            style={{ border: '1px solid var(--landing-border)', color: 'var(--text-secondary)' }}>Baca Dokumentasi</a>
        </div>
        <SharkFinHero />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10" style={{ borderTop: '1px solid var(--landing-border)', borderBottom: '1px solid var(--landing-border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x" style={{ borderColor: 'var(--landing-border)' }}>
          {[{ val: '30+', desc: 'Bank Indonesia dicoverage' }, { val: '8', desc: 'Tipe entitas finansial terdeteksi' }, { val: '< 1 jam', desc: 'Waktu deteksi rata-rata' }].map(s => (
            <div key={s.val} className="text-center px-4" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="text-2xl sm:text-3xl font-medium" style={{ color: 'var(--accent)' }}>{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-8">
          <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Threat Feed · Preview</div>
          <h2 className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Ancaman yang sedang dipantau</h2>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--landing-border)', backgroundColor: 'var(--landing-card)' }}>
          {MOCK_THREATS.map((t, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4"
              style={{ borderBottom: i < MOCK_THREATS.length - 1 ? '1px solid var(--landing-border)' : 'none' }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: SEV[t.sev].bg, color: SEV[t.sev].text }}>{t.sev}</span>
                <div className="min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.meta}</div>
                </div>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{t.time}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button onClick={goDemo} className="text-sm" style={{ color: 'var(--accent)' }}>Buka Dashboard Lengkap &rarr;</button>
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Fitur</div>
          <h2 className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Dibangun khusus untuk sektor keuangan Indonesia</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <DetectionIcon />, title: 'Deteksi < 1 jam', desc: 'Crawler 24/7 pada Telegram, paste site, GitHub, dan Google Dork. Alert dikirim ke dashboard dan webhook sebelum data dieksploitasi.' },
            { icon: <ClassifierIcon />, title: 'Classifier NIK, NPWP, BIN bank', desc: 'Validasi NIK dengan tanggal lahir dan kode provinsi. Checksum NPWP. 10 tabel BIN bank nasional. Tidak ada solusi lain yang punya ini.' },
            { icon: <ReportIcon />, title: 'Draft notifikasi mengacu SEOJK 29/2022', desc: 'Draft notifikasi awal mengacu elemen wajib Bab IX SEOJK 29/SEOJK.03/2022. Membantu bank memenuhi kewajiban notifikasi 24 jam ke OJK setelah insiden dikonfirmasi.' },
            { icon: <WebhookIcon />, title: 'Webhook API real-time', desc: 'Integrasi langsung ke SIEM atau SOC lembaga. 92 automated tests. One-command deployment via Docker.' },
          ].map(f => (
            <div key={f.title} className="rounded-lg p-6" style={{ backgroundColor: 'var(--landing-card)', border: '1px solid var(--landing-border)' }}>
              <div className="mb-3">{f.icon}</div>
              <h3 className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Cara Kerja</div>
          <h2 className="text-xl sm:text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>Tiga langkah. Otomatis.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Pantau', desc: 'Crawler otomatis memantau Telegram public channel, paste site, dan GitHub 24/7.' },
            { step: '02', title: 'Deteksi', desc: 'Classifier mengidentifikasi NIK, NPWP, nomor kartu, dan kredensial dengan validasi algoritmik.' },
            { step: '03', title: 'Respons', desc: 'Alert real-time ke dashboard analis + webhook ke sistem SOC lembaga.' },
          ].map(s => (
            <div key={s.step} className="rounded-lg p-6" style={{ backgroundColor: 'var(--landing-card)', border: '1px solid var(--landing-border)' }}>
              <div className="text-xs font-medium mb-3 inline-block px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-page)', color: 'var(--accent)', border: '1px solid var(--landing-border)' }}>{s.step}</div>
              <h3 className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-6xl px-6 py-16 text-center" style={{ borderTop: '1px solid var(--landing-border)' }}>
        <h2 className="text-xl sm:text-2xl font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Lindungi ekosistem keuangan digital Indonesia</h2>
        <p className="text-sm max-w-xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
          SHARK-Fin hanya memantau sumber yang dapat diakses secara publik. Tidak ada akses ilegal. Semua data sensitif di-mask. Digunakan untuk tujuan defensif — melindungi nasabah dan lembaga keuangan Indonesia.
        </p>
        <button onClick={goDemo} className="text-sm font-medium px-8 py-2.5 rounded-md transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-page)' }}>Lihat Demo Live</button>
      </section>

      <footer style={{ borderTop: '1px solid var(--landing-border)' }}>
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SharkFinLogo size={20} />
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>SHARK-Fin</span>
              <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-muted)' }}>Source Hunting Alert and Risk Knowledge for Financial Intelligence</span>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PIDI DIGDAYA x Hackathon 2026 · PS1 Cyber Security & Data Protection</div>
        </div>
      </footer>
    </div>
  )
}
