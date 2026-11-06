import * as THREE from "three"

export interface VNStockRow {
  s: string
  p: number
  c: number
  pc: number
  v: number
  sc: number
}

export interface TickerItem {
  s: string
  p: number
  c: number
  h?: number[]
}

export interface IslandScreensData {
  vn?: {
    indices?: Record<string, { value: number; change: number; pct_change: number; volume?: number }>
    board?: VNStockRow[]
    hist?: number[]
    trading?: boolean
  }
  crypto?: TickerItem[]
  macro?: TickerItem[]
  us?: TickerItem[]
  ts?: number
}

// Dữ liệu tĩnh chuẩn từ BroStock Core (market_data.db) — Hiển thị tức thì không cần chờ gọi API ngoài
export const DEFAULT_VN_INDICES: Record<string, { value: number; change: number; pct_change: number; volume?: number }> = {
  VNINDEX: { value: 1740.73, change: 7.71, pct_change: 0.44, volume: 747372416 },
  VN30: { value: 1865.23, change: 3.16, pct_change: 0.17, volume: 267653620 },
  HNXINDEX: { value: 256.61, change: -1.27, pct_change: -0.49, volume: 68471420 },
}

export const DEFAULT_VN_HIST: number[] = [
  1860.01, 1867.21, 1866.35, 1862.08, 1843.5, 1848.25, 1853.7, 1840.7, 1828.34, 1800.54,
  1806.63, 1782.12, 1804.24, 1787.45, 1743.51, 1730.56, 1668.53, 1699.38, 1686.11, 1669.01,
  1680.62, 1704.68, 1744.66, 1735.78, 1762.84, 1777.23, 1776.46, 1764.78, 1768.06, 1776.77,
  1773.41, 1793.18, 1765.63, 1729.08, 1727.46, 1732.02, 1726.69, 1734.24, 1768.12, 1788.78,
  1791.41, 1821.32, 1831.56, 1832.12, 1827.72, 1853.08, 1821.64, 1830.44, 1827.12, 1829.23,
  1795.21, 1788.23, 1811.15, 1810.11, 1822.77, 1815.66, 1799.67, 1816.93, 1801.65, 1775.09,
  1785.11, 1780.68, 1777.73, 1768.62, 1749.3, 1737.71, 1753.2, 1759.08, 1753.39, 1738.97,
  1735.09, 1720.98, 1719.42, 1704.87, 1698.35, 1705.91, 1689.84, 1691.97, 1738.67, 1760.63,
  1774.15, 1763.55, 1761.87, 1766.65, 1755.61, 1741.62, 1710.72, 1699.62, 1733.02, 1740.73,
]

export const DEFAULT_VN_BOARD: VNStockRow[] = [
  { s: "SSI", p: 20400, c: 0, pc: 0.0, v: 31382100, sc: -4 },
  { s: "SHB", p: 10700, c: -50, pc: -0.47, v: 26581900, sc: -16 },
  { s: "TPB", p: 12800, c: 50, pc: 0.39, v: 22484800, sc: 15 },
  { s: "VND", p: 14200, c: 250, pc: 1.79, v: 21196100, sc: -18 },
  { s: "HPG", p: 21500, c: -200, pc: -0.92, v: 18613700, sc: -15 },
  { s: "CTG", p: 31600, c: 550, pc: 1.77, v: 17794700, sc: -12 },
  { s: "HDB", p: 22450, c: 250, pc: 1.13, v: 16436100, sc: 27 },
  { s: "VPB", p: 21900, c: -250, pc: -1.13, v: 12199700, sc: 29 },
  { s: "TCB", p: 21950, c: 100, pc: 0.46, v: 11973200, sc: 39 },
  { s: "MBB", p: 19500, c: 250, pc: 1.3, v: 11586100, sc: -31 },
  { s: "PNJ", p: 15150, c: 400, pc: 2.71, v: 11134200, sc: -27 },
  { s: "BSR", p: 26500, c: 0, pc: 0.0, v: 9390600, sc: -24 },
  { s: "KDH", p: 14350, c: 550, pc: 3.99, v: 8253500, sc: -34 },
  { s: "FPT", p: 52900, c: -1000, pc: -1.86, v: 8006200, sc: -56 },
  { s: "MSB", p: 16450, c: 0, pc: 0.0, v: 7823700, sc: 55 },
  { s: "VHM", p: 63300, c: 100, pc: 0.16, v: 7233200, sc: 1 },
  { s: "ACB", p: 20550, c: 50, pc: 0.24, v: 6518000, sc: -21 },
  { s: "POW", p: 12500, c: 50, pc: 0.4, v: 6448200, sc: -40 },
  { s: "VCB", p: 54200, c: -600, pc: -1.09, v: 5003300, sc: -58 },
  { s: "VIB", p: 14100, c: -150, pc: -1.05, v: 4984400, sc: 0 },
  { s: "MSN", p: 71600, c: -700, pc: -0.97, v: 4520600, sc: -4 },
  { s: "STB", p: 69200, c: 1500, pc: 2.22, v: 4428300, sc: 7 },
  { s: "BID", p: 32250, c: -200, pc: -0.62, v: 4411400, sc: -41 },
  { s: "OCB", p: 10950, c: 250, pc: 2.34, v: 2090200, sc: 71 },
]

