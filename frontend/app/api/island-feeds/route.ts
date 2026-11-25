import { NextRequest, NextResponse } from "next/server"
import {
  DEFAULT_VN_BOARD,
  DEFAULT_VN_HIST,
  DEFAULT_VN_INDICES,
} from "@/components/island/ScreenRenderers"

// Bộ đệm RAM đa tầng trên Vercel Serverless:
// - Khi hết giờ giao dịch chứng khoán VN, dữ liệu VN100 được giữ cache 10 phút (tiết kiệm 97% request ra Entrade).
// - Trong giờ giao dịch VN, cache 30 giây. Dữ liệu Quốc tế/Crypto cache 25 giây.
let cachedPayload: any = null
let cachedAt = 0
let cachedVn: any = null
let cachedVnAt = 0

function isVnTradingOpen(): boolean {
  const vnTime = new Date(Date.now() + 7 * 3600 * 1000)
  const day = vnTime.getUTCDay()
  const mins = vnTime.getUTCHours() * 60 + vnTime.getUTCMinutes()
  return (
    day >= 1 &&
    day <= 5 &&
    ((mins >= 540 && mins < 690) || (mins >= 780 && mins < 900))
  )
}

function downsample(arr: number[], n = 28): number[] {
  const clean = arr.filter((v) => typeof v === "number" && !isNaN(v))
  if (clean.length <= n) return clean.map((v) => Number(v.toFixed(2)))
  const step = clean.length / n
  const out: number[] = []
  for (let i = 0; i < n - 1; i++) {
    out.push(Number(clean[Math.floor(i * step)].toFixed(2)))
  }
  out.push(Number(clean[clean.length - 1].toFixed(2)))
  return out
}

async function fetchJson(url: string, timeoutMs = 4000): Promise<any> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BroStockIsland/2.8; +https://fenwealth.vn)",
        Accept: "application/json",
      },
      next: { revalidate: 25 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

async function fetchVNLive() {
  const nowMs = Date.now()
  const trading = isVnTradingOpen()
  const vnTtl = trading ? 30000 : 600000 // 30s trong phiên, 10 phút ngoài phiên
  if (cachedVn && nowMs - cachedVnAt < vnTtl) {
    return { ...cachedVn, trading }
  }

  const now = Math.floor(nowMs / 1000)
  const fromIdx = now - 86400 * 95
  const fromStk = now - 86400 * 10

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
          hist = downsample(closes.slice(-60), 45)
        }
      }
    })
  )

  // 2. Lấy giá khớp lệnh 24 mã cổ phiếu VN100 chủ lực trên bảng điện
  const board = await Promise.all(
    DEFAULT_VN_BOARD.map(async (item) => {
      try {
        const d = await fetchJson(
          `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromStk}&to=${now}&symbol=${item.s}&resolution=1D`,
          3200
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

  cachedVn = { indices, board, hist, trading }
  cachedVnAt = nowMs
  return cachedVn
}

async function fetchCryptoLive() {
  const syms = ["BTC", "ETH", "SOL", "BNB"]
  const out = await Promise.all(
    syms.map(async (sym) => {
      const k = await fetchJson(
        `https://data-api.binance.vision/api/v3/klines?symbol=${sym}USDT&interval=15m&limit=48`
      )
      const closes = (k as any[]).map((row) => parseFloat(row[4]))
      const p = closes[closes.length - 1]
      const o = closes[0]
      const c = o > 0 ? ((p - o) / o) * 100 : 0
      return { s: sym, p, c: Number(c.toFixed(2)), h: downsample(closes, 28) }
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
        h: downsample(closes.slice(-48), 28),
      }
    })
  )
  return out
}

export async function GET(req: NextRequest) {
  const now = Date.now()
  if (cachedPayload && now - cachedAt < 25000) {
    const etag = `W/"${cachedPayload.ts}"`
    if (req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
        },
      })
    }
    return NextResponse.json(cachedPayload, {
      headers: {
        ETag: etag,
        "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
      },
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

  const ts = Math.floor(now / 1000)
  const payload = {
    vn: vnRes.status === "fulfilled" ? vnRes.value : cachedPayload?.vn,
    crypto: cryptoRes.status === "fulfilled" ? cryptoRes.value : cachedPayload?.crypto,
    macro: macroRes.status === "fulfilled" ? macroRes.value : cachedPayload?.macro,
    us: usRes.status === "fulfilled" ? usRes.value : cachedPayload?.us,
    ts,
  }

  cachedPayload = payload
  cachedAt = now
  const etag = `W/"${ts}"`

  return NextResponse.json(payload, {
    headers: {
      ETag: etag,
      "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
    },
  })
}
