export default function PositionSummary({ positions }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
        📈 Open Positions
      </h2>

      {positions.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-6">
          No open positions yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {positions.map(pos => (
            <div
              key={pos.symbol}
              className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300">
                  {pos.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{pos.symbol}</div>
                  <div className="text-xs text-gray-500">Open Position</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${
                  Number(pos.quantity) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Number(pos.quantity) >= 0 ? '+' : ''}{Number(pos.quantity).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">shares</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}