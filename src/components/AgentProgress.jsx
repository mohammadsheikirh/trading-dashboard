import { useState, useEffect } from 'react'
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
  const [status, setStatus]               = useState('PROCESSING')
  const [result, setResult]               = useState(null)
  const [activeAgent, setActiveAgent]     = useState(0)
  const [completedAgents, setCompletedAgents] = useState([])

  // Advance agent indicator every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent(a => {
        if (a < AGENTS.length - 1) {
          setCompletedAgents(prev => [...new Set([...prev, a])])
          return a + 1
        }
        return a
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // Poll for completion every 5 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const data = await pollStatus(requestId)
        setStatus(data.status)
        if (data.status === 'COMPLETED') {
          clearInterval(poll)
          setCompletedAgents([0, 1, 2, 3, 4])
          setResult(data.result)
          onComplete(data.result)
        } else if (data.status === 'FAILED') {
          clearInterval(poll)
          setResult(data.error)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 5000)
    return () => clearInterval(poll)
  }, [requestId])

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
        {AGENTS.map((agent, idx) => {
          const isCompleted = completedAgents.includes(idx) || status === 'COMPLETED'
          const isActive    = activeAgent === idx && status === 'PROCESSING'
          return (
            <div
              key={agent.key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                isCompleted
                  ? 'bg-green-950 border-green-800'
                  : isActive
                  ? 'bg-blue-950 border-blue-700'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <span className="text-lg">{agent.icon}</span>
              <div className="flex-1">
                <div className={`text-xs font-bold ${
                  isCompleted ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  {agent.label}
                </div>
                <div className="text-xs text-gray-500">{agent.desc}</div>
              </div>
              <div className="text-sm">
                {isCompleted && '✅'}
                {isActive    && <span className="inline-block animate-spin">⚙️</span>}
                {!isCompleted && !isActive && <span className="text-gray-600">⏸</span>}
              </div>
            </div>
          )
        })}
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