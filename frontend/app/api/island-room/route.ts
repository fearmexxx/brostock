import { NextRequest, NextResponse } from "next/server"

interface RoomPlayer {
  id: string
  n: string
  src: string
  c: string
  h: number
  v: number
  x: number
  z: number
  r: number
  s: number
  chat?: string
  chatTs?: number
  fx?: string
  fxTs?: number
  updatedAt: number
}

interface RoomState {
  players: Map<string, RoomPlayer>
  version: number
}

const g = globalThis as unknown as { __BROSTOCK_ISLAND_ROOM__?: RoomState }
if (!g.__BROSTOCK_ISLAND_ROOM__) {
  g.__BROSTOCK_ISLAND_ROOM__ = { players: new Map(), version: Date.now() }
}

function prune(room: RoomState, now: number) {
  for (const [id, p] of room.players.entries()) {
    if (now - p.updatedAt > 35000) {
      room.players.delete(id)
      room.version = now
    }
  }
}

export async function GET(req: NextRequest) {
  const room = g.__BROSTOCK_ISLAND_ROOM__!
  const now = Date.now()
  prune(room, now)
  const since = Number(req.nextUrl.searchParams.get("since") || 0)
  if (since > 0 && room.version <= since) {
    // Không có thay đổi kể từ lần đồng bộ trước -> trả gói siêu gọn 24 bytes
    return NextResponse.json(
      { u: 0, ts: room.version },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
  return NextResponse.json(
    { u: 1, players: Array.from(room.players.values()), ts: room.version },
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(req: NextRequest) {
  const room = g.__BROSTOCK_ISLAND_ROOM__!
  const now = Date.now()
  prune(room, now)
  try {
    const body = await req.json()
    if (body?.op === "leave" && body?.id) {
      room.players.delete(String(body.id))
      room.version = now
    } else if (body?.p && body.p.id) {
      const p = body.p
      const prev = room.players.get(String(p.id))
      room.players.set(String(p.id), {
        id: String(p.id).slice(0, 32),
        n: String(p.n || prev?.n || "Chứng Sĩ").slice(0, 18),
        src: "web",
        c: String(p.c || prev?.c || "#3b82f6"),
        h: Number(p.h ?? prev?.h ?? 0),
        v: Number(p.v ?? prev?.v ?? 1),
        x: Math.round(Number(p.x ?? prev?.x ?? 0) * 10) / 10,
        z: Math.round(Number(p.z ?? prev?.z ?? 16) * 10) / 10,
        r: Math.round(Number(p.r ?? prev?.r ?? 0) * 100) / 100,
        s: Number(p.s ?? prev?.s ?? 0),
        chat: p.chat ? String(p.chat).slice(0, 80) : prev?.chat,
        chatTs: p.chat ? now : prev?.chatTs,
        fx: p.fx ? String(p.fx) : prev?.fx,
        fxTs: p.fx ? now : prev?.fxTs,
        updatedAt: now,
      })
      room.version = now
    }
  } catch {}

  return NextResponse.json(
    { u: 1, players: Array.from(room.players.values()), ts: room.version },
    { headers: { "Cache-Control": "no-store" } }
  )
}
