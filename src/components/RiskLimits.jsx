import { useEffect, useState } from 'react'
import { getRiskLimits } from '../api'

function ProgressBar({ pct, color }) {
  const clampedPct = Math.min(pct, 100)
  const barColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : color
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  )
}

export default function RiskLimits({ onLimitsLoaded }) {
  const [limits, setLimits] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLimits = async () => {
    try {
      const data = await getRiskLimits()
      setLimits(data)
      if (onLimitsLoaded) onLimitsLoaded(data.allowed_symbols)
    } catch (err) {
      console.error('Failed to fetch risk limits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLimits()
    const interval = setInterval(fetchLimits, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-xs text-gray-500">Loading risk limits...</div>
    </div>
  )

  if (!limits) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
        ⚖️ Risk Limits
      </h2>

      {/* Allowed Symbols */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Allowed Symbols</div>
        <div className="flex flex-wrap gap-2">
          {limits.allowed_symbols.map(sym => (
            <span key={sym} className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-md font-bold">
              {sym}
            </span>
          ))}
        </div>
      </div>

      {/* Notional Usage */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Total Notional Used</span>
          <span className={`text-xs font-bold ${limits.notional_used_pct > 80 ? 'text-red-400' : 'text-green-400'}`}>
            {limits.notional_used_pct}%
          </span>
        </div>
        <ProgressBar pct={limits.notional_used_pct} color="bg-blue-500" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">
            ${limits.current_notional.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </span>
          <span className="text-xs text-gray-600">
            ${limits.max_notional.toLocaleString()} max
          </span>
        </div>
      </div>

      {/* Position Usage */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Max Position Size</span>
          <span className={`text-xs font-bold ${limits.position_used_pct > 80 ? 'text-red-400' : 'text-green-400'}`}>
            {limits.position_used_pct}%
          </span>
        </div>
        <ProgressBar pct={limits.position_used_pct} color="bg-purple-500" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">
            {limits.current_max_position.toLocaleString()} shares
          </span>
          <span className="text-xs text-gray-600">
            {limits.max_position.toLocaleString()} max
          </span>
        </div>
      </div>

      {/* Status */}
      <div className={`text-xs px-3 py-2 rounded-lg text-center font-bold ${
        limits.notional_used_pct > 80 || limits.position_used_pct > 80
          ? 'bg-red-900 text-red-300'
          : 'bg-green-900 text-green-300'
      }`}>
        {limits.notional_used_pct > 80 || limits.position_used_pct > 80
          ? '⚠️ Approaching Limits'
          : '✅ Within Risk Limits'}
      </div>
    </div>
  )
}