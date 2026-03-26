import { useState, useEffect, useRef } from 'react'
import { pollStatus } from '../api'

const AGENTS = [
  { key: 'price',   icon: '💹', label: 'Price Agent',         desc: 'Fetching market price' },
  { key: 'news',    icon: '📰', label: 'News Agent',          desc: 'Analyzing sentiment' },
  { key: 'risk',    icon: '⚖️', label: 'Risk Agent',          desc: 'Validating risk limits' },
  { key: 'booking', icon: '🔖', label: 'Trade Booking Agent', desc: 'Booking trade' },
]

function parsePrice(text) {
  if (!text) return null
  const find = (...pp) => { for (const p of pp) { const m = text.match(p); if (m?.[1]) return m[1].trim() } return null }
  return {
    price:  find(/\*\*Price\*\*\s*\|\s*\$?([\d,]+\.?\d*)/, /Price\s*\|\s*\$?([\d,.]+)/),
    change: find(/\*\*Change\*\*[^|]*\|\s*([+\-][^\n|]{2,25})/, /Change[^|]*\|\s*([+\-][^\n|]+)/),
    volume: find(/\*\*Volume\*\*[^|]*\|\s*([\d,]+)/, /Volume[^|]*\|\s*([\d,]+)/),
  }
}

function parseNews(text) {
  if (!text) return null
  const find = (...pp) => { for (const p of pp) { const m = text.match(p); if (m?.[1]) return m[1].trim() } return null }
  return {
    sentiment:  find(/(BULLISH|BEARISH|NEUTRAL)/),
    sentScore:  find(/[Ss]core:\s*([\d.]+)\//, /BULLISH|BEARISH|NEUTRAL[^(]*\(Score:\s*([\d.]+)/, /(\d\.\d{2})\/1\.0/),
    keyDrivers: find(/\*\*Summary:\*\*\s*([^\n]+)/, /Summary[*:\s]+([^\n]+)/, /summary[*:\s]+([^\n]+)/i),
  }
}

function parseRisk(text) {
  if (!text) return null
  const find = (...pp) => { for (const p of pp) { const m = text.match(p); if (m?.[1]) return m[1].trim() } return null }
  return {
    risk:     /APPROVED/i.test(text) ? 'APPROVED' : /BLOCKED/i.test(text) ? 'BLOCKED' : null,
    notional: find(/[Nn]otional[^$\n]*\$\*?\*?([\d,]+)/, /\*\*Notional Value\*\*\s*\|\s*\$?([\d,]+)/),
  }
}

function parseBooking(text) {
  if (!text) return null
  const find = (...pp) => { for (const p of pp) { const m = text.match(p); if (m?.[1]) return m[1].trim() } return null }
  return {
    tradeId:     find(/(TRD-[A-Z0-9]{6,10})/),
    price:       find(/\*\*Price\*\*\s*\|\s*\$?([\d,.]+)/, /@ \$?([\d,.]+) per share/),
    notional:    find(/[Nn]otional[^$\n]*\$\*?\*?([\d,]+)/, /\*\*Notional Value\*\*\s*\|\s*\$?([\d,]+)/),
    tradeStatus: find(/(CONFIRMED|SETTLED|BOOKED)/),
  }
}

export default function AgentProgress({ requestId, onComplete }) {
  const [phase, setPhase]           = useState('PROCESSING')
  const [stepIdx, setStepIdx]       = useState(0)
  const [partials, setPartials]     = useState({})
  const [errMsg, setErrMsg]         = useState(null)
  const pollRef                     = useRef(null)
  const timerRef                    = useRef(null)
  const startRef                    = useRef(Date.now())

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

        // Update partial results live
        if (data.partial_results) {
          setPartials(data.partial_results)
          // Advance stepIdx based on which agents have completed
          const keys = ['price', 'news', 'risk', 'booking']
          const completedCount = keys.filter(k => data.partial_results[k]).length
          setStepIdx(Math.min(completedCount, AGENTS.length - 1))
        }

        if (data.status === 'COMPLETED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setPhase('COMPLETED')
          setStepIdx(AGENTS.length)
          if (data.partial_results) setPartials(data.partial_results)
          onComplete(data.result)
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setPhase('FAILED')
          setErrMsg(data.error)
        }
      } catch (e) { console.error(e) }
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [requestId])

  const isDone   = (idx) => phase === 'COMPLETED' || idx < stepIdx
  const isActive = (idx) => idx === stepIdx && phase === 'PROCESSING'

  const priceIntel   = parsePrice(partials.price)
  const newsIntel    = parseNews(partials.news)
  const riskIntel    = parseRisk(partials.risk)
  const bookingIntel = parseBooking(partials.booking)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">🤖 Agent Pipeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{requestId}</span>
          {phase === 'PROCESSING' && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full animate-pulse">Processing...</span>}
          {phase === 'COMPLETED'  && <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">✅ Completed</span>}
          {phase === 'FAILED'     && <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">❌ Failed</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {AGENTS.map((agent, idx) => {
          const done   = isDone(idx)
          const active = isActive(idx)
          return (
            <div key={agent.key}>
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                done ? 'bg-green-950 border-green-800' : active ? 'bg-blue-950 border-blue-700' : 'bg-gray-800 border-gray-700'
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

              {/* Live intel cards — show as soon as partial result arrives */}
              {agent.key === 'price' && priceIntel?.price && (
                <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-blue-900">
                  <div className="text-xs text-blue-400 font-bold mb-2">💹 Market Data</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><div className="text-xs text-gray-500">Price</div><div className="text-sm font-bold text-white">${priceIntel.price}</div></div>
                    {priceIntel.change && <div><div className="text-xs text-gray-500">Change</div><div className="text-xs font-bold text-green-400">{priceIntel.change}</div></div>}
                    {priceIntel.volume && <div><div className="text-xs text-gray-500">Volume</div><div className="text-xs text-gray-400">{priceIntel.volume}</div></div>}
                  </div>
                </div>
              )}

              {agent.key === 'news' && newsIntel?.sentiment && (
                <div className={`mt-2 rounded-lg p-3 border ${
                  newsIntel.sentiment === 'BULLISH' ? 'bg-green-950 border-green-800 text-green-400'
                  : newsIntel.sentiment === 'BEARISH' ? 'bg-red-950 border-red-800 text-red-400'
                  : 'bg-yellow-950 border-yellow-800 text-yellow-400'}`}>
                  <div className="text-xs font-bold mb-2">📰 Sentiment Analysis</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold">
                      {newsIntel.sentiment === 'BULLISH' ? '🟢' : newsIntel.sentiment === 'BEARISH' ? '🔴' : '🟡'} {newsIntel.sentiment}
                    </span>
                    {newsIntel.sentScore && <span className="text-xs opacity-80">Score: {newsIntel.sentScore}/1.0</span>}
                  </div>
                  {newsIntel.sentScore && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                      <div className={`h-1.5 rounded-full ${newsIntel.sentiment === 'BULLISH' ? 'bg-green-500' : newsIntel.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{width:`${Math.min(parseFloat(newsIntel.sentScore)*100,100)}%`}} />
                    </div>
                  )}
                  {newsIntel.keyDrivers && (
                    <div className="text-xs opacity-90 mt-2 leading-relaxed border-t border-current border-opacity-20 pt-2">
                      📌 {newsIntel.keyDrivers}
                    </div>
                  )}
                </div>
              )}

              {agent.key === 'risk' && riskIntel?.risk && (
                <div className={`mt-2 rounded-lg p-3 border ${riskIntel.risk==='APPROVED' ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
                  <div className="text-xs font-bold mb-1">⚖️ Risk Decision</div>
                  <div className={`text-sm font-bold ${riskIntel.risk==='APPROVED' ? 'text-green-400' : 'text-red-400'}`}>
                    {riskIntel.risk==='APPROVED' ? '✅ APPROVED' : '❌ BLOCKED'}
                  </div>
                  {riskIntel.notional && <div className="text-xs text-gray-400 mt-1">Notional: ${riskIntel.notional}</div>}
                </div>
              )}

              {agent.key === 'booking' && bookingIntel?.tradeId && (
                <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">🔖 Trade Booked</div>
                  <div className="text-sm font-mono text-blue-400 font-bold">{bookingIntel.tradeId}</div>
                  {bookingIntel.price    && <div className="text-xs text-gray-400 mt-1">@ ${bookingIntel.price} per share</div>}
                  {bookingIntel.notional && <div className="text-xs text-gray-400">Notional: ${bookingIntel.notional}</div>}
                  {bookingIntel.tradeStatus && (
                    <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full font-bold ${
                      bookingIntel.tradeStatus==='CONFIRMED' ? 'bg-green-900 text-green-300'
                      : bookingIntel.tradeStatus==='SETTLED' ? 'bg-purple-900 text-purple-300'
                      : 'bg-blue-900 text-blue-300'}`}>
                      {bookingIntel.tradeStatus}
                    </span>
                  )}
                </div>
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