// Hằng số thế giới Đảo Chứng Sĩ — PHẢI khớp với backend/island_server.py
export const ISLAND_RADIUS = 105
export const SEAT_ROWS = 10
export const SEAT_COLS = 20
export const SEAT_DX = 1.6
export const SEAT_DZ = 2.2
export const SEAT_DY = 0.6
export const SEAT_Z0 = -18
// [xmin, xmax, zmin, zmax]
export const OXY_BOX = [-42, -30, -44, -32] as const
export const DANCE_BOX = [-14, 14, -36, -24] as const

// Màn hình LED chính (phía trước khán đài, quay mặt về +z)
export const MAIN_SCREEN = { x: 0, y: 15, z: -46, w: 48, h: 27 }

// Màn hình phụ: vị trí + góc xoay (quay về phía khán đài)
export const SIDE_SCREENS = [
  { key: "crypto", x: 34, y: 9, z: -38, w: 16, h: 10, ry: -0.6 },
  { key: "macro", x: 41, y: 8, z: -22, w: 14, h: 9, ry: -1.0 },
  { key: "us", x: 41, y: 8, z: -6, w: 14, h: 9, ry: -1.25 },
] as const

export const ST = { IDLE: 0, WALK: 1, SIT: 2, OXY: 3, DANCE: 4 } as const

export function seatPos(i: number) {
  const row = Math.floor(i / SEAT_COLS)
  const col = i % SEAT_COLS
  return {
    x: (col - (SEAT_COLS - 1) / 2) * SEAT_DX,
    z: SEAT_Z0 + row * SEAT_DZ,
    y: 0.5 + row * SEAT_DY,
    row,
  }
}

export function inBox(x: number, z: number, b: readonly number[]) {
  return x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3]
}

const SEAT_XMAX = ((SEAT_COLS - 1) / 2) * SEAT_DX + 1.2

/** Độ cao mặt đất tại (x,z): khán đài bậc thang, còn lại là mặt sân phẳng. */
export function heightAt(x: number, z: number) {
  if (Math.abs(x) <= SEAT_XMAX && z >= SEAT_Z0 - 1.1 && z <= SEAT_Z0 + (SEAT_ROWS - 0.5) * SEAT_DZ) {
    const row = Math.max(0, Math.min(SEAT_ROWS - 1, Math.round((z - SEAT_Z0) / SEAT_DZ)))
    return row * SEAT_DY
  }
  return 0
}

/** Ghế gần nhất trong bán kính r (dùng khi người chơi bấm E để ngồi). */
export function nearestSeat(x: number, z: number, r = 2.5) {
  let best = -1
  let bd = r * r
  for (let i = 0; i < SEAT_ROWS * SEAT_COLS; i++) {
    const p = seatPos(i)
    const d = (p.x - x) ** 2 + (p.z - z) ** 2
    if (d < bd) { bd = d; best = i }
  }
  return best
}

export const HATS = ["Không", "Nón lá", "Vương miện", "Nón Cá Mập"]
export const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"]
export const QUICK_CHATS = ["Đu đỉnh rồi 😭", "Cấp cứu Oxy 🏥", "Tím lịm 🚀", "Full Margin 🔥", "Về bờ thành công 🎉", "Bắt đáy thôi 🎣"]
