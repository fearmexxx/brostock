import { NextResponse } from "next/server"
import {
  DEFAULT_VN_BOARD,
  DEFAULT_VN_HIST,
  DEFAULT_VN_INDICES,
} from "@/components/island/ScreenRenderers"

// Bộ đệm RAM trên Vercel Serverless (TTL 15 giây để tối ưu tốc độ & tiết kiệm băng thông)
let cachedPayload: any = null
let cachedAt = 0

function downsample(arr: number[], n = 50): number[] {
  const clean = arr.filter((v) => typeof v === "number" && !isNaN(v))
  if (clean.length <= n) return clean.map((v) => Number(v.toFixed(4)))
  const step = clean.length / n
  const out: number[] = []
  for (let i = 0; i < n - 1; i++) {
    out.push(Number(clean[Math.floor(i * step)].toFixed(4)))
  }
  out.push(Number(clean[clean.length - 1].toFixed(4)))
  return out
}

async function fetchJson(url: string, timeoutMs = 4500): Promise<any> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BroStockIsland/2.7; +https://fenwealth.vn)",
        Accept: "application/json",
      },
      next: { revalidate: 15 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

async function fetchVNLive() {
  const now = Math.floor(Date.now() / 1000)
  const fromIdx = now - 86400 * 140
  const fromStk = now - 86400 * 14

  const indices: Record<string, { value: number; change: number; pct_change: number; volume?: number }> = {
    ...DEFAULT_VN_INDICES,
  }
  let hist = [...DEFAULT_VN_HIST]

  // 1. Lấy chỉ số VNINDEX, VN30, HNXINDEX trực tiếp từ Entrade Chart API
  await Promise.allSettled(
    (["VNINDEX", "VN30", "HNXINDEX"] as const).map(async (idx) => {
      const d = await fetchJson(
        `https://services.entrade.com.vn/chart-api/v2/ohlcs/index?from=${fromIdx}&to=${now}&symbol=${idx}&resolution=1D`
      )
      if (d?.c && d.c.length >= 2) {
        const closes: number[] = d.c
        const vols: number[] = d.v || []
        const curr = Number(closes[closes.length - 1])
        const prev = Number(closes[closes.length - 2])
        const chg = curr - prev
        const pct = prev > 0 ? (chg / prev) * 100 : 0
        indices[idx] = {
          value: Number(curr.toFixed(2)),
          change: Number(chg.toFixed(2)),
          pct_change: Number(pct.toFixed(2)),
          volume: Number(vols[vols.length - 1] || 0),
        }
        if (idx === "VNINDEX") {
          hist = closes.slice(-90).map((v) => Number(Number(v).toFixed(2)))
        }
      }
    })
  )

  // 2. Lấy giá khớp lệnh realtime 24 mã cổ phiếu VN100 chủ lực trên bảng điện
  const board = await Promise.all(
    DEFAULT_VN_BOARD.map(async (item) => {
      try {
        const d = await fetchJson(
          `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromStk}&to=${now}&symbol=${item.s}&resolution=1D`,
          3500
        )
        if (d?.c && d.c.length >= 2) {
          const closes: number[] = d.c
          const vols: number[] = d.v || []
          const rawCurr = Number(closes[closes.length - 1])
          const rawPrev = Number(closes[closes.length - 2])
          const mult = rawCurr < 500 ? 1000 : 1
          const p = Math.round(rawCurr * mult)
          const prev = Math.round(rawPrev * mult)
          const c = p - prev
          const pc = prev > 0 ? Number(((c / prev) * 100).toFixed(2)) : item.pc
          const v = Number(vols[vols.length - 1] || item.v)
          return { ...item, p, c, pc, v }
        }
      } catch {}
      return item
    })
  )

  // Kiểm tra giờ giao dịch chứng khoán Việt Nam (UTC+7: Thứ 2 - Thứ 6, 09:00-11:30 & 13:00-15:00)
  const vnTime = new Date(Date.now() + 7 * 3600 * 1000)
  const day = vnTime.getUTCDay()
  const mins = vnTime.getUTCHours() * 60 + vnTime.getUTCMinutes()
  const isTrading =
    day >= 1 &&
    day <= 5 &&
    ((mins >= 540 && mins < 690) || (mins >= 780 && mins < 900))

  return { indices, board, hist, trading: isTrading }
}

async function fetchCryptoLive() {
  const syms = ["BTC", "ETH", "SOL", "BNB"]
  const out = await Promise.all(
    syms.map(async (sym) => {
      const k = await fetchJson(
        `https://data-api.binance.vision/api/v3/klines?symbol=${sym}USDT&interval=15m&limit=64`
      )
      const closes = (k as any[]).map((row) => parseFloat(row[4]))
      const p = closes[closes.length - 1]
      const o = closes[0]
      const c = o > 0 ? ((p - o) / o) * 100 : 0
      return { s: sym, p, c: Number(c.toFixed(2)), h: downsample(closes, 48) }
    })
  )
  return out
}

async function fetchYahooGroup(items: Array<[string, string]>) {
  const out = await Promise.all(
    items.map(async ([sym, label]) => {
      const d = await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=15m&range=5d`
      )
      const res = d?.chart?.result?.[0]
      const rawCloses: Array<number | null> = res?.indicators?.quote?.[0]?.close || []
      const closes = rawCloses.filter((v): v is number => typeof v === "number" && !isNaN(v))
      const price = Number(res?.meta?.regularMarketPrice ?? closes[closes.length - 1])
      const prev = Number(
        res?.meta?.chartPreviousClose ?? res?.meta?.previousClose ?? closes[0] ?? price
      )
      const pct = prev > 0 ? ((price - prev) / prev) * 100 : 0
      return {
        s: label,
        p: Number(price.toFixed(2)),
        c: Number(pct.toFixed(2)),
        h: downsample(closes.slice(-60), 48),
      }
    })
  )
  return out
}

export async function GET() {
  const now = Date.now()
  if (cachedPayload && now - cachedAt < 15000) {
    return NextResponse.json(cachedPayload, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    })
  }

  const [vnRes, cryptoRes, macroRes, usRes] = await Promise.allSettled([
    fetchVNLive(),
    fetchCryptoLive(),
    fetchYahooGroup([
      ["GC=F", "VÀNG XAU"],
      ["CL=F", "DẦU WTI"],
      ["DX-Y.NYB", "DXY INDEX"],
    ]),
    fetchYahooGroup([
      ["^GSPC", "S&P 500"],
      ["^NDX", "NASDAQ 100"],
      ["^DJI", "DOW JONES"],
      ["NVDA", "NVDA"],
      ["TSLA", "TSLA"],
    ]),
  ])

  const payload = {
    vn: vnRes.status === "fulfilled" ? vnRes.value : cachedPayload?.vn,
    crypto: cryptoRes.status === "fulfilled" ? cryptoRes.value : cachedPayload?.crypto,
    macro: macroRes.status === "fulfilled" ? macroRes.value : cachedPayload?.macro,
    us: usRes.status === "fulfilled" ? usRes.value : cachedPayload?.us,
    ts: Math.floor(now / 1000),
  }

  cachedPayload = payload
  cachedAt = now

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
  })
}
