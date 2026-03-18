import { useState } from 'react'
import StatCards from './components/StatCards'
import ThreatFeed from './components/ThreatFeed'
import SourceChart from './components/SourceChart'
import ThreatDetail from './components/ThreatDetail'

export default function App() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto max-w-[1440px] px-6 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-xs font-bold">SF</div>
          <div>
            <span className="font-semibold tracking-tight">SIAK-Fin</span>
            <span className="hidden sm:inline text-sm text-gray-500 ml-2">
              Intelijen Ancaman Siber Keuangan
            </span>
          </div>
          <div className="ml-auto text-xs text-gray-600">
            Auto-refresh 30d
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
        <StatCards />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ThreatFeed onSelect={setSelected} />
          </div>
          <div className="lg:col-span-2">
            <SourceChart />
          </div>
        </div>
      </main>

      {/* Drawer */}
      {selected && (
        <ThreatDetail threat={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
