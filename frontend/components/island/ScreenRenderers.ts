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

const DEFAULT_CRYPTO: TickerItem[] = [
  { s: "BTC", p: 94250, c: 2.84, h: [91800, 92200, 92900, 92600, 93400, 93900, 94250] },
  { s: "ETH", p: 3180, c: 1.95, h: [3110, 3125, 3140, 3130, 3160, 3175, 3180] },
  { s: "SOL", p: 212.4, c: 5.42, h: [201, 204, 206, 205, 208, 210, 212.4] },
  { s: "BNB", p: 654.2, c: -0.65, h: [659, 658, 656, 657, 655, 653, 654.2] },
]

const DEFAULT_MACRO: TickerItem[] = [
  { s: "VÀNG XAU", p: 2748.5, c: 0.82, h: [2720, 2728, 2735, 2731, 2740, 2745, 2748.5] },
  { s: "DẦU WTI", p: 71.45, c: -1.34, h: [72.6, 72.3, 72.0, 71.8, 71.9, 71.6, 71.45] },
  { s: "DXY INDEX", p: 104.12, c: 0.21, h: [103.8, 103.9, 104.0, 103.95, 104.05, 104.1, 104.12] },
]

const DEFAULT_US: TickerItem[] = [
  { s: "S&P 500", p: 5985.2, c: 0.94, h: [5920, 5935, 5950, 5945, 5968, 5975, 5985.2] },
  { s: "NASDAQ 100", p: 21140.8, c: 1.42, h: [20820, 20900, 20950, 21010, 21080, 21140.8] },
  { s: "DOW JONES", p: 43920.0, c: 0.56, h: [43680, 43720, 43790, 43810, 43880, 43920] },
  { s: "NVDA", p: 145.8, c: 3.65, h: [140.2, 141.5, 142.8, 143.1, 144.6, 145.8] },
  { s: "TSLA", p: 328.4, c: 4.18, h: [314.0, 318.5, 321.0, 324.2, 326.0, 328.4] },
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

export class ScreenSet {
  mainCanvas: HTMLCanvasElement
  mainTex: THREE.CanvasTexture
  cryptoCanvas: HTMLCanvasElement
  cryptoTex: THREE.CanvasTexture
  macroCanvas: HTMLCanvasElement
  macroTex: THREE.CanvasTexture
  usCanvas: HTMLCanvasElement
  usTex: THREE.CanvasTexture

  data: IslandScreensData = {}
  tickOffset = 0
  private binanceWs: WebSocket | null = null

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
  }

  dispose() {
    this.mainTex.dispose()
    this.cryptoTex.dispose()
    this.macroTex.dispose()
    this.usTex.dispose()
  }

  updateData(scr: IslandScreensData) {
    this.data = { ...this.data, ...scr }
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
    ctx.font = "900 24px monospace"
    ctx.fillText("⚡ BẢNG GIÁ VN100 & VN-INDEX REALTIME (CHUẨN VPS SMARTONE)", 20, 37)

    const nowStr = new Date().toLocaleTimeString("vi-VN")
    ctx.fillStyle = "#38bdf8"
    ctx.font = "bold 20px monospace"
    ctx.fillText(`LIVE ${nowStr} • FENWEALTH TERMINAL`, c.width - 410, 37)

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

        ctx.fillStyle = r % 2 === 0 ? "#0b1324" : "#0f172a"
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
      ctx.fillStyle = idx % 2 === 0 ? "#0f172a" : "#131c31"
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
