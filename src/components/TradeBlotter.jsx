import { useState } from 'react'

const STATUS_COLORS = {
  BOOKED:    'bg-blue-900 text-blue-300',
  CONFIRMED: 'bg-green-900 text-green-300',
  SETTLED:   'bg-purple-900 text-purple-300',
  FAILED:    'bg-red-900 text-red-300',
}

const SIDE_COLORS = {
  BUY:  'text-green-400',
  SELL: 'text-red-400',
}

export default function TradeBlotter({ trades, onRefresh }) {
  const [filter, setFilter] = useState('ALL')

  const filtered = trades.filter(t => {
    if (filter === 'ALL') return true
    if (filter === 'PAPER') return t.trade_type === 'paper'
    if (filter === 'PHYSICAL') return t.trade_type === 'physical'
    return t.status === filter
  })

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          📋 Trade Blotter
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PAPER', 'PHYSICAL', 'BOOKED', 'CONFIRMED', 'SETTLED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-8">
          No trades found. Submit a trade to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Trade ID</th>
                <th className="text-left py-2 pr-4">Symbol</th>
                <th className="text-left py-2 pr-4">Side</th>
                <th className="text-right py-2 pr-4">Qty</th>
                <th className="text-right py-2 pr-4">Price</th>
                <th className="text-right py-2 pr-4">Notional</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, idx) => (
                <tr
                  key={trade.trade_id}
                  className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                    idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'
                  }`}
                >
                  <td className="py-2 pr-4 font-mono text-blue-400">{trade.trade_id}</td>
                  <td className="py-2 pr-4 font-bold text-white">{trade.symbol}</td>
                  <td className={`py-2 pr-4 font-bold ${SIDE_COLORS[trade.side] || 'text-gray-400'}`}>
                    {trade.side}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-300">
                    {Number(trade.quantity).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-300">
                    ${Number(trade.price).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-300">
                    ${Number(trade.notional).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      trade.trade_type === 'paper'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-purple-900 text-purple-300'
                    }`}>
                      {trade.trade_type}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[trade.status] || 'bg-gray-800 text-gray-400'}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(trade.timestamp).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}