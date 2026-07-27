import { DashboardClient } from "@/components/DashboardClient"
import SignalAlerts from "@/components/SignalAlerts"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const symbol = (typeof params.symbol === 'string' ? params.symbol : "TCB").toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
       <div className="max-w-7xl mx-auto space-y-6">
          <SignalAlerts />

          {/* Search Bar & Title */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <h1 className="text-2xl font-bold text-gray-800">Phân tích BroStock: {symbol}</h1>
             <form action="/" method="get" className="flex gap-2">
                 <input
                    name="symbol"
                    defaultValue={symbol}
                    className="border p-2 rounded shadow-sm"
                    placeholder="Nhập mã (VD: HPG)"
                 />
                 <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded shadow hover:bg-blue-800 transition">
                    Phân tích
                 </button>
             </form>
          </div>

          {/* Dashboard — data is loaded client-side to avoid SSR blocking */}
          <DashboardClient symbol={symbol} />
       </div>
    </div>
  )
}