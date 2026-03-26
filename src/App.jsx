import { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import TradeEntry from './components/TradeEntry'
import AgentProgress from './components/AgentProgress'
import TradeBlotter from './components/TradeBlotter'
import PositionSummary from './components/PositionSummary'
import RiskLimits from './components/RiskLimits'
import { getTrades, getPositions } from './api'

export default function App() {
  const [trades, setTrades]                 = useState([])
  const [positions, setPositions]           = useState([])
  const [activeRequest, setActiveRequest]   = useState(null)
  const [loading, setLoading]               = useState(false)
  const [allowedSymbols, setAllowedSymbols] = useState([])
  const [tradeComplete, setTradeComplete]   = useState(false)
  const [tradingHalted, setTradingHalted]   = useState(false)

  const fetchData = async () => {
    try {
      const [tradesData, positionsData] = await Promise.all([
        getTrades(),
        getPositions()
      ])
      setTrades(tradesData.trades || [])
      setPositions(positionsData.positions || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleTradeComplete = (result) => {
    toast.success('Trade completed successfully!')
    setLoading(false)
    setTradeComplete(true)
    fetchData()
  }

  const handleTradeSubmit = (requestId) => {
    setActiveRequest(requestId)
    setLoading(true)
    setTradeComplete(false)
  }

  const handleDismiss = () => {
    setActiveRequest(null)
    setTradeComplete(false)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">T</div>
            <div>
              <h1 className="text-lg font-bold text-white">Trading Platform POC</h1>
              <p className="text-xs text-gray-400">AI-Powered Multi-Agent System · AWS Bedrock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tradingHalted ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400 font-bold">⚠️ Trading Halted — Limits Breached</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">All Agents Online</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <TradeEntry
            onTradeSubmit={handleTradeSubmit}
            loading={loading}
            allowedSymbols={allowedSymbols}
            tradingHalted={tradingHalted}
          />
          <RiskLimits
            onLimitsLoaded={setAllowedSymbols}
            onHaltedChange={setTradingHalted}
          />
          <PositionSummary positions={positions} />
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {activeRequest && (
            <div>
              <AgentProgress
                key={activeRequest}
                requestId={activeRequest}
                onComplete={handleTradeComplete}
              />
              {tradeComplete && (
                <button
                  onClick={handleDismiss}
                  className="mt-3 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-all border border-gray-700"
                >
                  ✕ Dismiss & Book Another Trade
                </button>
              )}
            </div>
          )}
          <TradeBlotter trades={trades} onRefresh={fetchData} />
        </div>

      </div>
    </div>
  )
}