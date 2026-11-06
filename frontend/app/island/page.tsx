"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  Users,
  Radio,
  Sparkles,
  Send,
  Video,
  Heart,
  Gift,
  Activity,
  ExternalLink,
  Armchair,
  Eye,
} from "lucide-react"
import { COLORS, HATS, OXY_BOX, QUICK_CHATS, SEAT_COLS, SEAT_ROWS, ST, seatPos } from "@/components/island/world"
import type { CameraMode, PlayerEntity } from "@/components/island/IslandScene"
import type { IslandScreensData } from "@/components/island/ScreenRenderers"

const IslandScene = dynamic(() => import("@/components/island/IslandScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-cyan-300 font-bold">
      🏝️ Đang dựng Thế Giới 3D Đảo Chứng Sĩ (Three.js Low-Poly)...
    </div>
  ),
})

export default function IslandPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const playersRef = useRef<Map<string, PlayerEntity>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)

  const [myId, setMyId] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [nickname, setNickname] = useState("")
  const [color, setColor] = useState(COLORS[3])
  const [hat, setHat] = useState(1)

  const [cameraMode, setCameraMode] = useState<CameraMode>("follow")
  const [screensData, setScreensData] = useState<IslandScreensData>({})
  const [stats, setStats] = useState({
    n: 0,
    w: 0,
    tt: 0,
    max: 350,
    live: { u: null as string | null, s: "disconnected" },
  })

  const [tiktokInput, setTiktokInput] = useState("")
  const [showTiktokPanel, setShowTiktokPanel] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [bannerAlert, setBannerAlert] = useState<string | null>(null)
  const [inOxyBooth, setInOxyBooth] = useState(false)
  const [seatedIdx, setSeatedIdx] = useState(-1)

  const triggerBanner = useCallback((msg: string) => {
    setBannerAlert(msg)
    setTimeout(() => setBannerAlert(null), 4500)
  }, [])

  const updateStatsIfChanged = useCallback((next: any) => {
    if (!next || typeof next.n !== "number") return
    setStats((prev) => {
      if (
        prev.n === next.n &&
        prev.w === next.w &&
        prev.tt === next.tt &&
        prev.live?.s === next.live?.s &&
        prev.live?.u === next.live?.u
      ) {
        return prev
      }
      return next
    })
  }, [])

  const handleLocalStatusChange = useCallback((inOxy: boolean, seat: number) => {
    setInOxyBooth((prev) => (prev === inOxy ? prev : inOxy))
    setSeatedIdx((prev) => (prev === seat ? prev : seat))
  }, [])

  // Kết nối WebSocket tới /ws/island
  useEffect(() => {
    const wsUrl = API_URL.replace(/^http/, "ws") + "/ws/island"
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      if (disposed) return
      try {
        ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            const now = performance.now()
            if (msg.t === "w") {
              playersRef.current.clear()
              const metas: Record<string, any> = {}
              for (const m of msg.m || []) metas[m.id] = m
              for (const row of msg.p || []) {
                const [id, x, z, r, s] = row
                const m = metas[id] || { id, n: id, src: "tiktok", c: "#38bdf8", h: 0, v: 0 }
                playersRef.current.set(id, {
                  ...m,
                  x,
                  z,
                  tx: x,
                  tz: z,
                  r,
                  s,
                })
              }
              if (msg.scr) setScreensData(msg.scr)
              if (msg.st) updateStatsIfChanged(msg.st)
            } else if (msg.t === "you") {
              setMyId(msg.id)
              setJoined(true)
            } else if (msg.t === "scr" && msg.d) {
              setScreensData(msg.d)
            } else if (msg.t === "d") {
              if (msg.m) {
                for (const m of msg.m) {
                  const ex = playersRef.current.get(m.id)
                  if (ex) Object.assign(ex, m)
                  else
                    playersRef.current.set(m.id, {
                      ...m,
                      x: 0,
                      z: 20,
                      tx: 0,
                      tz: 20,
                      r: 0,
                      s: 0,
                    })
                }
              }
              if (msg.p) {
                for (const [id, x, z, r, s] of msg.p) {
                  const ex = playersRef.current.get(id)
                  if (ex) {
                    ex.tx = x
                    ex.tz = z
                    ex.r = r
                    ex.s = s
                  }
                }
              }
              if (msg.x) {
                for (const id of msg.x) playersRef.current.delete(id)
              }
              if (msg.e) {
                for (const e of msg.e) {
                  const p = playersRef.current.get(e.id)
                  if (!p) continue
                  if (e.k === "chat") {
                    p.chat = e.m
                    p.chatUntil = now + 5500
                  } else if (e.k === "like") {
                    p.chat = `❤️ x${e.n || 1}`
                    p.chatUntil = now + 3000
                    p.fxUntil = now + 2500
                  } else if (e.k === "gift") {
                    p.chat = `🎁 Tặng ${e.g} (+${e.d}💎)`
                    p.chatUntil = now + 7000
                    p.fxUntil = now + 6000
                    triggerBanner(`🦈 VIP TIKTOK: ${p.n} vừa tặng ${e.g} (${e.d}💎) tại Sân Vận Động!`)
                  } else if (e.k === "oxy") {
                    triggerBanner(`🏥 CẤP CỨU ĐU ĐỈNH: ${p.n} đang chạy vào Trạm Thở Oxy!`)
                  }
                }
              }
              if (msg.st) updateStatsIfChanged(msg.st)
            }
          } catch {}
        }

        ws.onclose = () => {
          if (!disposed) {
            reconnectTimer = setTimeout(connect, 3000)
          }
        }
      } catch {}
    }

    connect()

    // Fallback Crowd & Bot Engine trên Vercel (khi chạy Serverless không có WebSocket daemon)
    const botNames = [
      "Hùng Đu Đỉnh", "Lan Bắt Đáy", "Tuấn Margin", "Mai Tích Sản", "Cá Mập Nhỏ",
      "Chứng Sĩ F0", "Bảo VN30", "Ngọc Lướt Sóng", "Long HPG", "Vy Về Bờ",
      "Khánh SSI", "Minh VCB", "Thảo FPT", "Đức TCB", "Hoàng MBB",
    ]
    const botComments = [
      "oxy gấp ad ơi 🏥", "HPG giữ được không ad?", "ngồi xem bảng điện",
      "tím lịm luôn 💜", "đu đỉnh rồi cứu", "VNINDEX lên 1800 không",
      "lãi rồi nhảy thôi 🕺", "full margin toang rồi", "FPT tích sản ngon",
    ]

    const spawnClientBots = (count: number, forceMode?: "oxy" | "comment" | "like" | "gift") => {
      const now = performance.now()
      for (let i = 0; i < count; i++) {
        if (playersRef.current.size >= 350 && !forceMode) break
        const baseName = botNames[Math.floor(Math.random() * botNames.length)]
        const id =
          forceMode && playersRef.current.size > 10
            ? Array.from(playersRef.current.keys()).filter((k) => k.startsWith("bot_"))[
                Math.floor(Math.random() * Math.max(1, playersRef.current.size - 1))
              ] || `bot_${Math.floor(Math.random() * 900 + 100)}`
            : `bot_${playersRef.current.size + 1}_${Math.floor(Math.random() * 99)}`

        let p = playersRef.current.get(id)
        if (!p) {
          const roll = Math.random()
          let tx = (Math.random() - 0.5) * 44
          let tz = 10 + Math.random() * 24
          let s: number = ST.IDLE
          let r = 0
          if (roll < 0.45) {
            const seatIdx = Math.floor(Math.random() * (SEAT_ROWS * SEAT_COLS))
            const sp = seatPos(seatIdx)
            tx = sp.x
            tz = sp.z
            s = ST.SIT
            r = Math.PI
          } else if (roll < 0.68) {
            tx = OXY_BOX[0] + 1.5 + Math.random() * (OXY_BOX[1] - OXY_BOX[0] - 3)
            tz = OXY_BOX[2] + 1.5 + Math.random() * (OXY_BOX[3] - OXY_BOX[2] - 3)
            s = ST.OXY
          } else if (roll < 0.85) {
            tx = (Math.random() - 0.5) * 24
            tz = -34 + Math.random() * 10
            s = ST.DANCE
          }
          p = {
            id,
            n: `@${baseName.replace(/\s+/g, "")}${Math.floor(Math.random() * 90 + 10)}`,
            src: "tiktok",
            c: COLORS[Math.floor(Math.random() * COLORS.length)],
            h: Math.floor(Math.random() * 4),
            v: Math.random() > 0.8 ? 2 : 0,
            x: tx,
            z: tz,
            tx,
            tz,
            r,
            s,
          }
          playersRef.current.set(id, p)
        }

        if (forceMode === "oxy") {
          p.tx = OXY_BOX[0] + 1.5 + Math.random() * (OXY_BOX[1] - OXY_BOX[0] - 3)
          p.tz = OXY_BOX[2] + 1.5 + Math.random() * (OXY_BOX[3] - OXY_BOX[2] - 3)
          p.s = ST.OXY
          p.chat = "Cứu em thở Oxy gấp 🏥😭"
          p.chatUntil = now + 5500
          triggerBanner(`🏥 CẤP CỨU ĐU ĐỈNH: ${p.n} đang chạy vào Trạm Thở Oxy!`)
        } else if (forceMode === "comment") {
          p.chat = botComments[Math.floor(Math.random() * botComments.length)]
          p.chatUntil = now + 5500
        } else if (forceMode === "like") {
          p.chat = `❤️ x${Math.floor(Math.random() * 15 + 1)}`
          p.chatUntil = now + 3500
          p.fxUntil = now + 2500
        } else if (forceMode === "gift") {
          p.v = 3
          p.s = ST.DANCE
          p.chat = `🎁 Tặng Cá Mập Vàng (+1000💎)`
          p.chatUntil = now + 7000
          p.fxUntil = now + 6000
          triggerBanner(`🦈 VIP TIKTOK: ${p.n} vừa tặng Cá Mập Vàng (1000💎) tại Sân Vận Động!`)
        }
      }

      const all = Array.from(playersRef.current.values())
      const webCount = all.filter((x) => x.src === "web").length
      updateStatsIfChanged({
        n: all.length,
        w: webCount,
        tt: all.length - webCount,
        max: 350,
        live: { u: null, s: "live-sim" },
      })
    }

    const fallbackTimer = setTimeout(() => {
      if (playersRef.current.size === 0) {
        spawnClientBots(46)
        spawnClientBots(4, "comment")
      }
    }, 1200)

    const botStepInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
      if (playersRef.current.size === 0) return
      const now = performance.now()
      const bots = Array.from(playersRef.current.values()).filter((p) => p.src === "tiktok")
      for (let i = 0; i < Math.min(3, bots.length); i++) {
        const b = bots[Math.floor(Math.random() * bots.length)]
        if (!b) continue
        if (Math.random() < 0.25) {
          b.chat = botComments[Math.floor(Math.random() * botComments.length)]
          b.chatUntil = now + 5000
        }
        if (b.s !== ST.SIT && Math.random() < 0.35) {
          if (b.s === ST.OXY) {
            b.tx = OXY_BOX[0] + 1.5 + Math.random() * (OXY_BOX[1] - OXY_BOX[0] - 3)
            b.tz = OXY_BOX[2] + 1.5 + Math.random() * (OXY_BOX[3] - OXY_BOX[2] - 3)
          } else {
            b.tx = (Math.random() - 0.5) * 36
            b.tz = -32 + Math.random() * 55
          }
        }
      }
    }, 2800)

    ;(window as any).__spawnIslandBots = spawnClientBots

    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      clearTimeout(fallbackTimer)
      clearInterval(botStepInterval)
      if (ws) ws.close()
    }
  }, [API_URL, triggerBanner, updateStatsIfChanged])

  const handleJoinWorld = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = nickname.trim() || `ChứngSĩ_${Math.floor(Math.random() * 900 + 100)}`
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ t: "join", n: cleanName, c: color, h: hat })
      )
    } else {
      // Fallback local mode nếu backend đang khởi động
      const localId = "local_me"
      playersRef.current.set(localId, {
        id: localId,
        n: cleanName,
        src: "web",
        c: color,
        h: hat,
        v: 1,
        x: 0,
        z: 16,
        tx: 0,
        tz: 16,
        r: 0,
        s: ST.IDLE,
      })
      setMyId(localId)
      setJoined(true)
      const all = Array.from(playersRef.current.values())
      const webCount = all.filter((x) => x.src === "web").length
      updateStatsIfChanged({
        n: all.length,
        w: webCount,
        tt: all.length - webCount,
        max: 350,
        live: { u: null, s: "live-sim" },
      })
    }
  }

  const lastSentMoveRef = useRef<string>("")
  const sendMove = useCallback((x: number, z: number, r: number, s: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        t: "mv",
        x: Math.round(x * 10) / 10,
        z: Math.round(z * 10) / 10,
        r: Math.round(r * 100) / 100,
        s,
      })
      if (payload !== lastSentMoveRef.current) {
        lastSentMoveRef.current = payload
        wsRef.current.send(payload)
      }
    }
  }, [])

  const sendChat = (text: string) => {
    const msg = text.trim()
    if (!msg) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ t: "chat", m: msg }))
    }
    if (myId) {
      const me = playersRef.current.get(myId)
      if (me) {
        me.chat = msg
        me.chatUntil = performance.now() + 5500
      }
    }
    setChatInput("")
  }

  const goToOxyBooth = () => {
    if (!myId) return
    const me = playersRef.current.get(myId)
    if (!me) return
    me.x = (OXY_BOX[0] + OXY_BOX[1]) / 2
    me.z = (OXY_BOX[2] + OXY_BOX[3]) / 2
    me.tx = me.x
    me.tz = me.z
    me.s = ST.OXY
    me.chat = "Cho tôi thở Oxy gấp 🏥😭"
    me.chatUntil = performance.now() + 6000
    sendMove(me.x, me.z, me.r, ST.OXY)
    setCameraMode("follow")
  }

  const connectTikTokLive = async () => {
    if (!tiktokInput.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/island/tiktok/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: tiktokInput.trim() }),
      })
      const d = await res.json()
      if (d.ok) {
        triggerBanner(`🎵 Đang kết nối TikTok Live @${d.user} — Người xem comment/tặng quà sẽ tự động có nhân vật!`)
      } else {
        triggerBanner(`⚠️ ${d.error || "Không kết nối được TikTok Live"}`)
      }
    } catch {
      triggerBanner("⚠️ Không thể gọi API TikTok Live")
    }
  }

  const simulateTikTok = async (kind: string, n = 1) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const res = await fetch(`${API_URL}/api/island/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, n }),
        })
        const st = await res.json()
        if (st && typeof st.n === "number") {
          setStats(st)
          return
        }
      } catch {}
    }
    const fn = (window as any).__spawnIslandBots
    if (typeof fn === "function") {
      if (kind === "crowd") fn(n)
      else fn(n, kind)
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden select-none">
      {/* Canvas 3D Three.js */}
      <IslandScene
        playersRef={playersRef}
        myId={myId}
        cameraMode={cameraMode}
        screensData={screensData}
        onSendMove={sendMove}
        onLocalStatusChange={handleLocalStatusChange}
      />

      {/* Top HUD: Trạng thái Server 300+ CCU & Nút chức năng */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/40 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-black text-amber-300">
              <Users size={15} />
              <span>
                {stats.n} / {stats.max} CHỨNG SĨ
              </span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-300 font-bold">Web: {stats.w}</span>
            <span className="text-pink-400 font-bold">TikTok Live: {stats.tt}</span>
          </div>

          <a
            href="https://banggia.vps.com.vn/chung-khoan/VN100"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-900/90 hover:bg-blue-800 border border-blue-400/40 text-cyan-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <span>Bảng Giá VPS VN100 Gốc</span>
            <ExternalLink size={13} />
          </a>

          <button
            onClick={() => setShowTiktokPanel(!showTiktokPanel)}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition"
          >
            <Radio size={14} className="animate-pulse" />
            <span>TikTok Live & Tạo Đám Đông ({stats.live?.s || "off"})</span>
          </button>
        </div>

        {/* Bộ chuyển góc nhìn Camera */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1 rounded-xl pointer-events-auto text-xs">
          {[
            { id: "follow", label: "🎥 Theo Nhân Vật" },
            { id: "cinema", label: "📺 Cận Cảnh Màn Hình VN100" },
            { id: "oxy", label: "🏥 Trạm Thở Oxy" },
            { id: "drone", label: "🚁 Toàn Cảnh Đảo" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCameraMode(c.id as CameraMode)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                cameraMode === c.id
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thông báo Sự kiện VIP / Cấp Cứu Oxy */}
      {bannerAlert && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs md:text-sm px-5 py-2.5 rounded-full shadow-2xl border border-white/30 animate-bounce">
          {bannerAlert}
        </div>
      )}

      {/* Trạng thái nhân vật khi đang ngồi ghế hoặc đang thở Oxy */}
      {joined && (inOxyBooth || seatedIdx >= 0) && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-lg">
          {inOxyBooth ? (
            <>
              <Activity size={15} className="text-cyan-400 animate-spin" />
              <span>🏥 Đang đeo Mặt Nạ Thở Oxy hồi sức đu đỉnh! (Bấm WASD để bước ra)</span>
            </>
          ) : (
            <>
              <Armchair size={15} className="text-amber-400" />
              <span>💺 Đang ngồi ghế #{seatedIdx + 1}/200 xem bảng giá VN100 (Bấm phím E hoặc WASD để đứng dậy)</span>
            </>
          )}
        </div>
      )}

      {/* Bảng Điều Khiển TikTok Live & Giả lập 300 CCU */}
      {showTiktokPanel && (
        <div className="absolute top-16 left-3 z-30 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 text-white shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-black text-sm text-pink-400 flex items-center gap-1.5">
              <Video size={16} />
              KẾT NỐI TIKTOK LIVE TỰ ĐỘNG
            </h3>
            <button
              onClick={() => setShowTiktokPanel(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng ✕
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-300 font-bold block">
              Nhập @username kênh TikTok đang phát Live:
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tiktokInput}
                onChange={(e) => setTiktokInput(e.target.value)}
                placeholder="@ten_kenh_tiktok"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={connectTikTokLive}
                className="bg-pink-600 hover:bg-pink-500 px-3 py-1.5 rounded-lg text-xs font-black"
              >
                Kết nối
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Khán giả comment <code className="text-cyan-300">&quot;oxy&quot;</code>,{" "}
              <code className="text-cyan-300">&quot;lỗ&quot;</code> sẽ tự chạy vào Trạm Thở Oxy; comment{" "}
              <code className="text-amber-300">&quot;ngồi&quot;</code> sẽ ra ghế ngồi; tặng Gift sẽ hóa VIP!
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-black text-amber-300 uppercase">
              ⚡ Bộ Giả Lập Tương Tác TikTok Live (Test Ngay):
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => simulateTikTok("crowd", 50)}
                className="bg-blue-700 hover:bg-blue-600 py-2 px-2.5 rounded-lg font-bold text-left flex items-center gap-1.5"
              >
                <Users size={13} /> +50 Khán giả vào Đảo
              </button>
              <button
                onClick={() => simulateTikTok("oxy", 8)}
                className="bg-cyan-700 hover:bg-cyan-600 py-2 px-2.5 rounded-lg font-bold text-left flex items-center gap-1.5"
              >
                <Activity size={13} /> 8 Người gõ &quot;Thở Oxy&quot;
              </button>
              <button
                onClick={() => simulateTikTok("comment", 10)}
                className="bg-emerald-700 hover:bg-emerald-600 py-2 px-2.5 rounded-lg font-bold text-left flex items-center gap-1.5"
              >
                <Sparkles size={13} /> 10 Comment bàn chứng
              </button>
              <button
                onClick={() => simulateTikTok("gift", 3)}
                className="bg-amber-600 hover:bg-amber-500 py-2 px-2.5 rounded-lg font-bold text-left flex items-center gap-1.5"
              >
                <Gift size={13} /> Tặng Quà Cá Mập 🦈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng Nhập Nickname (hoặc xem tự do) */}
      {!joined && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4">
          <form
            onSubmit={handleJoinWorld}
            className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-2xl p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black">
                🏝️ BROSTOCK ISLAND MMO • 300+ CCU
              </span>
              <button
                type="button"
                onClick={() => setJoined(true)}
                className="text-xs text-cyan-300 hover:underline flex items-center gap-1"
              >
                <Eye size={13} /> Chế độ Quan sát
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-wide">
                Vào Đảo Chứng Sĩ 3D
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Nhập Nickname để nhận nhân vật 3D đi dạo xem bảng điện VN100, ngồi ghế khán đài hoặc vào Trạm Thở Oxy!
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nickname của bạn:
              </label>
              <input
                type="text"
                maxLength={16}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="VD: Hùng Full Margin..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Màu áo nhân vật:
              </label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition transform ${
                      color === c ? "border-white scale-110" : "border-transparent opacity-75"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Phụ kiện đầu:
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {HATS.map((hName, idx) => (
                  <button
                    type="button"
                    key={hName}
                    onClick={() => setHat(idx)}
                    className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                      hat === idx
                        ? "bg-blue-600 border-blue-400 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    {hName}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg transition"
            >
              🚀 Vào Sân Vận Động Ngay
            </button>
          </form>
        </div>
      )}

      {/* Thanh công cụ dưới cùng: Chat, Biểu cảm nhanh, Đi tới Trạm Oxy */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-col md:flex-row items-center justify-between gap-2 z-20 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <button
            onClick={goToOxyBooth}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 border border-cyan-300/40"
          >
            <Activity size={14} />
            <span>🏥 Vào Trạm Thở Oxy</span>
          </button>

          {QUICK_CHATS.map((q) => (
            <button
              key={q}
              onClick={() => sendChat(q)}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendChat(chatInput)
          }}
          className="flex items-center gap-1.5 w-full md:w-80 pointer-events-auto"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Chat trên đầu nhân vật (Enter)..."
            className="flex-1 bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 p-2 rounded-xl font-black"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}
