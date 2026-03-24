import { useState } from 'react'
import { submitTrade } from '../api'
import { toast } from 'react-hot-toast'

export default function TradeEntry({ onTradeSubmit, loading }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [side, setSide] = useState('BUY')
  const [quantity, setQuantity] = useState('100')
  const [tradeType, setTradeType] = useState('paper')

  const handleSubmit = async () => {
    if (!symbol || !quantity) {
      toast.error('Please fill in all fields')
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
        📋 New Trade
      </h2>

      {/* Symbol */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g. AAPL"
        />
      </div>

      {/* BUY / SELL */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Side</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSide('BUY')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              side === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              side === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
              tradeType === 'paper'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📄 Paper
          </button>
          <button
            onClick={() => setTradeType('physical')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              tradeType === 'physical'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🏦 Physical
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${
          loading
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {loading ? '⏳ Processing...' : '🚀 Execute Trade'}
      </button>
    </div>
  )
}