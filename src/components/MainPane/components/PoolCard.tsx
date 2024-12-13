export default function PoolCard() {
  return (
    <div className="bg-[#001219] text-white p-6 rounded-xl max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#002800] text-emerald-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
            Active
          </div>
          
          {/* Fund Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16v2H4zM4 11h16v2H4zM4 17h16v2H4z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Anemoy Liquid Treasury Fund 1</h1>
          </div>
        </div>
        
        {/* Circle Logo */}
        <svg className="w-12 h-12" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4"/>
          <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="4"/>
        </svg>
      </div>

      {/* TVL */}
      <div className="mb-8">
        <div className="text-gray-400 mb-1">TVL (USDC)</div>
        <div className="text-4xl font-semibold">38,954,595</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-gray-400 mb-1">Volume (24h)</div>
          <div className="text-3xl font-semibold">$76.44B</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">APY</div>
          <div className="flex items-center">
            <span className="text-3xl font-semibold text-red-500">-3.97%</span>
            {/* Mini Chart */}
            <div className="ml-4 w-32 h-12 relative">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path
                  d="M0 20 L20 10 L40 25 L60 5 L80 15 L100 20"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.5)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-gray-400 mb-1">Asset type</div>
          <div className="text-lg">US Treasuries</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Investor type</div>
          <div className="text-lg">Non-US Professional Investors</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400">Rating</div>
          <div className="flex space-x-2">
            <div className="px-3 py-1 rounded bg-[#1a1a2f] text-white flex items-center">
              <span className="w-4 h-4 mr-2">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L10 6H15L11 9L12 14L8 11L4 14L5 9L1 6H6L8 1Z"/>
                </svg>
              </span>
              Aa-bf
            </div>
            <div className="px-3 py-1 rounded bg-[#1a1a2f] text-white flex items-center">
              <span className="w-4 h-4 mr-2">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="7"/>
                </svg>
              </span>
              A+
            </div>
          </div>
        </div>
        
        <button className="px-4 py-2 rounded-lg bg-[#1a1a2f] text-white flex items-center hover:bg-[#2a2a3f] transition-colors">
          Invest
          <svg className="w-4 h-4 ml-2" viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

