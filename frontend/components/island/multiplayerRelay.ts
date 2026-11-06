import { COLORS, OXY_BOX, SEAT_COLS, SEAT_ROWS, ST, seatPos } from "./world"
import type { PlayerEntity } from "./IslandScene"

const TOPIC = "brostock/island/v27"
const BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
]

function encStr(s: string): Uint8Array {
  const b = new TextEncoder().encode(s)
  const out = new Uint8Array(2 + b.length)
  out[0] = (b.length >> 8) & 0xff
  out[1] = b.length & 0xff
  out.set(b, 2)
  return out
}

function encLen(n: number): Uint8Array {
  const bytes: number[] = []
  do {
    let d = n % 128
    n = Math.floor(n / 128)
    if (n > 0) d |= 128
    bytes.push(d)
  } while (n > 0)
  return new Uint8Array(bytes)
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

function makePacket(type: number, body: Uint8Array): Uint8Array {
  return concatBytes(new Uint8Array([type]), encLen(body.length), body)
}

function makeConnectPacket(clientId: string): Uint8Array {
  const proto = encStr("MQTT")
  const flags = new Uint8Array([4, 2, 0, 50]) // MQTT 3.1.1, CleanSession, KeepAlive 50s
  const cid = encStr(clientId)
  return makePacket(0x10, concatBytes(proto, flags, cid))
}

function makeSubscribePacket(topic: string): Uint8Array {
  return makePacket(0x82, concatBytes(new Uint8Array([0, 1]), encStr(topic), new Uint8Array([0])))
}

function makePublishPacket(topic: string, jsonText: string): Uint8Array {
  const payload = new TextEncoder().encode(jsonText)
  return makePacket(0x30, concatBytes(encStr(topic), payload))
}

// Bộ sinh số giả ngẫu nhiên tất định (Deterministic PRNG) để mọi thiết bị (PC & Mobile) thấy cùng 1 đám đông Bot
function seededRand(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SHARED_BOT_NAMES = [
  "Hùng Đu Đỉnh", "Lan Bắt Đáy", "Tuấn Margin", "Mai Tích Sản", "Cá Mập Nhỏ",
  "Chứng Sĩ F0", "Bảo VN30", "Ngọc Lướt Sóng", "Long HPG", "Vy Về Bờ",
  "Khánh SSI", "Minh VCB", "Thảo FPT", "Đức TCB", "Hoàng MBB",
]

export const SHARED_BOT_COMMENTS = [
  "oxy gấp ad ơi 🏥", "HPG giữ được không ad?", "ngồi xem bảng điện",
  "tím lịm luôn 💜", "đu đỉnh rồi cứu", "VNINDEX lên 1800 không",
  "lãi rồi nhảy thôi 🕺", "full margin toang rồi", "FPT tích sản ngon",
]

export function populateDeterministicBots(playersMap: Map<string, PlayerEntity>, count = 45) {
  const usedSeats = new Set<number>()
  for (let i = 1; i <= count; i++) {
    const id = `bot_shared_${i}`
    if (playersMap.has(id)) continue
    const rng = seededRand(i * 9973 + 2026)
    const baseName = SHARED_BOT_NAMES[i % SHARED_BOT_NAMES.length]
    const roll = rng()
    let tx = (rng() - 0.5) * 44
    let tz = 10 + rng() * 24
    let s: number = ST.IDLE
    let r = 0

    if (roll < 0.48) {
      let seatIdx = Math.floor(rng() * (SEAT_ROWS * SEAT_COLS))
      while (usedSeats.has(seatIdx)) {
        seatIdx = (seatIdx + 7) % (SEAT_ROWS * SEAT_COLS)
      }
      usedSeats.add(seatIdx)
      const sp = seatPos(seatIdx)
      tx = sp.x
      tz = sp.z
      s = ST.SIT
      r = Math.PI
    } else if (roll < 0.72) {
      tx = OXY_BOX[0] + 1.5 + rng() * (OXY_BOX[1] - OXY_BOX[0] - 3)
      tz = OXY_BOX[2] + 1.5 + rng() * (OXY_BOX[3] - OXY_BOX[2] - 3)
      s = ST.OXY
    } else if (roll < 0.88) {
      tx = (rng() - 0.5) * 24
      tz = -34 + rng() * 10
      s = ST.DANCE
    }

    playersMap.set(id, {
      id,
      n: `@${baseName.replace(/\s+/g, "")}${10 + i}`,
      src: "tiktok",
      c: COLORS[i % COLORS.length],
      h: i % 4,
      v: i % 5 === 0 ? 2 : 0,
      x: tx,
      z: tz,
      tx,
      tz,
      r,
      s,
    })
  }
}

export interface RelayCallbacks {
  onRemoteMessage: (msg: any) => void
  getLocalPlayer: () => PlayerEntity | null
}

export class GlobalIslandRelay {
  private ws: WebSocket | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private disposed = false
  private brokerIdx = 0
  private clientId = `bs_${Math.random().toString(36).slice(2, 10)}`
  private cb: RelayCallbacks

  constructor(cb: RelayCallbacks) {
    this.cb = cb
    this.connect()
  }

  private connect() {
    if (this.disposed) return
    const url = BROKERS[this.brokerIdx % BROKERS.length]
    try {
      const ws = new WebSocket(url, "mqtt")
      ws.binaryType = "arraybuffer"
      this.ws = ws

      ws.onopen = () => {
        if (this.disposed) return
        ws.send(makeConnectPacket(this.clientId))
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(makeSubscribePacket(TOPIC))
            // Hỏi danh sách người chơi đang online trên các thiết bị khác (PC / Mobile)
            this.publish({ k: "hello", cid: this.clientId })
            const me = this.cb.getLocalPlayer()
            if (me) {
              this.publishPlayerState(me)
            }
          }
        }, 180)
      }

      ws.onmessage = (ev) => {
        try {
          const u = new Uint8Array(ev.data)
          if ((u[0] & 0xf0) === 0x30) {
            let i = 1
            let mult = 1
            let remLen = 0
            do {
              remLen += (u[i] & 127) * mult
              mult *= 128
            } while (u[i++] & 128)
            const topicLen = (u[i] << 8) | u[i + 1]
            const start = i + 2 + topicLen
            const end = Math.min(u.length, i + remLen)
            const text = new TextDecoder().decode(u.slice(start, end))
            const msg = JSON.parse(text)
            if (msg.cid === this.clientId) return
            if (msg.k === "hello") {
              // Có người chơi mới vào trên thiết bị khác -> gửi ngay vị trí của mình cho họ
              const me = this.cb.getLocalPlayer()
              if (me) this.publishPlayerState(me)
              return
            }
            this.cb.onRemoteMessage(msg)
          }
        } catch {}
      }

      ws.onerror = () => {
        this.brokerIdx++
      }

      ws.onclose = () => {
        if (!this.disposed) {
          setTimeout(() => this.connect(), 2500)
        }
      }

      if (this.pingTimer) clearInterval(this.pingTimer)
      this.pingTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(new Uint8Array([0xc0, 0x00]))
        }
      }, 22000)
    } catch {}
  }

  publish(obj: Record<string, any>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    try {
      const text = JSON.stringify({ ...obj, cid: this.clientId })
      this.ws.send(makePublishPacket(TOPIC, text))
    } catch {}
  }

  publishPlayerState(p: PlayerEntity) {
    this.publish({
      k: "p",
      p: {
        id: p.id,
        n: p.n,
        c: p.c,
        h: p.h,
        v: p.v,
        x: Math.round(p.x * 10) / 10,
        z: Math.round(p.z * 10) / 10,
        r: Math.round(p.r * 100) / 100,
        s: p.s,
      },
    })
  }

  dispose() {
    this.disposed = true
    if (this.pingTimer) clearInterval(this.pingTimer)
    if (this.ws) {
      try {
        this.ws.close()
      } catch {}
    }
  }
}