export const DEFAULT_CRYPTO: TickerItem[] = [
  { s: "BTC", p: 76258.9, c: -5.57, h: [80600, 79400, 78500, 77900, 77100, 76600, 76258.9] },
  { s: "ETH", p: 2244.6, c: -7.67, h: [2430, 2390, 2350, 2310, 2280, 2260, 2244.6] },
  { s: "SOL", p: 90.23, c: -6.29, h: [96.4, 95.1, 93.8, 92.5, 91.4, 90.8, 90.23] },
  { s: "BNB", p: 695.45, c: -3.44, h: [720, 715, 709, 704, 700, 697, 695.45] },
]

export const DEFAULT_MACRO: TickerItem[] = [
  { s: "VÀNG XAU", p: 4079.3, c: 2.76, h: [3970, 3995, 4015, 4032, 4050, 4066, 4079.3] },
  { s: "DẦU WTI", p: 91.4, c: -5.25, h: [96.4, 95.2, 94.1, 93.3, 92.5, 91.8, 91.4] },
  { s: "DXY INDEX", p: 101.67, c: -0.08, h: [101.85, 101.8, 101.76, 101.72, 101.7, 101.69, 101.67] },
]

export const DEFAULT_US: TickerItem[] = [
  { s: "S&P 500", p: 7353.7, c: -4.75, h: [7720, 7640, 7580, 7510, 7440, 7390, 7353.7] },
  { s: "NASDAQ 100", p: 26629.8, c: -9.43, h: [29400, 28800, 28200, 27600, 27100, 26850, 26629.8] },
  { s: "DOW JONES", p: 51523.1, c: -1.57, h: [52340, 52180, 51990, 51840, 51710, 51600, 51523.1] },
  { s: "NVDA", p: 181.6, c: -15.01, h: [213.6, 206.4, 199.2, 193.5, 188.1, 184.2, 181.6] },
  { s: "TSLA", p: 343.69, c: -14.78, h: [403.3, 391.0, 378.5, 366.2, 355.8, 348.4, 343.69] },
]

function fmtVnd(val: number): string {
  if (!val || isNaN(val)) return "0.00"
  const p = val > 500 ? val / 1000 : val
  return p.toFixed(2)
}

