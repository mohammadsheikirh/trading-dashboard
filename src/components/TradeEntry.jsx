import { useState } from 'react'
import { submitTrade } from '../api'
import { toast } from 'react-hot-toast'

export default function TradeEntry({ onTradeSubmit, loading, allowedSymbols, tradingHalted }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [side, setSide] = useState('BUY')
  const [quantity, setQuantity] = useState('100')
  const [tradeType, setTradeType] = useState('paper')
  const [symbolError, setSymbolError] = useState('')

  const validateSymbol = (sym) => {
    if (!sym) {
      setSymbolError('Symbol is required')
      return false
    }
    if (allowedSymbols && allowedSymbols.length > 0 && !allowedSymbols.includes(sym.toUpperCase())) {
      setSymbolError(`❌ ${sym.toUpperCase()} not allowed. Use: ${allowedSymbols.join(', ')}`)
      return false
    }
    setSymbolError('')
    return true
  }

  const handleSymbolChange = (e) => {
    const val = e.target.value.toUpperCase()
    setSymbol(val)
    if (val.length > 0) validateSymbol(val)
    else setSymbolError('')
  }

  const handleSubmit = async () => {
    if (!validateSymbol(symbol)) {
      toast.error(`Symbol ${symbol} is not in the allowed list`)
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    const message = `Get the price and news for ${symbol.toUpperCase()}, then book a ${tradeType} ${side} trade for ${quantity} shares at market price`
    try {
      const data = await submitTrade(message, `session-${Date.now()}`)
      onTradeSubmit(data.request_id)
      toast.success(`Trade request submitted: ${data.request_id}`)
    } catch (err) {
      toast.error('Failed to submit trade')
    }
  }

  const isSymbolValid = allowedSymbols && allowedSymbols.includes(symbol.toUpperCase())

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
        📋 New Trade
      </h2>

      {/* Symbol */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Symbol</label>
        <div className="relative">
          <input
            type="text"
            value={symbol}
            onChange={handleSymbolChange}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none pr-8 ${
              symbolError
                ? 'border-red-500 focus:border-red-400'
                : isSymbolValid
                ? 'border-green-600 focus:border-green-500'
                : 'border-gray-700 focus:border-blue-500'
            }`}
            placeholder="e.g. AAPL"
          />
          {isSymbolValid && (
            <span className="absolute right-2 top-2 text-green-400 text-sm">✅</span>
          )}
          {symbolError && (
            <span className="absolute right-2 top-2 text-red-400 text-sm">❌</span>
          )}
        </div>
        {symbolError && (
          <p className="text-xs text-red-400 mt-1">{symbolError}</p>
        )}
        {/* Allowed symbols quick select */}
        {allowedSymbols && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {allowedSymbols.map(sym => (
              <button
                key={sym}
                onClick={() => { setSymbol(sym); setSymbolError('') }}
                className={`text-xs px-2 py-0.5 rounded transition-all ${
                  symbol === sym
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BUY / SELL */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Side</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSide('BUY')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              side === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              side === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            SELL
          </button>
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Quantity (Shares)</label>
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g. 100"
        />
      </div>

      {/* Paper / Physical Toggle */}
      <div className="mb-5">
        <label className="text-xs text-gray-400 mb-1 block">Trade Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('paper')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tradeType === 'paper' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📄 Paper
          </button>
          <button
            onClick={() => setTradeType('physical')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tradeType === 'physical' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🏦 Physical
          </button>
        </div>
      </div>

{/* Trading Halted Warning */}
      {tradingHalted && (
        <div className="mb-3 bg-red-950 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300 text-center font-bold">
          🚨 Trading Halted — Risk Limits Breached
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !!symbolError || tradingHalted}
        className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${
          loading || symbolError || tradingHalted
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {loading ? '⏳ Processing...' : tradingHalted ? '🚨 Trading Halted' : '🚀 Execute Trade'}
      </button>
    </div>
  )
}