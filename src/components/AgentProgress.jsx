import { useState, useEffect, useRef } from 'react'
import { pollStatus } from '../api'

const AGENTS = [
  { key: 'price',     icon: '💹', label: 'Price Agent',         desc: 'Fetching market price' },
  { key: 'news',      icon: '📰', label: 'News Agent',          desc: 'Analyzing sentiment' },
  { key: 'risk',      icon: '⚖️', label: 'Risk Agent',          desc: 'Validating risk limits' },
  { key: 'booking',   icon: '🔖', label: 'Trade Booking Agent', desc: 'Booking trade' },
  { key: 'lifecycle', icon: '🏦', label: 'Lifecycle Agent',     desc: 'Confirming trade' },
]

function parseIntel(text) {
  if (!text) return {}
  const find = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p)
      if (m) return m[1]?.trim()
    }
    return null
  }
  return {
    price:      find([/Price[^\n|]*\|\s*\$?([\d,.]+)/, /\$(\d{2,3}\.\d{2})/]),
    change:     find([/Change[^\n|]*\|\s*([+\-][^\n|]+)/, /([+\-]\$[\d.]+\s*\([+\-][\d.]+%\))/]),
    volume:     find([/Volume[^\n|]*\|\s*([^\n|]+)/, /volume[^\d]*([\d,]+)/i]),
    sentiment:  find([/(BULLISH|BEARISH|NEUTRAL)/]),
    sentScore:  find([/Score[^\d]*([\d.]+)\s*\/\s*1/, /score.*?([\d.]+)/i]),
    keyDrivers: find([/[Kk]ey\s+[Dd]rivers?:?\*?\*?\s*([^\n]+)/, /drivers?[:\s]+([^\n]+)/i]),
    tradeId:    find([/(TRD-[A-Z0-9]+)/]),
    notional:   find([/[Nn]otional[^\$]*\$\*?\*?([\d,]+)/, /\$([\d,]+\.?\d*)\s*notional/i]),
    risk:       text.match(/APPROVED/i) ? 'APPROVED' : text.match(/BLOCKED/i) ? 'BLOCKED' : null,
    status:     find([/Current Status[^\n]*?(CONFIRMED|SETTLED|BOOKED)/, /(CONFIRMED|SETTLED|BOOKED)/]),
  }
}

