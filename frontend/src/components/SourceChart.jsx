import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { useStats } from '../hooks/useStats'

const SOURCE_COLORS = {
  TELEGRAM: '#7c3aed',
  PASTE: '#d97706',
  GITHUB: '#0e9f6e',
  HIBP: '#e11d48',
}

const SOURCE_LABELS = {
  TELEGRAM: 'Telegram',
  PASTE: 'Paste Site',
  GITHUB: 'GitHub',
  HIBP: 'HIBP',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        backgroundColor: '#040c17',
        border: '1px solid rgba(100,180,255,0.2)',
      }}
    >
      <p className="font-medium" style={{ color: '#e8f4ff' }}>{d.label}</p>
      <p style={{ color: '#7ab8d9' }}>{d.count} ancaman</p>
    </div>
  )
}

export default function SourceChart() {
  const { data: stats, isLoading } = useStats()

  if (isLoading || !stats) {
    return (
      <div
        className="rounded-xl p-5 h-72 animate-pulse"
        style={{ backgroundColor: '#060f1c', border: '1px solid rgba(100,180,255,0.12)' }}
      />
    )
  }

  const data = Object.entries(stats.by_source || {}).map(([key, count]) => ({
    name: key,
    label: SOURCE_LABELS[key] || key,
    count,
    fill: SOURCE_COLORS[key] || '#4a7d9a',
  }))

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#060f1c', border: '1px solid rgba(100,180,255,0.12)' }}
    >
      <h2
        className="font-medium text-xs uppercase tracking-widest mb-4"
        style={{ color: '#4a7d9a', letterSpacing: '0.08em' }}
      >
        Ancaman per Sumber
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 5, right: 15 }}>
          <CartesianGrid
            horizontal={false}
            stroke="rgba(100,180,255,0.06)"
          />
          <XAxis
            type="number"
            tick={{ fill: '#3a6a85', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#3a6a85', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(100,180,255,0.03)' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: '#4a7d9a' }}>
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: d.fill }}
            />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
