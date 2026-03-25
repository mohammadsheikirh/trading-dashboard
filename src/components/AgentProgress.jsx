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

export default function AgentProgress({ requestId, onComplete }) {
  const [status, setStatus]           = useState('PROCESSING')
  const [result, setResult]           = useState(null)
  const [activeAgent, setActiveAgent] = useState(0)
  const [doneAgents, setDoneAgents]   = useState([])
  const startTime                     = useRef(Date.now())
  const timerRef                      = useRef(null)
  const pollRef                       = useRef(null)

  // Advance one agent every 20 seconds while processing
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 20000)
      const next = Math.min(elapsed, AGENTS.length - 1)
      setActiveAgent(next)
      setDoneAgents(Array.from({ length: next }, (_, i) => i))
    }, 2000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Poll every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollStatus(requestId)
        setStatus(data.status)

        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          // Mark ALL agents as done immediately
          setDoneAgents([0, 1, 2, 3, 4])
          setActiveAgent(4)
          setResult(data.result)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          🤖 Agent Pipeline
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{requestId}</span>
          {status === 'PROCESSING' && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full animate-pulse">
              Processing...
            </span>
          )}
          {status === 'COMPLETED' && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
              ✅ Completed
            </span>
          )}
          {status === 'FAILED' && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">
              ❌ Failed
            </span>
          )}
        </div>
      </div>

      {/* Agent Steps */}
      <div className="flex flex-col gap-2 mb-2">
        {AGENTS.map((agent, idx) => (
          <div
            key={agent.key}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-700 ${
              isCompleted(idx)
                ? 'bg-green-950 border-green-800'
                : isActive(idx)
                ? 'bg-blue-950 border-blue-700'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            <span className="text-lg">{agent.icon}</span>
            <div className="flex-1">
              <div className={`text-xs font-bold ${
                isCompleted(idx) ? 'text-green-400'
                : isActive(idx)  ? 'text-blue-400'
                : 'text-gray-500'
              }`}>
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
        ))}
      </div>

      {/* Rich Trade Result */}
      {result && status === 'COMPLETED' && (
        <TradeResult result={result} />
      )}

      {/* Error */}
      {result && status === 'FAILED' && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 mt-3">
          <div className="text-xs font-bold text-red-400 mb-1">❌ Error</div>
          <div className="text-xs text-red-300">{result}</div>
        </div>
      )}
    </div>
  )
}