function vpsColor(pc: number): string {
  if (pc >= 6.6) return "#d946ef" // Tím trần
  if (pc <= -6.6) return "#06b6d4" // Xanh sàn
  if (pc > 0.01) return "#22c55e" // Xanh tăng
  if (pc < -0.01) return "#ef4444" // Đỏ giảm
  return "#eab308" // Vàng tham chiếu
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  if (!data || data.length < 2) return
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  ctx.save()
  ctx.beginPath()
  data.forEach((v, i) => {
    const px = x + (i / (data.length - 1)) * w
    const py = y + h - ((v - min) / range) * (h - 6) - 3
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, y, 0, y + h)
  grad.addColorStop(0, color + "55")
  grad.addColorStop(1, color + "00")
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()
}

// Kiểm tra khung giờ giao dịch chứng khoán Việt Nam (HOSE/HNX/UPCOM - Múi giờ UTC+7)
// Sáng: 09:00 - 11:30 | Chiều: 13:00 - 15:00 (Thứ 2 đến Thứ 6)
function getVnMarketStatus(): { isOpen: boolean; label: string; color: string } {
  const vnTime = new Date(Date.now() + 7 * 3600 * 1000)
  const day = vnTime.getUTCDay() // 0: CN, 1..5: T2..T6, 6: T7
  const mins = vnTime.getUTCHours() * 60 + vnTime.getUTCMinutes()

  if (day >= 1 && day <= 5) {
    if ((mins >= 540 && mins < 690) || (mins >= 780 && mins < 900)) {
      return { isOpen: true, label: "🟢 ĐANG GIAO DỊCH", color: "#22c55e" }
    }
    if (mins >= 690 && mins < 780) {
      return { isOpen: false, label: "🟡 NGHỈ TRƯA (11:30-13:00)", color: "#fbbf24" }
    }
  }
  return { isOpen: false, label: "🔴 HẾT GIỜ GD (ĐÓNG CỬA)", color: "#f87171" }
}

export class ScreenSet {
  mainCanvas: HTMLCanvasElement
  mainTex: THREE.CanvasTexture
  cryptoCanvas: HTMLCanvasElement
  cryptoTex: THREE.CanvasTexture
  macroCanvas: HTMLCanvasElement
  macroTex: THREE.CanvasTexture
  usCanvas: HTMLCanvasElement
  usTex: THREE.CanvasTexture

  data: IslandScreensData = {
    vn: {
      indices: {
        VNINDEX: { ...DEFAULT_VN_INDICES.VNINDEX },
        VN30: { ...DEFAULT_VN_INDICES.VN30 },
        HNXINDEX: { ...DEFAULT_VN_INDICES.HNXINDEX },
      },
      board: DEFAULT_VN_BOARD.map((r) => ({ ...r })),
      hist: [...DEFAULT_VN_HIST],
      trading: true,
    },
    crypto: DEFAULT_CRYPTO.map((c) => ({ ...c, h: [...(c.h || [])] })),
    macro: DEFAULT_MACRO.map((m) => ({ ...m, h: [...(m.h || [])] })),
    us: DEFAULT_US.map((u) => ({ ...u, h: [...(u.h || [])] })),
  }
  tickOffset = 0
  flashMap: Map<string, { up: boolean; until: number }> = new Map()
  private binanceWs: WebSocket | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private liveTickTimer: ReturnType<typeof setInterval> | null = null
  private disposed = false

  constructor() {
    const setupTex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.generateMipmaps = false
      t.minFilter = THREE.LinearFilter
      t.magFilter = THREE.LinearFilter
      return t
    }

    this.mainCanvas = document.createElement("canvas")
    this.mainCanvas.width = 1280
    this.mainCanvas.height = 720
    this.mainTex = setupTex(this.mainCanvas)

    this.cryptoCanvas = document.createElement("canvas")
    this.cryptoCanvas.width = 640
    this.cryptoCanvas.height = 400
    this.cryptoTex = setupTex(this.cryptoCanvas)

    this.macroCanvas = document.createElement("canvas")
    this.macroCanvas.width = 560
    this.macroCanvas.height = 360
    this.macroTex = setupTex(this.macroCanvas)

    this.usCanvas = document.createElement("canvas")
    this.usCanvas.width = 560
    this.usCanvas.height = 360
    this.usTex = setupTex(this.usCanvas)

    this.renderAll()
    this.startLiveFeeds()
  }

  startLiveFeeds() {
    // 1. Gọi ngay Serverless API (/api/island-feeds) trên Vercel để cập nhật 4 bảng điện thực tế
    const fetchFeeds = async () => {
      if (this.disposed) return
      try {
        const res = await fetch("/api/island-feeds", { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          if (json && !this.disposed) {
            this.updateData(json)
          }
        }
      } catch {}
    }
    fetchFeeds()
    this.pollTimer = setInterval(fetchFeeds, 15000)

    // 2. Kết nối trực tiếp Binance WebSocket (ưu tiên data-stream.binance.vision không bị chặn vùng trên Vercel)
    const connectWs = (url: string, isFallback = false) => {
      if (this.disposed) return
      try {
        const ws = new WebSocket(url)
        this.binanceWs = ws
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            const d = msg?.data
            if (!d || !d.s) return
            const close = parseFloat(d.c)
            const open = parseFloat(d.o)
            const pct = open > 0 ? ((close - open) / open) * 100 : 0
            if (d.s === "PAXGUSDT") {
              const gold = this.data.macro?.find((m) => m.s.includes("VÀNG"))
              if (gold && close > 0) {
                this.flashMap.set("VÀNG XAU", { up: close >= gold.p, until: Date.now() + 900 })
                gold.p = Number(close.toFixed(2))
                gold.c = Number(pct.toFixed(2))
                if (!gold.h) gold.h = []
                gold.h.push(gold.p)
                if (gold.h.length > 50) gold.h.shift()
              }
              return
            }
            const sym = d.s.replace("USDT", "")
            const item = this.data.crypto?.find((c) => c.s === sym)
            if (item && close > 0) {
              this.flashMap.set(sym, { up: close >= item.p, until: Date.now() + 900 })
              item.p = close
              item.c = Number(pct.toFixed(2))
              if (!item.h) item.h = []
              item.h.push(close)
              if (item.h.length > 50) item.h.shift()
            }
          } catch {}
        }
        ws.onerror = () => {
          if (!isFallback && !this.disposed) {
            try {
              ws.close()
            } catch {}
            connectWs(
              "wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solusdt@miniTicker/bnbusdt@miniTicker/paxgusdt@miniTicker",
              true
            )
          }
        }
      } catch {}
    }
    connectWs(
      "wss://data-stream.binance.vision/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solusdt@miniTicker/bnbusdt@miniTicker/paxgusdt@miniTicker"
    )

    // 3. Nhịp khớp lệnh trực tiếp mỗi 1.2 giây trên các màn hình LED
    // LƯU Ý: Bảng điện VN100 & VN-Index CHỈ nhảy giá trong giờ giao dịch Việt Nam (09:00-11:30 & 13:00-15:00 T2-T6).
    // Hết giờ giao dịch ở VN thì bảng điện VN100 ngưng nhảy hoàn toàn, giữ nguyên giá đóng cửa!
    this.liveTickTimer = setInterval(() => {
      if (this.disposed) return
      const now = Date.now()
      const vnStatus = getVnMarketStatus()

      if (vnStatus.isOpen) {
        const board = this.data.vn?.board
        if (board && board.length > 0) {
          // Mỗi nhịp khớp ngẫu nhiên 3–4 mã cổ phiếu trên bảng VN100 khi đang trong phiên
          for (let k = 0; k < 4; k++) {
            const idx = Math.floor(Math.random() * Math.min(board.length, 24))
            const row = board[idx]
            if (!row) continue
            const step = (Math.random() > 0.48 ? 1 : -1) * 50
            const refPrice = row.p - row.c
            const nextP = Math.max(1000, row.p + step)
            const nextC = nextP - refPrice
            const nextPc = refPrice > 0 ? Number(((nextC / refPrice) * 100).toFixed(2)) : row.pc
            if (Math.abs(nextPc) <= 6.95) {
              this.flashMap.set(row.s, { up: step > 0, until: now + 950 })
              row.p = nextP
              row.c = nextC
              row.pc = nextPc
              row.v = (row.v || 0) + Math.floor(Math.random() * 18 + 1) * 100
            }
          }
        }
        const indices = this.data.vn?.indices
        if (indices?.VNINDEX) {
          const dVni = Number(((Math.random() - 0.485) * 0.35).toFixed(2))
          const vni = indices.VNINDEX
          const ref = vni.value - vni.change
          vni.value = Number((vni.value + dVni).toFixed(2))
          vni.change = Number((vni.value - ref).toFixed(2))
          vni.pct_change = ref > 0 ? Number(((vni.change / ref) * 100).toFixed(2)) : vni.pct_change
          if (this.data.vn?.hist && this.data.vn.hist.length > 0) {
            this.data.vn.hist[this.data.vn.hist.length - 1] = vni.value
          }
        }
      }

      // Nhịp biến động nhẹ cho Vàng/Dầu & US Stocks (thị trường quốc tế 24/5) giữa các kỳ lấy Yahoo Finance
      for (const group of [this.data.macro, this.data.us]) {
        if (!group) continue
        const pick = group[Math.floor(Math.random() * group.length)]
        if (pick) {
          const pctDelta = (Math.random() - 0.49) * 0.0008
          const nextP = Number((pick.p * (1 + pctDelta)).toFixed(2))
          this.flashMap.set(pick.s, { up: nextP >= pick.p, until: now + 900 })
          pick.p = nextP
          pick.c = Number((pick.c + pctDelta * 100).toFixed(2))
          if (pick.h && pick.h.length > 0) {
            pick.h[pick.h.length - 1] = nextP
          }
        }
      }
      this.renderAll()
    }, 1200)
  }

  dispose() {
    this.disposed = true
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.liveTickTimer) clearInterval(this.liveTickTimer)
    if (this.binanceWs) {
      try {
        this.binanceWs.close()
      } catch {}
    }
    this.mainTex.dispose()
    this.cryptoTex.dispose()
    this.macroTex.dispose()
    this.usTex.dispose()
  }

  updateData(scr: IslandScreensData) {
    if (scr.vn) {
      this.data.vn = {
        indices:
          scr.vn.indices && Object.keys(scr.vn.indices).length > 0
            ? scr.vn.indices
            : this.data.vn?.indices || DEFAULT_VN_INDICES,
        board:
          scr.vn.board && scr.vn.board.length > 0
            ? scr.vn.board
            : this.data.vn?.board || DEFAULT_VN_BOARD,
        hist:
          scr.vn.hist && scr.vn.hist.length > 3
            ? scr.vn.hist
            : this.data.vn?.hist || DEFAULT_VN_HIST,
        trading: scr.vn.trading ?? true,
      }
    }
    if (scr.crypto && scr.crypto.length > 0) this.data.crypto = scr.crypto
    if (scr.macro && scr.macro.length > 0) this.data.macro = scr.macro
    if (scr.us && scr.us.length > 0) this.data.us = scr.us
    if (scr.ts) this.data.ts = scr.ts
    this.renderAll()
  }

  renderAll() {
    this.tickOffset++
    this.drawMainVN100()
    this.drawSideScreen(this.cryptoCanvas, this.cryptoTex, "CRYPTO REALTIME (BINANCE LIVE)", "#f59e0b", this.data.crypto?.length ? this.data.crypto : DEFAULT_CRYPTO)
    this.drawSideScreen(this.macroCanvas, this.macroTex, "VÀNG XAU & DẦU THÔ WTI", "#eab308", this.data.macro?.length ? this.data.macro : DEFAULT_MACRO)
    this.drawSideScreen(this.usCanvas, this.usTex, "CHỨNG KHOÁN MỸ (WALL STREET)", "#38bdf8", this.data.us?.length ? this.data.us : DEFAULT_US)
  }

  drawMainVN100() {
    const c = this.mainCanvas
    const ctx = c.getContext("2d")
    if (!ctx) return

    // Nền bảng điện VPS Dark Mode
    ctx.fillStyle = "#070b14"
    ctx.fillRect(0, 0, c.width, c.height)

    // Thanh Header trên cùng
    const hdrGrad = ctx.createLinearGradient(0, 0, c.width, 0)
    hdrGrad.addColorStop(0, "#0f172a")
    hdrGrad.addColorStop(0.5, "#1e3a8a")
    hdrGrad.addColorStop(1, "#0f172a")
    ctx.fillStyle = hdrGrad
    ctx.fillRect(0, 0, c.width, 58)

    ctx.fillStyle = "#fbbf24"
    ctx.font = "900 23px monospace"
    ctx.fillText("⚡ BẢNG GIÁ VN100 & VN-INDEX (CHUẨN VPS SMARTONE)", 20, 37)

    const vnStatus = getVnMarketStatus()
    const nowStr = new Date().toLocaleTimeString("vi-VN")
    ctx.fillStyle = vnStatus.color
    ctx.font = "bold 19px monospace"
    ctx.textAlign = "right"
    ctx.fillText(`${vnStatus.label} • ${nowStr}`, c.width - 20, 37)
    ctx.textAlign = "left"

    // 3 Hộp Chỉ số VN-INDEX, VN30, HNX-INDEX + Biểu đồ VN-Index (từ dữ liệu tĩnh BroStock Core)
    const indices =
      this.data.vn?.indices && Object.keys(this.data.vn.indices).length > 0
        ? this.data.vn.indices
        : DEFAULT_VN_INDICES
    const vni = indices["VNINDEX"] || DEFAULT_VN_INDICES.VNINDEX
    const vn30 = indices["VN30"] || DEFAULT_VN_INDICES.VN30
    const hnx = indices["HNXINDEX"] || DEFAULT_VN_INDICES.HNXINDEX

    const cards = [
      { name: "VN-INDEX", d: vni },
      { name: "VN30-INDEX", d: vn30 },
      { name: "HNX-INDEX", d: hnx },
    ]

    cards.forEach((card, i) => {
      const bx = 20 + i * 240
      const by = 68
      ctx.fillStyle = "#0f172a"
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 2
      ctx.fillRect(bx, by, 225, 115)
      ctx.strokeRect(bx, by, 225, 115)

      const col = vpsColor(card.d.pct_change)
      ctx.fillStyle = "#94a3b8"
      ctx.font = "bold 16px sans-serif"
      ctx.fillText(card.name, bx + 14, by + 28)

      ctx.fillStyle = col
      ctx.font = "900 30px monospace"
      ctx.fillText(card.d.value.toFixed(2), bx + 14, by + 68)

      const sign = card.d.change >= 0 ? "+" : ""
      ctx.font = "bold 17px monospace"
      ctx.fillText(
        `${sign}${card.d.change.toFixed(2)} (${sign}${card.d.pct_change.toFixed(2)}%)`,
        bx + 14,
        by + 98
      )
    })

    // Khung biểu đồ VN-Index bên phải phần chỉ số
    const cx = 745
    const cy = 68
    const cw = 515
    const ch = 115
    ctx.fillStyle = "#0f172a"
    ctx.strokeStyle = "#1e293b"
    ctx.fillRect(cx, cy, cw, ch)
    ctx.strokeRect(cx, cy, cw, ch)

    ctx.fillStyle = "#cbd5e1"
    ctx.font = "bold 14px monospace"
    ctx.fillText("BIỂU ĐỒ VN-INDEX (90 PHIÊN)", cx + 14, cy + 22)

    const hist =
      this.data.vn?.hist && this.data.vn.hist.length > 3
        ? this.data.vn.hist
        : DEFAULT_VN_HIST
    drawSparkline(ctx, hist, cx + 12, cy + 28, cw - 24, ch - 36, vpsColor(vni.pct_change))

    // Bảng giá Điện tử VN100 (Chia 2 cột lớn để nhìn cực rõ từ ghế khán đài)
    const board =
      this.data.vn?.board && this.data.vn.board.length > 0
        ? this.data.vn.board
        : DEFAULT_VN_BOARD

    const startY = 196
    const colW = 612
    const rowH = 38

    for (let colIdx = 0; colIdx < 2; colIdx++) {
      const ox = 20 + colIdx * (colW + 16)
      ctx.fillStyle = "#1e293b"
      ctx.fillRect(ox, startY, colW, 34)

      ctx.fillStyle = "#94a3b8"
      ctx.font = "bold 15px monospace"
      ctx.fillText("MÃ CK", ox + 14, startY + 23)
      ctx.fillText("GIÁ KHỚP", ox + 125, startY + 23)
      ctx.fillText("+/- (%)", ox + 255, startY + 23)
      ctx.fillText("KL (CP)", ox + 395, startY + 23)
      ctx.fillText("ĐIỂM AI", ox + 515, startY + 23)

      for (let r = 0; r < 12; r++) {
        const idx = (colIdx * 12 + r) % board.length
        const item = board[idx]
        if (!item) continue
        const ry = startY + 36 + r * rowH

        const flash = this.flashMap.get(item.s)
        const isFlashing = flash && flash.until > Date.now()
        ctx.fillStyle = isFlashing
          ? flash.up
            ? "#14532d"
            : "#7f1d1d"
          : r % 2 === 0
          ? "#0b1324"
          : "#0f172a"
        ctx.fillRect(ox, ry, colW, rowH - 2)

        const color = vpsColor(item.pc)
        ctx.fillStyle = color
        ctx.font = "900 20px monospace"
        ctx.fillText(item.s, ox + 14, ry + 26)

        ctx.font = "bold 20px monospace"
        ctx.fillText(fmtVnd(item.p), ox + 125, ry + 26)

        const sign = item.pc > 0 ? "+" : ""
        ctx.fillText(`${sign}${item.pc.toFixed(2)}%`, ox + 255, ry + 26)

        ctx.fillStyle = "#e2e8f0"
        ctx.font = "17px monospace"
        const volM = ((item.v || 0) / 1e6).toFixed(2) + "M"
        ctx.fillText(volM, ox + 395, ry + 26)

        const sc = item.sc || 0
        ctx.fillStyle = sc >= 25 ? "#22c55e" : sc <= -25 ? "#ef4444" : "#94a3b8"
        ctx.font = "bold 18px monospace"
        ctx.fillText((sc > 0 ? "+" : "") + sc, ox + 525, ry + 26)
      }
    }

    // Chân trang hướng dẫn
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, c.height - 32, c.width, 32)
    ctx.fillStyle = "#fbbf24"
    ctx.font = "bold 15px monospace"
    ctx.fillText(
      "🟣 TÍM TRẦN   🔵 XANH SÀN   🟢 TĂNG GIÁ   🔴 GIẢM GIÁ   🟡 THAM CHIẾU   |   BẤM 'E' ĐỂ NGỒI GHẾ • SANG TRÁI ĐỂ THỞ OXY",
      24,
      c.height - 11
    )

    this.mainTex.needsUpdate = true
  }

  drawSideScreen(
    canvas: HTMLCanvasElement,
    tex: THREE.CanvasTexture,
    title: string,
    accent: string,
    items: TickerItem[]
  ) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = "#090d16"
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = "#111827"
    ctx.fillRect(0, 0, w, 46)
    ctx.fillStyle = accent
    ctx.font = "900 19px monospace"
    ctx.fillText(`● ${title}`, 16, 30)

    const rowH = Math.floor((h - 56) / Math.max(items.length, 3))
    items.forEach((it, idx) => {
      const y = 52 + idx * rowH
      const flash = this.flashMap.get(it.s)
      const isFlashing = flash && flash.until > Date.now()
      ctx.fillStyle = isFlashing
        ? flash.up
          ? "#14532d"
          : "#7f1d1d"
        : idx % 2 === 0
        ? "#0f172a"
        : "#131c31"
      ctx.fillRect(12, y, w - 24, rowH - 6)

      const up = it.c >= 0
      const col = up ? "#22c55e" : "#ef4444"

      ctx.fillStyle = "#f8fafc"
      ctx.font = "900 22px monospace"
      ctx.fillText(it.s, 24, y + 32)

      const priceStr =
        it.p >= 1000
          ? it.p.toLocaleString("en-US", { maximumFractionDigits: 1 })
          : it.p.toFixed(2)
      ctx.fillStyle = col
      ctx.font = "900 23px monospace"
      ctx.fillText(priceStr, 24, y + 62)

      const pctStr = `${up ? "+" : ""}${it.c.toFixed(2)}%`
      ctx.font = "bold 17px monospace"
      ctx.fillText(pctStr, 175, y + 62)

      if (it.h && it.h.length > 1) {
        drawSparkline(ctx, it.h, w - 230, y + 10, 200, rowH - 22, col)
      }
    })

    tex.needsUpdate = true
  }
}
