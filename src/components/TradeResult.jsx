export default function TradeResult({ result }) {
  if (!result) return null

  // Parse key values from the markdown response
  const extract = (pattern, text) => {
    const match = text.match(pattern)
    return match ? match[1].trim() : null
  }

  const price = extract(/\*\*Price\*\*\s*\|\s*\$?([\d,.]+)/, result) ||
                extract(/Price.*?\$([\d,.]+)/, result)
  const change = extract(/\*\*Change\*\*\s*\|\s*([+\-$\d.,% ()]+)/, result)
  const volume = extract(/\*\*Volume\*\*\s*\|\s*([\d,~M]+)/, result)
  const sentiment = extract(/\*\*Overall Sentiment\*\*\s*\|\s*[🟢🔴🟡]?\s*(BULLISH|BEARISH|NEUTRAL)/, result) ||
                    extract(/(BULLISH|BEARISH|NEUTRAL)/, result)
  const sentimentScore = extract(/\*\*Sentiment Score\*\*\s*\|\s*([\d.]+)/, result)
  const tradeId = extract(/\*\*Trade ID\*\*\s*\|\s*`?(TRD-[A-Z0-9]+)`?/, result)
  const execPrice = extract(/\*\*Execution Price\*\*\s*\|\s*\$?([\d,.]+)/, result)
  const notional = extract(/\*\*Total Notional\*\*\s*\|\s*\$?([\d,.]+)/, result)
  const status = extract(/\*\*Current Status\*\*\s*\|\s*[✅]?\s*\*\*?([A-Z]+)\*\*?/, result)
  const riskDecision = result.includes('APPROVED') ? 'APPROVED' : result.includes('BLOCKED') ? 'BLOCKED' : null
  const keyDrivers = extract(/[Kk]ey\s+[Dd]rivers?:?\s*(.+?)(?:\n|$)/, result)
  const symbol = extract(/##.*?(AAPL|TSLA|MSFT|AMZN|GOOGL)/, result) ||
                 extract(/(AAPL|TSLA|MSFT|AMZN|GOOGL)/, result)

  const sentimentColor = sentiment === 'BULLISH'
    ? 'bg-green-900 text-green-300 border-green-700'
    : sentiment === 'BEARISH'
    ? 'bg-red-900 text-red-300 border-red-700'
    : 'bg-yellow-900 text-yellow-300 border-yellow-700'

  const sentimentIcon = sentiment === 'BULLISH' ? '🟢' : sentiment === 'BEARISH' ? '🔴' : '🟡'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-4">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
        🧾 Trade Execution Summary
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">

        {/* Price Card */}
        {price && (
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">💹 Market Price</div>
            <div className="text-xl font-bold text-white">${price}</div>
            {change && <div className="text-xs text-green-400 mt-1">{change}</div>}
            {volume && <div className="text-xs text-gray-500 mt-1">Vol: {volume}</div>}
          </div>
        )}

        {/* Sentiment Card */}
        {sentiment && (
          <div className={`rounded-lg p-3 border ${sentimentColor}`}>
            <div className="text-xs opacity-70 mb-1">📰 Sentiment</div>
            <div className="text-sm font-bold">{sentimentIcon} {sentiment}</div>
            {sentimentScore && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Score</span>
                  <span>{sentimentScore}/1.0</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-current"
                    style={{ width: `${parseFloat(sentimentScore) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {keyDrivers && (
              <div className="text-xs mt-2 opacity-80 line-clamp-2">{keyDrivers}</div>
            )}
          </div>
        )}

        {/* Risk Decision */}
        {riskDecision && (
          <div className={`rounded-lg p-3 border ${
            riskDecision === 'APPROVED'
              ? 'bg-green-950 border-green-800'
              : 'bg-red-950 border-red-800'
          }`}>
            <div className="text-xs text-gray-500 mb-1">⚖️ Risk Decision</div>
            <div className={`text-sm font-bold ${
              riskDecision === 'APPROVED' ? 'text-green-400' : 'text-red-400'
            }`}>
              {riskDecision === 'APPROVED' ? '✅' : '❌'} {riskDecision}
            </div>
            {notional && (
              <div className="text-xs text-gray-400 mt-1">
                Notional: ${notional}
              </div>
            )}
          </div>
        )}

        {/* Trade ID */}
        {tradeId && (
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">🔖 Trade Booked</div>
            <div className="text-xs font-mono text-blue-400 font-bold">{tradeId}</div>
            {execPrice && (
              <div className="text-xs text-gray-400 mt-1">@ ${execPrice}</div>
            )}
            {status && (
              <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block font-bold ${
                status === 'CONFIRMED' ? 'bg-green-900 text-green-300' :
                status === 'BOOKED' ? 'bg-blue-900 text-blue-300' :
                'bg-purple-900 text-purple-300'
              }`}>
                {status}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Drivers full text */}
      {keyDrivers && (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">📌 Key Drivers</div>
          <div className="text-xs text-gray-300 leading-relaxed">{keyDrivers}</div>
        </div>
      )}
    </div>
  )
}