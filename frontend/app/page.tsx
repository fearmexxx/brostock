import { DashboardClient } from "@/components/DashboardClient"
import SignalAlerts from "@/components/SignalAlerts"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const symbol = (typeof params.symbol === 'string' ? params.symbol : "TCB").toUpperCase()
  
  // Fetch Data Server Side
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  let stockData = null;
  let error = null;

  try {
      const res = await fetch(`${API_URL}/api/stock/${symbol}`, { cache: 'no-store' })
      if (!res.ok) {
          if (res.status === 404) error = "Symbol not found or no data available."
          else error = "Failed to fetch stock data."
      } else {
          stockData = await res.json()
      }
  } catch (e) {
      error = "Connection error to backend."
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
       <div className="max-w-7xl mx-auto space-y-6">
          <SignalAlerts />

          {/* Search Bar & Main Content */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <h1 className="text-2xl font-bold text-gray-800">BroStock Analysis: {symbol}</h1>
             <form action="/" method="get" className="flex gap-2">
                 <input 
                    name="symbol" 
                    defaultValue={symbol}
                    className="border p-2 rounded shadow-sm" 
                    placeholder="Enter Symbol (e.g. HPG)" 
                 />
                 <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded shadow hover:bg-blue-800 transition">
                    Analyze
                 </button>
             </form>
          </div>

          {error ? (
              <div className="p-8 text-center text-red-600 bg-white rounded shadow">
                  <p>{error}</p>
              </div>
          ) : (
              <DashboardClient data={stockData} />
          )}
       </div>
    </div>
  )
}