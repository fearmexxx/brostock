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
}

const g = globalThis as unknown as { __BROSTOCK_ISLAND_ROOM__?: RoomState }
if (!g.__BROSTOCK_ISLAND_ROOM__) {
  g.__BROSTOCK_ISLAND_ROOM__ = { players: new Map() }
}

function prune(room: RoomState, now: number) {
  for (const [id, p] of room.players.entries()) {
    if (now - p.updatedAt > 25000) {
      room.players.delete(id)
    }
  }
}

export async function GET() {
  const room = g.__BROSTOCK_ISLAND_ROOM__!
  const now = Date.now()
  prune(room, now)
  return NextResponse.json(
    { players: Array.from(room.players.values()), ts: now },
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
        x: Number(p.x ?? prev?.x ?? 0),
        z: Number(p.z ?? prev?.z ?? 16),
        r: Number(p.r ?? prev?.r ?? 0),
        s: Number(p.s ?? prev?.s ?? 0),
        chat: p.chat ? String(p.chat).slice(0, 80) : prev?.chat,
        chatTs: p.chat ? now : prev?.chatTs,
        fx: p.fx ? String(p.fx) : prev?.fx,
        fxTs: p.fx ? now : prev?.fxTs,
        updatedAt: now,
      })
    }
  } catch {}

  return NextResponse.json(
    { players: Array.from(room.players.values()), ts: now },
    { headers: { "Cache-Control": "no-store" } }
  )
}
