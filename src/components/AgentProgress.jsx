import { useState, useEffect, useRef } from 'react'
import { pollStatus } from '../api'

const AGENTS = [
  { key: 'price',   icon: '💹', label: 'Price Agent',         desc: 'Fetching market price' },
  { key: 'news',    icon: '📰', label: 'News Agent',          desc: 'Analyzing sentiment' },
  { key: 'risk',    icon: '⚖️', label: 'Risk Agent',          desc: 'Validating risk limits' },
  { key: 'booking', icon: '🔖', label: 'Trade Booking Agent', desc: 'Booking trade' },
]

function parseIntel(text) {
  if (!text) return null
  const find = (...patterns) => {
    for (const p of patterns) {
      const m = text.match(p)
      if (m && m[1]) return m[1].trim()
    }
    return null
  }
  return {
    price:      find(/\| \*\*Price\*\* \| \$?([\d,]+\.?\d*)/, /Price[^|]*\|\s*\$?([\d,]+\.?\d*)/),
    change:     find(/\| \*\*Change\*\* \| ([^\n|]+)/, /Change[^|]*\|\s*([+\-][^\n|]{2,25})/),
    volume:     find(/\| \*\*Volume\*\* \| ([^\n|]+)/, /Volume[^|]*\|\s*([^\n|]+)/),
    sentiment:  find(/(BULLISH|BEARISH|NEUTRAL)/),
    sentScore:  find(/Sentiment Score[^|]*\|\s*([\d.]+)/, /[Ss]core.*?([\d.]+)\s*\//),
    keyDrivers: find(/Key drivers?:?\*?\*?\s*([^\n]+)/, /drivers?[:\s*]+([^\n]+)/i),
    tradeId:    find(/(TRD-[A-Z0-9]{6,10})/),
    notional:   find(/Total Notional[^|]*\|\s*\$?([\d,]+\.?\d*)/, /Notional[^$\n]*\$\*?\*?([\d,]+)/),
    risk:       /APPROVED/i.test(text) ? 'APPROVED' : /BLOCKED/i.test(text) ? 'BLOCKED' : null,
    tradeStatus:find(/(CONFIRMED|SETTLED|BOOKED)/),
  }
}

export default function AgentProgress({ requestId, onComplete }) {
  const [phase, setPhase]       = useState('PROCESSING') // PROCESSING | COMPLETED | FAILED
  const [stepIdx, setStepIdx]   = useState(0)
  const [intel, setIntel]       = useState(null)
  const [errMsg, setErrMsg]     = useState(null)
  const pollRef                 = useRef(null)
  const timerRef                = useRef(null)
  const startRef                = useRef(Date.now())

  // Advance step every 20s while processing
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000)
      setStepIdx(Math.min(Math.floor(secs / 20), AGENTS.length - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollStatus(requestId)
        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          const parsed = parseIntel(data.result)
          console.log('COMPLETED raw:', data.result?.substring(0, 800))
          console.log('COMPLETED intel:', JSON.stringify(parsed))
          setPhase('COMPLETED')
          setIntel(parsed)
          onComplete(data.result)
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setPhase('FAILED')
          setErrMsg(data.error)
        }
      } catch (e) { console.error(e) }
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [requestId])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">🤖 Agent Pipeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{requestId}</span>
          {phase === 'PROCESSING' && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full animate-pulse">Processing...</span>}
          {phase === 'COMPLETED'  && <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">✅ Completed</span>}
          {phase === 'FAILED'     && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">❌ Failed</span>}
        </div>
      </div>

      {/* Agent rows */}
      <div className="flex flex-col gap-3">
        {AGENTS.map((agent, idx) => {
          const done   = phase === 'COMPLETED' || idx < stepIdx
          const active = phase === 'PROCESSING' && idx === stepIdx
          return (
            <div key={agent.key}>
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                done   ? 'bg-green-950 border-green-800'
                : active ? 'bg-blue-950 border-blue-700'
                : 'bg-gray-800 border-gray-700'
              }`}>
                <span className="text-lg">{agent.icon}</span>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${done ? 'text-green-400' : active ? 'text-blue-400' : 'text-gray-500'}`}>
                    {agent.label}
                  </div>
                  <div className="text-xs text-gray-500">{agent.desc}</div>
                </div>
                <div className="text-sm w-5 text-center">
                  {done   && '✅'}
                  {active && <span className="inline-block animate-spin">⚙️</span>}
                  {!done && !active && <span className="text-gray-600">⏸</span>}
                </div>
              </div>

              {/* Intel cards — only after completion */}
              {phase === 'COMPLETED' && intel && (
                <>
                  {agent.key === 'price' && intel.price && (
                    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-blue-900">
                      <div className="text-xs text-blue-400 font-bold mb-2">💹 Market Data</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><div className="text-xs text-gray-500">Price</div><div className="text-sm font-bold text-white">${intel.price}</div></div>
                        {intel.change && <div><div className="text-xs text-gray-500">Change</div><div className="text-xs text-green-400 font-bold">{intel.change}</div></div>}
                        {intel.volume && <div><div className="text-xs text-gray-500">Volume</div><div className="text-xs text-gray-400">{intel.volume}</div></div>}
                      </div>
                    </div>
                  )}
                  {agent.key === 'news' && intel.sentiment && (
                    <div className={`mt-2 rounded-lg p-3 border ${
                      intel.sentiment === 'BULLISH' ? 'bg-green-950 border-green-800 text-green-400'
                      : intel.sentiment === 'BEARISH' ? 'bg-red-950 border-red-800 text-red-400'
                      : 'bg-yellow-950 border-yellow-800 text-yellow-400'}`}>
                      <div className="text-xs font-bold mb-2">📰 Sentiment</div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold">
                          {intel.sentiment === 'BULLISH' ? '🟢' : intel.sentiment === 'BEARISH' ? '🔴' : '🟡'} {intel.sentiment}
                        </span>
                        {intel.sentScore && <span className="text-xs opacity-80">{intel.sentScore}/1.0</span>}
                      </div>
                      {intel.sentScore && (
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                          <div className={`h-1.5 rounded-full ${intel.sentiment === 'BULLISH' ? 'bg-green-500' : intel.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{width:`${Math.min(parseFloat(intel.sentScore)*100,100)}%`}} />
                        </div>
                      )}
                      {intel.keyDrivers && <div className="text-xs opacity-80">{intel.keyDrivers}</div>}
                    </div>
                  )}
                  {agent.key === 'risk' && intel.risk && (
                    <div className={`mt-2 rounded-lg p-3 border ${intel.risk==='APPROVED' ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
                      <div className="text-xs font-bold mb-1">⚖️ Risk Decision</div>
                      <div className={`text-sm font-bold ${intel.risk==='APPROVED' ? 'text-green-400' : 'text-red-400'}`}>
                        {intel.risk==='APPROVED' ? '✅ APPROVED' : '❌ BLOCKED'}
                      </div>
                      {intel.notional && <div className="text-xs text-gray-400 mt-1">Notional: ${intel.notional}</div>}
                    </div>
                  )}
                  {agent.key === 'booking' && intel.tradeId && (
                    <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">🔖 Trade Booked</div>
                      <div className="text-sm font-mono text-blue-400 font-bold">{intel.tradeId}</div>
                      {intel.price && <div className="text-xs text-gray-400 mt-1">@ ${intel.price} per share</div>}
                      {intel.notional && <div className="text-xs text-gray-400">Notional: ${intel.notional}</div>}
                      {intel.tradeStatus && (
                        <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full font-bold ${
                          intel.tradeStatus==='CONFIRMED' ? 'bg-green-900 text-green-300'
                          : intel.tradeStatus==='SETTLED' ? 'bg-purple-900 text-purple-300'
                          : 'bg-blue-900 text-blue-300'}`}>
                          {intel.tradeStatus}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {phase === 'FAILED' && errMsg && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 mt-3">
          <div className="text-xs font-bold text-red-400 mb-1">❌ Error</div>
          <div className="text-xs text-red-300">{errMsg}</div>
        </div>
      )}
    </div>
  )
}