function PriceCard({ intel }) {
  if (!intel.price) return null
  return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-blue-900">
      <div className="text-xs text-blue-400 font-bold mb-2">💹 Market Data</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-gray-500">Price</div>
          <div className="text-sm font-bold text-white">${intel.price}</div>
        </div>
        {intel.change && (
          <div>
            <div className="text-xs text-gray-500">Change</div>
            <div className="text-xs font-bold text-green-400">{intel.change}</div>
          </div>
        )}
        {intel.volume && (
          <div>
            <div className="text-xs text-gray-500">Volume</div>
            <div className="text-xs text-gray-400">{intel.volume}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function SentimentCard({ intel }) {
  if (!intel.sentiment) return null
  const color = intel.sentiment === 'BULLISH' ? 'text-green-400 border-green-800 bg-green-950'
    : intel.sentiment === 'BEARISH' ? 'text-red-400 border-red-800 bg-red-950'
    : 'text-yellow-400 border-yellow-800 bg-yellow-950'
  const icon = intel.sentiment === 'BULLISH' ? '🟢' : intel.sentiment === 'BEARISH' ? '🔴' : '🟡'
  const barColor = intel.sentiment === 'BULLISH' ? 'bg-green-500' : intel.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-yellow-500'
  return (
    <div className={`mt-2 rounded-lg p-3 border ${color}`}>
      <div className="text-xs font-bold mb-2">📰 Sentiment</div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">{icon} {intel.sentiment}</span>
        {intel.sentScore && <span className="text-xs">{intel.sentScore}/1.0</span>}
      </div>
      {intel.sentScore && (
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${parseFloat(intel.sentScore) * 100}%` }} />
        </div>
      )}
      {intel.keyDrivers && <div className="text-xs opacity-80">{intel.keyDrivers}</div>}
    </div>
  )
}

function RiskCard({ intel }) {
  if (!intel.risk) return null
  const approved = intel.risk === 'APPROVED'
  return (
    <div className={`mt-2 rounded-lg p-3 border ${approved ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
      <div className="text-xs font-bold mb-1">⚖️ Risk Decision</div>
      <div className={`text-sm font-bold ${approved ? 'text-green-400' : 'text-red-400'}`}>
        {approved ? '✅ APPROVED' : '❌ BLOCKED'}
      </div>
      {intel.notional && <div className="text-xs text-gray-400 mt-1">Notional: ${intel.notional}</div>}
    </div>
  )
}

function BookingCard({ intel }) {
  if (!intel.tradeId) return null
  return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="text-xs text-gray-500 mb-1">🔖 Trade Booked</div>
      <div className="text-xs font-mono text-blue-400 font-bold">{intel.tradeId}</div>
      {intel.price && <div className="text-xs text-gray-400 mt-1">@ ${intel.price}</div>}
    </div>
  )
}

function LifecycleCard({ intel }) {
  if (!intel.status) return null
  const colors = {
    CONFIRMED: 'bg-green-900 text-green-300',
    SETTLED:   'bg-purple-900 text-purple-300',
    BOOKED:    'bg-blue-900 text-blue-300',
  }
  return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="text-xs text-gray-500 mb-2">🏦 Lifecycle Status</div>
      <span className={`text-xs px-2 py-1 rounded-full font-bold ${colors[intel.status] || 'bg-gray-700 text-gray-300'}`}>
        {intel.status}
      </span>
    </div>
  )
}

const INTEL_CARDS = {
  price:     PriceCard,
  news:      SentimentCard,
  risk:      RiskCard,
  booking:   BookingCard,
  lifecycle: LifecycleCard,
}

export default function AgentProgress({ requestId, onComplete }) {
  const [status, setStatus]           = useState('PROCESSING')
  const [result, setResult]           = useState(null)
  const [activeAgent, setActiveAgent] = useState(0)
  const [doneAgents, setDoneAgents]   = useState([])
  const [intel, setIntel]             = useState({})
  const startTime                     = useRef(Date.now())
  const timerRef                      = useRef(null)
  const pollRef                       = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 20000)
      const next = Math.min(elapsed, AGENTS.length - 1)
      setActiveAgent(next)
      setDoneAgents(prev => {
        const newDone = Array.from({ length: next }, (_, i) => i)
        return newDone.length > prev.length ? newDone : prev
      })
    }, 2000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollStatus(requestId)
        setStatus(data.status)
        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setDoneAgents([0, 1, 2, 3, 4])
          setActiveAgent(4)
          setResult(data.result)
          setIntel(parseIntel(data.result))
          onComplete(data.result)
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setDoneAgents([0, 1, 2, 3, 4])
          setResult(data.error)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [requestId])

  const isCompleted = idx => doneAgents.includes(idx)
  const isActive    = idx => activeAgent === idx && status === 'PROCESSING' && !isCompleted(idx)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">🤖 Agent Pipeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{requestId}</span>
          {status === 'PROCESSING' && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full animate-pulse">Processing...</span>}
          {status === 'COMPLETED'  && <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">✅ Completed</span>}
          {status === 'FAILED'     && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">❌ Failed</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {AGENTS.map((agent, idx) => {
          const IntelCardComp = INTEL_CARDS[agent.key]
          return (
            <div key={agent.key}>
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-700 ${
                isCompleted(idx) ? 'bg-green-950 border-green-800'
                : isActive(idx)  ? 'bg-blue-950 border-blue-700'
                : 'bg-gray-800 border-gray-700'
              }`}>
                <span className="text-lg">{agent.icon}</span>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${isCompleted(idx) ? 'text-green-400' : isActive(idx) ? 'text-blue-400' : 'text-gray-500'}`}>
                    {agent.label}
                  </div>
                  <div className="text-xs text-gray-500">{agent.desc}</div>
                </div>
                <div className="text-sm w-5 text-center">
                  {isCompleted(idx) && '✅'}
                  {isActive(idx)    && <span className="inline-block animate-spin">⚙️</span>}
                  {!isCompleted(idx) && !isActive(idx) && <span className="text-gray-600">⏸</span>}
                </div>
              </div>
              {isCompleted(idx) && status === 'COMPLETED' && IntelCardComp && (
                <IntelCardComp intel={intel} />
              )}
            </div>
          )
        })}
      </div>

      {result && status === 'FAILED' && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 mt-3">
          <div className="text-xs font-bold text-red-400 mb-1">❌ Error</div>
          <div className="text-xs text-red-300">{result}</div>
        </div>
      )}
    </div>
  )
}