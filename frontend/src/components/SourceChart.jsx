import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStats } from '../hooks/useStats'

const SOURCE_COLORS = {
  TELEGRAM: '#a855f7',
  PASTE: '#f59e0b',
  GITHUB: '#14b8a6',
  HIBP: '#f97316',
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-200">{d.label}</p>
      <p className="text-gray-400">{d.count} ancaman</p>
    </div>
  )
}

export default function SourceChart() {
  const { data: stats, isLoading } = useStats()

  if (isLoading || !stats) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 h-80 animate-pulse" />
    )
  }

  const data = Object.entries(stats.by_source || {}).map(([key, count]) => ({
    name: key,
    label: SOURCE_LABELS[key] || key,
    count,
    fill: SOURCE_COLORS[key] || '#6b7280',
  }))

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
        Ancaman per Sumber
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={85}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
