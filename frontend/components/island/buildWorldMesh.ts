import * as THREE from "three"
import {
  ISLAND_RADIUS,
  MAIN_SCREEN,
  OXY_BOX,
  SEAT_COLS,
  SEAT_DY,
  SEAT_DZ,
  SEAT_ROWS,
  SEAT_Z0,
  SIDE_SCREENS,
  seatPos,
} from "./world"
import { ScreenSet } from "./ScreenRenderers"

function makeSignTexture(text: string, subtext: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 128
  const ctx = c.getContext("2d")!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.strokeStyle = fg
  ctx.lineWidth = 6
  ctx.strokeRect(4, 4, c.width - 8, c.height - 8)
  ctx.fillStyle = fg
  ctx.font = "900 30px monospace"
  ctx.textAlign = "center"
  ctx.fillText(text, c.width / 2, 56)
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 20px sans-serif"
  ctx.fillText(subtext, c.width / 2, 98)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = false
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  return t
}

export function buildIslandEnvironment(scene: THREE.Scene, screens: ScreenSet) {
  // 1. Đại dương Low-Poly (y = -2.2, tách biệt hoàn toàn với mặt đảo để không bị Z-fighting)
  const oceanGeo = new THREE.CircleGeometry(650, 48)
  oceanGeo.rotateX(-Math.PI / 2)
  const oceanMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 })
  const ocean = new THREE.Mesh(oceanGeo, oceanMat)
  ocean.position.y = -2.2
  scene.add(ocean)

  // 2. Bờ cát vàng (đỉnh tại y = -0.35) & Đảo cỏ xanh trung tâm (đỉnh tại y = 0.0)
  const sandGeo = new THREE.CylinderGeometry(ISLAND_RADIUS + 10, ISLAND_RADIUS + 20, 2.0, 32)
  const sandMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 })
  const sand = new THREE.Mesh(sandGeo, sandMat)
  sand.position.y = -1.35
  scene.add(sand)

  const grassGeo = new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 4, 2.0, 32)
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x16a34a })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.position.y = -1.0
  scene.add(grass)

  // Nền quảng trường Sân vận động trung tâm (dùng Cylinder mỏng để không bao giờ bị nhấp nháy Z-fighting)
  const plazaGeo = new THREE.CylinderGeometry(62, 62, 0.16, 32)
  const plazaMat = new THREE.MeshLambertMaterial({ color: 0x1e293b })
  const plaza = new THREE.Mesh(plazaGeo, plazaMat)
  plaza.position.set(0, 0.08, -10)
  scene.add(plaza)

  // 3. Màn hình LED Khổng Lồ Trung Tâm (VN-Index & VN100 VPS Style)
  const frameGeo = new THREE.BoxGeometry(MAIN_SCREEN.w + 2.4, MAIN_SCREEN.h + 2.4, 1.4)
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a })
  const frame = new THREE.Mesh(frameGeo, frameMat)
  frame.position.set(MAIN_SCREEN.x, MAIN_SCREEN.y, MAIN_SCREEN.z - 1.1)
  scene.add(frame)

  // Cột trụ đỡ màn hình lớn
  for (const px of [-MAIN_SCREEN.w * 0.38, MAIN_SCREEN.w * 0.38]) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.2, MAIN_SCREEN.y, 8),
      frameMat
    )
    pillar.position.set(px, MAIN_SCREEN.y / 2, MAIN_SCREEN.z - 1.5)
    scene.add(pillar)
  }

  const mainScreenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAIN_SCREEN.w, MAIN_SCREEN.h),
    new THREE.MeshBasicMaterial({
      map: screens.mainTex,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  )
  mainScreenMesh.position.set(MAIN_SCREEN.x, MAIN_SCREEN.y, MAIN_SCREEN.z + 0.15)
  scene.add(mainScreenMesh)

  // 4. Cụm 3 Màn hình LED Phụ (Crypto, Vàng/Dầu, Chứng Mỹ)
  const sideTexMap: Record<string, THREE.CanvasTexture> = {
    crypto: screens.cryptoTex,
    macro: screens.macroTex,
    us: screens.usTex,
  }

  SIDE_SCREENS.forEach((cfg) => {
    const grp = new THREE.Group()
    grp.position.set(cfg.x, cfg.y, cfg.z)
    grp.rotation.y = cfg.ry

    const sFrame = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.w + 1.0, cfg.h + 1.0, 0.8),
      frameMat
    )
    sFrame.position.z = -0.65
    grp.add(sFrame)

    const sPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cfg.w, cfg.h),
      new THREE.MeshBasicMaterial({
        map: sideTexMap[cfg.key],
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    )
    sPlane.position.z = 0.12
    grp.add(sPlane)

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, cfg.y, 8),
      frameMat
    )
    post.position.set(0, -cfg.y / 2, -0.7)
    grp.add(post)

    scene.add(grp)
  })

  // 5. Khán đài 200 Ghế Cinema (Tiered Stadium + InstancedMesh 200 ghế = 1 Draw Call)
  const stepWidth = SEAT_COLS * 1.65 + 3
  const stepMat = new THREE.MeshLambertMaterial({ color: 0x334155 })
  for (let r = 0; r < SEAT_ROWS; r++) {
    const stepH = (r + 1) * SEAT_DY
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepWidth, stepH, SEAT_DZ - 0.06),
      stepMat
    )
    step.position.set(0, stepH / 2 + 0.05, SEAT_Z0 + r * SEAT_DZ)
    scene.add(step)
  }

  const totalSeats = SEAT_ROWS * SEAT_COLS
  const seatGeo = new THREE.BoxGeometry(0.95, 0.55, 0.85)
  const seatMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 })
  const seatInst = new THREE.InstancedMesh(seatGeo, seatMat, totalSeats)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < totalSeats; i++) {
    const sp = seatPos(i)
    dummy.position.set(sp.x, sp.y + 0.25, sp.z)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    seatInst.setMatrixAt(i, dummy.matrix)
  }
  seatInst.instanceMatrix.needsUpdate = true
  scene.add(seatInst)

  // 6. TRẠM THỞ OXY CẤP CỨU ĐU ĐỈNH (Bên trái màn hình lớn: OXY_BOX)
  const oxyCenterX = (OXY_BOX[0] + OXY_BOX[1]) / 2
  const oxyCenterZ = (OXY_BOX[2] + OXY_BOX[3]) / 2
  const oxyW = OXY_BOX[1] - OXY_BOX[0]
  const oxyD = OXY_BOX[3] - OXY_BOX[2]

  const oxyGroup = new THREE.Group()
  oxyGroup.position.set(oxyCenterX, 0.16, oxyCenterZ)

  // Sàn phát sáng Cyan của Trạm Oxy
  const oxyFloor = new THREE.Mesh(
    new THREE.BoxGeometry(oxyW, 0.3, oxyD),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
  )
  oxyFloor.position.y = 0.15
  oxyGroup.add(oxyFloor)

  // Vòm kính bán trong suốt của buồng Oxy
  const oxyDome = new THREE.Mesh(
    new THREE.BoxGeometry(oxyW - 0.8, 5.4, oxyD - 0.8),
    new THREE.MeshLambertMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  )
  oxyDome.position.y = 3.0
  oxyGroup.add(oxyDome)

  // Mái Trạm Oxy
  const oxyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(oxyW + 0.6, 0.6, oxyD + 0.6),
    new THREE.MeshLambertMaterial({ color: 0x0e7490 })
  )
  oxyRoof.position.y = 6.0
  oxyGroup.add(oxyRoof)

  // 4 Bình Khí Oxy khổng lồ màu xanh ngọc bên cạnh trạm
  const tankMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
  for (let i = 0; i < 4; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4.2, 10), tankMat)
    tank.position.set(-oxyW / 2 - 1.0, 2.1, -3 + i * 2)
    oxyGroup.add(tank)
  }

  // Biển hiệu phát sáng trên nóc Trạm Oxy
  const oxySignTex = makeSignTexture(
    "🏥 TRẠM CẤP CỨU THỞ OXY",
    "Dành cho Chứng Sĩ Đu Đỉnh / Cháy Tài Khoản (Đi vào để đeo Mặt nạ Oxy)",
    "#083344",
    "#22d3ee"
  )
  const oxySign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 2.9),
    new THREE.MeshBasicMaterial({ map: oxySignTex, side: THREE.DoubleSide })
  )
  oxySign.position.set(0, 7.8, 0)
  oxySign.rotation.y = 0.35
  oxyGroup.add(oxySign)

  scene.add(oxyGroup)

  // 7. Cây dừa Low-Poly trang trí quanh đảo (InstancedMesh)
  const treeCount = 36
  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.35, 0.55, 5.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x854d0e }),
    treeCount
  )
  const leafInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.6, 3.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x15803d }),
    treeCount
  )
  for (let i = 0; i < treeCount; i++) {
    const ang = (i / treeCount) * Math.PI * 2
    const rad = 74 + (i % 3) * 8
    const tx = Math.cos(ang) * rad
    const tz = Math.sin(ang) * rad
    dummy.position.set(tx, 2.75, tz)
    dummy.rotation.set(0, ang, 0)
    dummy.updateMatrix()
    trunkInst.setMatrixAt(i, dummy.matrix)

    dummy.position.set(tx, 6.2, tz)
    dummy.updateMatrix()
    leafInst.setMatrixAt(i, dummy.matrix)
  }
  trunkInst.instanceMatrix.needsUpdate = true
  leafInst.instanceMatrix.needsUpdate = true
  scene.add(trunkInst)
  scene.add(leafInst)

  return { ocean }
}
