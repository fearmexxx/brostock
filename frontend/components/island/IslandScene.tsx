"use client"

import React, { useEffect, useRef } from "react"
import * as THREE from "three"
import {
  ISLAND_RADIUS,
  OXY_BOX,
  ST,
  heightAt,
  inBox,
  nearestSeat,
  seatPos,
} from "./world"
import { IslandScreensData, ScreenSet } from "./ScreenRenderers"
import { buildIslandEnvironment } from "./buildWorldMesh"

export interface PlayerEntity {
  id: string
  n: string
  src: string
  c: string
  h: number
  v: number
  x: number
  z: number
  tx: number
  tz: number
  r: number
  s: number
  chat?: string
  chatUntil?: number
  fx?: string
  fxUntil?: number
}

export type CameraMode = "follow" | "cinema" | "oxy" | "drone"

interface IslandSceneProps {
  playersRef: React.MutableRefObject<Map<string, PlayerEntity>>
  myId: string | null
  cameraMode: CameraMode
  screensData: IslandScreensData
  onSendMove: (x: number, z: number, r: number, s: number) => void
  onLocalStatusChange?: (inOxy: boolean, seatedIdx: number) => void
}

const MAX_INST = 360

export default function IslandScene({
  playersRef,
  myId,
  cameraMode,
  screensData,
  onSendMove,
  onLocalStatusChange,
}: IslandSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const screenSetRef = useRef<ScreenSet | null>(null)
  const camModeRef = useRef<CameraMode>(cameraMode)
  const myIdRef = useRef<string | null>(myId)
  const onSendMoveRef = useRef(onSendMove)
  const onLocalStatusRef = useRef(onLocalStatusChange)
  const screensDataRef = useRef<IslandScreensData>(screensData)
  const joyRef = useRef({ forward: 0, strafe: 0 })
  const joyKnobRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<{ toggleSit: () => void; triggerDance: () => void }>({
    toggleSit: () => {},
    triggerDance: () => {},
  })

  useEffect(() => {
    camModeRef.current = cameraMode
  }, [cameraMode])

  useEffect(() => {
    myIdRef.current = myId
  }, [myId])

  useEffect(() => {
    onSendMoveRef.current = onSendMove
  }, [onSendMove])

  useEffect(() => {
    onLocalStatusRef.current = onLocalStatusChange
  }, [onLocalStatusChange])

  useEffect(() => {
    screensDataRef.current = screensData
    if (screenSetRef.current && screensData) {
      screenSetRef.current.updateData(screensData)
    }
  }, [screensData])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Khởi tạo Scene, Camera, Renderer (logarithmicDepthBuffer khử hoàn toàn hiện tượng nhấp nháy Z-fighting)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0ea5e9)
    scene.fog = new THREE.FogExp2(0x0ea5e9, 0.0022)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.5,
      800
    )
    camera.position.set(0, 14, 34)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    container.appendChild(renderer.domElement)

    // Ánh sáng
    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.1)
    dirLight.position.set(45, 80, 40)
    scene.add(dirLight)

    // 2. Màn hình LED & Môi trường Đảo 3D
    const screenSet = new ScreenSet()
    if (screensDataRef.current && Object.keys(screensDataRef.current).length > 0) {
      screenSet.updateData(screensDataRef.current)
    }
    screenSetRef.current = screenSet
    const { ocean } = buildIslandEnvironment(scene, screenSet)

    // 3. Hệ thống InstancedMesh cho 350+ Nhân vật Low-Poly
    // Tắt frustumCulled vì InstancedMesh mặc định chỉ tính bounding sphere tại gốc (0,0,0),
    // khiến nhân vật bị ẩn khi quay camera sang góc không nhìn thấy điểm (0,0,0).
    const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.75, 4, 8)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const bodyInst = new THREE.InstancedMesh(bodyGeo, bodyMat, MAX_INST)
    bodyInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    bodyInst.frustumCulled = false
    scene.add(bodyInst)

    const headGeo = new THREE.SphereGeometry(0.38, 8, 8)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xfde68a })
    const headInst = new THREE.InstancedMesh(headGeo, headMat, MAX_INST)
    headInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    headInst.frustumCulled = false
    scene.add(headInst)

    // Mặt nạ thở Oxy 3D (chỉ hiện trên nhân vật đang trong Trạm Oxy)
    const maskGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.32, 8)
    maskGeo.rotateX(Math.PI / 2)
    const maskMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    const maskInst = new THREE.InstancedMesh(maskGeo, maskMat, MAX_INST)
    maskInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    maskInst.frustumCulled = false
    scene.add(maskInst)

    // Vương miện / Vây Cá Mập VIP (hiện khi có Gift TikTok hoặc chọn nón)
    const crownGeo = new THREE.ConeGeometry(0.4, 0.65, 5)
    const crownMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, MAX_INST)
    crownInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    crownInst.frustumCulled = false
    scene.add(crownInst)

    // Hạt sương khói Oxy bay lên tại Trạm Cấp Cứu Oxy
    const mistCount = 45
    const mistGeo = new THREE.SphereGeometry(0.28, 6, 6)
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.55,
    })
    const mistInst = new THREE.InstancedMesh(mistGeo, mistMat, mistCount)
    mistInst.frustumCulled = false
    scene.add(mistInst)

    // 4. Điều khiển nhân vật của người chơi (WASD / Phím mũi tên / Phím E)
    const keys: Record<string, boolean> = {}
    let camYaw = 0
    let isDragging = false
    let prevMouseX = 0
    let seatedSeatIdx = -1

    const toggleSit = () => {
      if (!myIdRef.current) return
      const me = playersRef.current.get(myIdRef.current)
      if (!me) return
      if (seatedSeatIdx >= 0) {
        seatedSeatIdx = -1
        me.s = ST.IDLE
        onSendMoveRef.current(me.x, me.z, me.r, me.s)
      } else {
        let near = nearestSeat(me.x, me.z, 6.0)
        if (near < 0) {
          near = Math.floor(Math.random() * 60) + 20 // Tự chọn ghế khán đài trung tâm nếu bấm nút Ngồi từ xa trên Mobile
        }
        const sp = seatPos(near)
        seatedSeatIdx = near
        me.x = sp.x
        me.z = sp.z
        me.tx = sp.x
        me.tz = sp.z
        me.r = Math.PI
        me.s = ST.SIT
        onSendMoveRef.current(me.x, me.z, me.r, me.s)
      }
    }

    const triggerDance = () => {
      if (!myIdRef.current) return
      const me = playersRef.current.get(myIdRef.current)
      if (!me) return
      seatedSeatIdx = -1
      me.s = ST.DANCE
      me.fxUntil = performance.now() + 4000
      onSendMoveRef.current(me.x, me.z, me.r, me.s)
    }

    actionRef.current = { toggleSit, triggerDance }

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return
      }
      const k = e.key.toLowerCase()
      keys[k] = true

      if (k === "e") {
        toggleSit()
      } else if (k === " ") {
        triggerDance()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
    }
    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouseX
      prevMouseX = e.clientX
      camYaw -= dx * 0.006
    }
    const onPointerUp = () => {
      isDragging = false
    }

    // Xoay góc nhìn Camera bằng cảm ứng (Touch drag trên màn hình 3D cho Mobile)
    let touchCamId: number | null = null
    let prevTouchX = 0
    const onTouchStart = (e: TouchEvent) => {
      if (touchCamId !== null || e.changedTouches.length === 0) return
      const t = e.changedTouches[0]
      touchCamId = t.identifier
      prevTouchX = t.clientX
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchCamId === null) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchCamId) {
          const dx = t.clientX - prevTouchX
          prevTouchX = t.clientX
          camYaw -= dx * 0.007
          break
        }
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (touchCamId === null) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchCamId) {
          touchCamId = null
          break
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    renderer.domElement.addEventListener("mousedown", onPointerDown)
    window.addEventListener("mousemove", onPointerMove)
    window.addEventListener("mouseup", onPointerUp)
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true })
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true })
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: true })
    renderer.domElement.addEventListener("touchcancel", onTouchEnd, { passive: true })

    const onResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener("resize", onResize)

    // Cặp biến tái sử dụng để tránh cấp phát bộ nhớ trong vòng lặp 60 FPS
    const dummy = new THREE.Object3D()
    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0)
    const tmpColor = new THREE.Color()
    const projVec = new THREE.Vector3()

    let lastNetSend = 0
    let lastScreenRedraw = 0
    let lastOverlayUpdate = 0
    let prevOverlayHtml = ""
    let prevInOxy = false
    let prevSeated = -1
    let animId = 0
    let prevTime = performance.now()

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min((now - prevTime) / 1000, 0.1)
      prevTime = now
      const tSec = now * 0.001

      // Sóng biển nhấp nhô nhẹ ở y = -2.2 (tách biệt mặt đảo)
      ocean.position.y = -2.2 + Math.sin(tSec * 1.4) * 0.08

      // Cập nhật đồng hồ màn hình LED định kỳ mỗi 5 giây (tránh nhấp nháy)
      if (now - lastScreenRedraw > 5000) {
        lastScreenRedraw = now
        screenSet.renderAll()
      }

      // Hiệu ứng hạt sương Oxy trong Trạm Cấp Cứu Oxy
      for (let i = 0; i < mistCount; i++) {
        const mx = OXY_BOX[0] + 1 + ((i * 7.3) % (OXY_BOX[1] - OXY_BOX[0] - 2))
        const mz = OXY_BOX[2] + 1 + ((i * 5.1) % (OXY_BOX[3] - OXY_BOX[2] - 2))
        const my = ((tSec * 1.4 + i * 0.35) % 4.5) + 0.5
        dummy.position.set(mx, my, mz)
        const s = 0.6 + Math.sin(tSec * 2 + i) * 0.25
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        mistInst.setMatrixAt(i, dummy.matrix)
      }
      mistInst.instanceMatrix.needsUpdate = true

      // Điều khiển nhân vật của người chơi hiện tại
      const curMyId = myIdRef.current
      const me = curMyId ? playersRef.current.get(curMyId) : undefined
      if (me) {
        let forward = joyRef.current.forward
        let strafe = joyRef.current.strafe
        if (keys["w"] || keys["arrowup"]) forward += 1
        if (keys["s"] || keys["arrowdown"]) forward -= 1
        if (keys["a"] || keys["arrowleft"]) strafe -= 1
        if (keys["d"] || keys["arrowright"]) strafe += 1

        if (Math.abs(forward) > 0.05 || Math.abs(strafe) > 0.05) {
          seatedSeatIdx = -1
          const mag = Math.min(1, Math.hypot(forward, strafe))
          const moveAngle = camYaw + Math.atan2(strafe, forward)
          const speed = 11.5 * mag
          me.x += Math.sin(moveAngle) * speed * dt
          me.z -= Math.cos(moveAngle) * speed * dt
          const dist = Math.hypot(me.x, me.z)
          if (dist > ISLAND_RADIUS - 2) {
            me.x = (me.x / dist) * (ISLAND_RADIUS - 2)
            me.z = (me.z / dist) * (ISLAND_RADIUS - 2)
          }
          me.tx = me.x
          me.tz = me.z
          me.r = moveAngle
          me.s = inBox(me.x, me.z, OXY_BOX) ? ST.OXY : ST.WALK
        } else if (seatedSeatIdx >= 0) {
          me.s = ST.SIT
        } else if (inBox(me.x, me.z, OXY_BOX)) {
          me.s = ST.OXY
        } else if (me.s === ST.WALK) {
          me.s = ST.IDLE
        }

        if (now - lastNetSend > 120) {
          lastNetSend = now
          onSendMoveRef.current(me.x, me.z, me.r, me.s)
        }

        const nowOxy = me.s === ST.OXY
        if (onLocalStatusRef.current && (nowOxy !== prevInOxy || seatedSeatIdx !== prevSeated)) {
          prevInOxy = nowOxy
          prevSeated = seatedSeatIdx
          onLocalStatusRef.current(nowOxy, seatedSeatIdx)
        }
      }

      // Cập nhật toàn bộ 350+ Nhân vật vào InstancedMesh
      const list = Array.from(playersRef.current.values())
      const count = Math.min(list.length, MAX_INST)
      bodyInst.count = count
      headInst.count = count
      maskInst.count = count
      crownInst.count = count

      for (let i = 0; i < count; i++) {
        const p = list[i]
        if (p.id !== curMyId) {
          p.x += (p.tx - p.x) * Math.min(1, dt * 8)
          p.z += (p.tz - p.z) * Math.min(1, dt * 8)
        }
        const groundY = heightAt(p.x, p.z)
        const isWalking = p.s === ST.WALK
        const isDance = p.s === ST.DANCE || (p.fxUntil && p.fxUntil > now)
        const isSit = p.s === ST.SIT
        const isOxy = p.s === ST.OXY || inBox(p.x, p.z, OXY_BOX)

        const bounce = isDance
          ? Math.abs(Math.sin(tSec * 9 + i)) * 0.65
          : isWalking
          ? Math.abs(Math.sin(tSec * 8 + i)) * 0.18
          : 0
        const sitOffset = isSit ? -0.32 : 0
        const scale = p.v >= 2 ? 1.35 : p.v === 1 ? 1.15 : 1.0

        const py = groundY + 0.85 * scale + bounce + sitOffset

        // Thân nhân vật
        dummy.position.set(p.x, py, p.z)
        dummy.rotation.set(0, p.r, 0)
        dummy.scale.set(scale, scale, scale)
        dummy.updateMatrix()
        bodyInst.setMatrixAt(i, dummy.matrix)
        tmpColor.set(p.c || "#3b82f6")
        bodyInst.setColorAt(i, tmpColor)

        // Đầu nhân vật
        dummy.position.set(p.x, py + 0.85 * scale, p.z)
        dummy.updateMatrix()
        headInst.setMatrixAt(i, dummy.matrix)

        // Mặt nạ thở Oxy 3D nếu đang trong Trạm Oxy
        if (isOxy) {
          const fwdX = Math.sin(p.r) * 0.34 * scale
          const fwdZ = -Math.cos(p.r) * 0.34 * scale
          dummy.position.set(p.x + fwdX, py + 0.82 * scale, p.z + fwdZ)
          dummy.rotation.set(0, -p.r, 0)
          dummy.scale.set(scale, scale, scale)
          dummy.updateMatrix()
          maskInst.setMatrixAt(i, dummy.matrix)
        } else {
          maskInst.setMatrixAt(i, hiddenMatrix)
        }

        // Vương miện / Nón lá / Vây cá mập
        if (p.v > 0 || p.h > 0) {
          dummy.position.set(p.x, py + 1.38 * scale, p.z)
          dummy.rotation.set(0, tSec * 2 + i, 0)
          dummy.scale.set(scale, scale, scale)
          dummy.updateMatrix()
          crownInst.setMatrixAt(i, dummy.matrix)
        } else {
          crownInst.setMatrixAt(i, hiddenMatrix)
        }
      }

      bodyInst.instanceMatrix.needsUpdate = true
      if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true
      headInst.instanceMatrix.needsUpdate = true
      maskInst.instanceMatrix.needsUpdate = true
      crownInst.instanceMatrix.needsUpdate = true

      // Cập nhật vị trí Camera theo chế độ
      const mode = camModeRef.current
      if (mode === "cinema") {
        camera.position.lerp(new THREE.Vector3(0, 12.5, -10), 0.08)
        camera.lookAt(0, 14.5, -46)
      } else if (mode === "oxy") {
        camera.position.lerp(new THREE.Vector3(-24, 7.5, -24), 0.08)
        camera.lookAt(-36, 3.0, -38)
      } else if (mode === "drone") {
        const dx = Math.sin(tSec * 0.18) * 58
        const dz = Math.cos(tSec * 0.18) * 58 - 10
        camera.position.lerp(new THREE.Vector3(dx, 38, dz), 0.05)
        camera.lookAt(0, 8, -32)
      } else if (me) {
        const gy = heightAt(me.x, me.z)
        const camDist = 11.5
        const targetCamX = me.x - Math.sin(camYaw) * camDist
        const targetCamZ = me.z + Math.cos(camYaw) * camDist
        camera.position.lerp(new THREE.Vector3(targetCamX, gy + 5.8, targetCamZ), 0.15)
        camera.lookAt(me.x, gy + 2.2, me.z - 4)
      } else {
        camera.position.lerp(new THREE.Vector3(0, 18, 28), 0.05)
        camera.lookAt(0, 12, -46)
      }

      renderer.render(scene, camera)

      // Cập nhật Nhãn tên & Bong bóng Chat 2D (tối đa 40 nhãn, cập nhật 12Hz để chống nhấp nháy DOM)
      const overlay = overlayRef.current
      if (overlay && now - lastOverlayUpdate > 80) {
        lastOverlayUpdate = now
        const w = container.clientWidth
        const h = container.clientHeight
        const prioritized = list
          .filter(
            (p) =>
              p.id === curMyId ||
              (p.chatUntil && p.chatUntil > now) ||
              p.v > 0 ||
              Math.hypot(p.x - camera.position.x, p.z - camera.position.z) < 42
          )
          .slice(0, 40)

        const htmlParts: string[] = []
        for (const p of prioritized) {
          const gy = heightAt(p.x, p.z)
          projVec.set(p.x, gy + 2.6, p.z)
          projVec.project(camera)
          if (projVec.z > 1) continue
          const sx = (projVec.x * 0.5 + 0.5) * w
          const sy = (-projVec.y * 0.5 + 0.5) * h
          if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue

          const isOxy = p.s === ST.OXY || inBox(p.x, p.z, OXY_BOX)
          const hasChat = p.chat && p.chatUntil && p.chatUntil > now
          const badge =
            p.v >= 2
              ? "🦈VIP "
              : p.src === "tiktok"
              ? "🎵 "
              : isOxy
              ? "🏥OXY "
              : ""

          htmlParts.push(
            `<div style="position:absolute;left:${sx.toFixed(0)}px;top:${sy.toFixed(
              0
            )}px;transform:translate(-50%,-100%);pointer-events:none;text-align:center;white-space:nowrap;">` +
              (hasChat
                ? `<div style="background:#fef08a;color:#0f172a;font-weight:800;font-size:11px;padding:3px 8px;border-radius:10px;margin-bottom:3px;border:1px solid #f59e0b;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${p.chat}</div>`
                : "") +
              `<span style="background:${
                p.id === curMyId
                  ? "#16a34a"
                  : isOxy
                  ? "#0891b2"
                  : "rgba(15,23,42,0.82)"
              };color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);">${badge}${
                p.n
              }</span></div>`
          )
        }
        const nextHtml = htmlParts.join("")
        if (nextHtml !== prevOverlayHtml) {
          prevOverlayHtml = nextHtml
          overlay.innerHTML = nextHtml
        }
      }
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      renderer.domElement.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("mousemove", onPointerMove)
      window.removeEventListener("mouseup", onPointerUp)
      renderer.domElement.removeEventListener("touchstart", onTouchStart)
      renderer.domElement.removeEventListener("touchmove", onTouchMove)
      renderer.domElement.removeEventListener("touchend", onTouchEnd)
      renderer.domElement.removeEventListener("touchcancel", onTouchEnd)
      window.removeEventListener("resize", onResize)
      screenSet.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [playersRef])

  // Xử lý cần điều khiển ảo (Virtual Joystick) cho Mobile & Tablet
  const handleJoyMove = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const maxR = rect.width / 2 - 14
    let dx = clientX - cx
    let dy = clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > maxR) {
      dx = (dx / dist) * maxR
      dy = (dy / dist) * maxR
    }
    joyRef.current = {
      strafe: dx / maxR,
      forward: -dy / maxR,
    }
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
    }
  }

  const resetJoy = () => {
    joyRef.current = { forward: 0, strafe: 0 }
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = "translate(0px, 0px)"
    }
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden touch-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Bộ điều khiển cảm ứng Mobile/Tablet: Cần Joystick trái & Nút Ngồi/Nhảy phải */}
      {myId && (
        <>
          <div
            className="absolute bottom-24 md:bottom-16 left-4 z-30 w-28 h-28 rounded-full bg-slate-900/65 border-2 border-cyan-400/50 backdrop-blur-md flex items-center justify-center shadow-2xl touch-none"
            onTouchStart={(e) => {
              e.stopPropagation()
              const t = e.touches[0]
              if (t) handleJoyMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect())
            }}
            onTouchMove={(e) => {
              e.stopPropagation()
              const t = e.touches[0]
              if (t) handleJoyMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect())
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              resetJoy()
            }}
            onTouchCancel={(e) => {
              e.stopPropagation()
              resetJoy()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              handleJoyMove(e.clientX, e.clientY, rect)
              const onMm = (ev: MouseEvent) => handleJoyMove(ev.clientX, ev.clientY, rect)
              const onMu = () => {
                resetJoy()
                window.removeEventListener("mousemove", onMm)
                window.removeEventListener("mouseup", onMu)
              }
              window.addEventListener("mousemove", onMm)
              window.addEventListener("mouseup", onMu)
            }}
          >
            <div className="text-[9px] font-bold text-cyan-300/40 uppercase pointer-events-none select-none">
              DI CHUYỂN
            </div>
            <div
              ref={joyKnobRef}
              className="absolute w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white/80 shadow-lg pointer-events-none"
            />
          </div>

          <div className="absolute bottom-24 right-4 z-30 flex flex-col gap-2.5 md:hidden">
            <button
              type="button"
              onClick={() => actionRef.current.toggleSit()}
              className="w-14 h-14 rounded-full bg-amber-500/90 active:bg-amber-400 text-slate-950 font-black text-[11px] border-2 border-amber-200 shadow-xl flex flex-col items-center justify-center leading-tight"
            >
              <span>🪑</span>
              <span>NGỒI</span>
            </button>
            <button
              type="button"
              onClick={() => actionRef.current.triggerDance()}
              className="w-14 h-14 rounded-full bg-emerald-500/90 active:bg-emerald-400 text-slate-950 font-black text-[11px] border-2 border-emerald-200 shadow-xl flex flex-col items-center justify-center leading-tight"
            >
              <span>🕺</span>
              <span>NHẢY</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
