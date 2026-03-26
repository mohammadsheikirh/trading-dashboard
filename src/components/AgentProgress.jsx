import { useState, useEffect, useRef } from 'react'
import { pollStatus } from '../api'
import TradeResult from './TradeResult'

const AGENTS = [
  { key: 'price',     icon: '💹', label: 'Price Agent',         desc: 'Fetching market price' },
  { key: 'news',      icon: '📰', label: 'News Agent',          desc: 'Analyzing sentiment' },
  { key: 'risk',      icon: '⚖️', label: 'Risk Agent',          desc: 'Validating risk limits' },
  { key: 'booking',   icon: '🔖', label: 'Trade Booking Agent', desc: 'Booking trade' },
  { key: 'lifecycle', icon: '🏦', label: 'Lifecycle Agent',     desc: 'Confirming trade' },
]

// Parse intel from completed result
function parseIntel(result) {
  if (!result) return {}
  const ex = (pattern) => { const m = result.match(pattern); return m ? m[1].trim() : null }
  return {
    price:      ex(/\*\*Price\*\*\s*\|\s*\$?([\d,.]+)/),
    change:     ex(/\*\*Change\*\*\s*\|\s*([+\-$\d.,% ()]+)/),
    volume:     ex(/\*\*Volume\*\*\s*\|\s*([\d,~M.]+)/),
    sentiment:  ex(/(BULLISH|BEARISH|NEUTRAL)/),
    sentScore:  ex(/\*\*Sentiment Score\*\*\s*\|\s*([\d.]+)/),
    keyDrivers: ex(/[Kk]ey\s+[Dd]rivers?:?\s*(.+?)(?:\n|---)/),
    tradeId:    ex(/\*\*Trade ID\*\*\s*\|\s*`?(TRD-[A-Z0-9]+)`?/),
    notional:   ex(/\*\*Total Notional\*\*\s*\|\s*\$?([\d,.]+)/),
    risk:       result.includes('APPROVED') ? 'APPROVED' : result.includes('BLOCKED') ? 'BLOCKED' : null,
    status:     ex(/\*\*Current Status\*\*\s*\|\s*[✅]?\s*\*\*?([A-Z]+)\*\*?/),
  }
}

function IntelCard({ agentKey, intel, isVisible }) {
  if (!isVisible || !intel) return null

  if (agentKey === 'price' && intel.price) return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700 grid grid-cols-3 gap-2">
      <div>
        <div className="text-xs text-gray-500">Price</div>
        <div className="text-sm font-bold text-white">${intel.price}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Change</div>
        <div className="text-xs font-bold text-green-400">{intel.change}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Volume</div>
        <div className="text-xs text-gray-400">{intel.volume}</div>
      </div>
    </div>
  )

  if (agentKey === 'news' && intel.sentiment) {
    const color = intel.sentiment === 'BULLISH' ? 'text-green-400' : intel.sentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
    const icon  = intel.sentiment === 'BULLISH' ? '🟢' : intel.sentiment === 'BEARISH' ? '🔴' : '🟡'
    return (
      <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-bold ${color}`}>{icon} {intel.sentiment}</span>
          {intel.sentScore && <span className="text-xs text-gray-400">Score: {intel.sentScore}/1.0</span>}
        </div>
        {intel.sentScore && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
            <div className={`h-1.5 rounded-full ${intel.sentiment === 'BULLISH' ? 'bg-green-500' : intel.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-yellow-500'}`}
              style={{ width: `${parseFloat(intel.sentScore) * 100}%` }} />
          </div>
        )}
        {intel.keyDrivers && <div className="text-xs text-gray-400 line-clamp-2">{intel.keyDrivers}</div>}
      </div>
    )
  }

  if (agentKey === 'risk' && intel.risk) return (
    <div className={`mt-2 rounded-lg p-3 border ${intel.risk === 'APPROVED' ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
      <div className={`text-sm font-bold ${intel.risk === 'APPROVED' ? 'text-green-400' : 'text-red-400'}`}>
        {intel.risk === 'APPROVED' ? '✅ APPROVED' : '❌ BLOCKED'}
      </div>
      {intel.notional && <div className="text-xs text-gray-400 mt-1">Notional: ${intel.notional}</div>}
    </div>
  )

  if (agentKey === 'booking' && intel.tradeId) return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="text-xs text-gray-500 mb-1">Trade Booked</div>
      <div className="text-xs font-mono text-blue-400 font-bold">{intel.tradeId}</div>
    </div>
  )

  if (agentKey === 'lifecycle' && intel.status) return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="text-xs text-gray-500 mb-1">Lifecycle Status</div>
      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
        intel.status === 'CONFIRMED' ? 'bg-green-900 text-green-300' :
        intel.status === 'SETTLED'   ? 'bg-purple-900 text-purple-300' :
        'bg-blue-900 text-blue-300'
      }`}>{intel.status}</span>
    </div>
  )

  return null
}

export default function AgentProgress({ requestId, onComplete }) {
  const [status, setStatus]         = useState('PROCESSING')
  const [result, setResult]         = useState(null)
  const [activeAgent, setActiveAgent] = useState(0)
  const [doneAgents, setDoneAgents] = useState([])
  const [intel, setIntel]           = useState({})
  const startTime                   = useRef(Date.now())
  const timerRef                    = useRef(null)
  const pollRef                     = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 20000)
      const next = Math.min(elapsed, AGENTS.length - 1)
      setActiveAgent(next)
      setDoneAgents(Array.from({ length: next }, (_, i) => i))
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

  const isCompleted = (idx) => doneAgents.includes(idx)
  const isActive    = (idx) => activeAgent === idx && status === 'PROCESSING' && !isCompleted(idx)

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

      <div className="flex flex-col gap-3 mb-2">
        {AGENTS.map((agent, idx) => (
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
            <IntelCard agentKey={agent.key} intel={intel} isVisible={isCompleted(idx)} />
          </div>
        ))}
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