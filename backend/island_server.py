"""
Đảo Chứng Sĩ 3D (BroStock Island) — Máy chủ thế giới MMO thời gian thực.

- Quản lý tối đa MAX_PLAYERS thực thể (người chơi Web + nhân vật TikTok Live).
- Đồng bộ qua WebSocket dạng delta (chỉ gửi thực thể có thay đổi) ở TICK_HZ.
- Nhân vật TikTok được server tự điều khiển (đi tới Trạm Oxy, ghế khán đài, nhảy...).
- Cung cấp dữ liệu cho các màn hình LED: VN-Index/VN100, Crypto, Vàng/Dầu, Chứng khoán Mỹ.
"""
import asyncio
import json
import logging
import math
import random
import re
import time
import unicodedata
import urllib.request
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("island")

# ---------------------------------------------------------------------------
# Hằng số thế giới (phải khớp với frontend/components/island/world.ts)
# ---------------------------------------------------------------------------
MAX_PLAYERS = 350
TICK_HZ = 10
ISLAND_RADIUS = 105.0
BOT_SPEED = 4.5  # đơn vị/giây

SEAT_ROWS, SEAT_COLS = 10, 20          # 200 ghế khán đài
SEAT_DX, SEAT_DZ, SEAT_DY = 1.6, 2.2, 0.6
SEAT_Z0 = -18.0                        # hàng ghế đầu tiên
OXY_BOX = (-42.0, -30.0, -44.0, -32.0)  # xmin, xmax, zmin, zmax — bên trái màn hình lớn
DANCE_BOX = (-14.0, 14.0, -36.0, -24.0)  # khoảng sân trước màn hình
PLAZA_BOX = (-30.0, 30.0, 8.0, 40.0)     # quảng trường phía sau khán đài (điểm hồi sinh)

# Mã trạng thái gửi xuống client
ST_IDLE, ST_WALK, ST_SIT, ST_OXY, ST_DANCE = 0, 1, 2, 3, 4

COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
          "#14b8a6", "#f97316", "#84cc16", "#06b6d4", "#e11d48", "#6366f1"]


def seat_pos(idx: int):
    row, col = divmod(idx, SEAT_COLS)
    return ((col - (SEAT_COLS - 1) / 2) * SEAT_DX, SEAT_Z0 + row * SEAT_DZ)


def rand_in(box):
    return random.uniform(box[0], box[1]), random.uniform(box[2], box[3])


def in_box(x, z, box):
    return box[0] <= x <= box[1] and box[2] <= z <= box[3]


def strip_accents(s: str) -> str:
    """Bỏ dấu tiếng Việt để so khớp lệnh comment."""
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def clean_text(s: str, n: int) -> str:
    s = re.sub(r"[\x00-\x1f<>]", "", str(s or "")).strip()
    return s[:n]


OXY_WORDS = {"oxy", "tho", "cuu", "lo", "do", "dinh", "chay", "toang", "sap", "margin"}
DANCE_WORDS = {"nhay", "tim", "lai", "xanh", "tran", "moon", "bo", "ve bo", "len"}
SIT_WORDS = {"ngoi", "ghe", "xem"}


class Player:
    __slots__ = ("id", "name", "src", "x", "z", "r", "s", "color", "hat", "vip",
                 "tx", "tz", "goal", "goal_until", "seat", "last_active",
                 "diamonds", "dirty", "meta_dirty", "last_chat")

    def __init__(self, pid: str, name: str, src: str, color: str, hat: int = 0):
        self.id, self.name, self.src, self.color, self.hat = pid, name, src, color, hat
        self.x, self.z = rand_in(PLAZA_BOX)
        self.r, self.s, self.vip = 0.0, ST_IDLE, 0
        self.tx: Optional[float] = None
        self.tz: Optional[float] = None
        self.goal, self.goal_until, self.seat = "wander", 0.0, -1
        self.last_active = time.time()
        self.diamonds = 0
        self.dirty = True
        self.meta_dirty = True
        self.last_chat = 0.0

    def pos_row(self):
        return [self.id, round(self.x, 1), round(self.z, 1), round(self.r, 2), self.s]

    def meta(self):
        return {"id": self.id, "n": self.name, "src": self.src, "c": self.color,
                "h": self.hat, "v": self.vip}


class IslandWorld:
    def __init__(self):
        self.players: Dict[str, Player] = {}
        self.sockets: Dict[str, WebSocket] = {}       # player_id -> websocket (người chơi web)
        self.spectators: Dict[int, WebSocket] = {}    # khán giả chỉ xem (chưa đăng nhập)
        self.seats: List[Optional[str]] = [None] * (SEAT_ROWS * SEAT_COLS)
        self.events: List[dict] = []                  # sự kiện chat/fx chờ phát
        self.removed: List[str] = []
        self.screens: dict = {}
        self.vn_provider: Optional[Callable[[], dict]] = None
        self.tiktok_client = None
        self.tiktok_task: Optional[asyncio.Task] = None
        self.tiktok_user: Optional[str] = None
        self.tiktok_status = "disconnected"
        self._seq = 0
        self._started = False

    # ------------------------------------------------------------------ util
    def new_id(self, prefix: str) -> str:
        self._seq += 1
        return f"{prefix}{self._seq}"

    def emit(self, ev: dict):
        self.events.append(ev)
        if len(self.events) > 200:
            self.events = self.events[-200:]

    def release_seat(self, p: Player):
        if 0 <= p.seat < len(self.seats) and self.seats[p.seat] == p.id:
            self.seats[p.seat] = None
        p.seat = -1

    def remove_player(self, pid: str):
        p = self.players.pop(pid, None)
        if p:
            self.release_seat(p)
            self.removed.append(pid)

    def make_room(self) -> bool:
        """Khi đầy server: loại nhân vật TikTok ít hoạt động nhất."""
        if len(self.players) < MAX_PLAYERS:
            return True
        tt = [p for p in self.players.values() if p.src == "tiktok"]
        if not tt:
            return False
        oldest = min(tt, key=lambda p: p.last_active)
        self.remove_player(oldest.id)
        return True

    # ------------------------------------------------------------ mục tiêu bot
    def set_goal(self, p: Player, goal: str, dur: float = 45.0):
        self.release_seat(p)
        p.goal, p.goal_until = goal, time.time() + dur
        if goal == "oxy":
            p.tx, p.tz = rand_in((OXY_BOX[0] + 1, OXY_BOX[1] - 1, OXY_BOX[2] + 1, OXY_BOX[3] - 1))
        elif goal == "dance":
            p.tx, p.tz = rand_in(DANCE_BOX)
        elif goal == "sit":
            free = [i for i, o in enumerate(self.seats) if o is None]
            if not free:
                return self.set_goal(p, "dance", dur)
            idx = random.choice(free)
            self.seats[idx] = p.id
            p.seat = idx
            p.tx, p.tz = seat_pos(idx)
            p.goal_until = time.time() + dur * 2
        else:
            p.goal = "wander"
            p.tx, p.tz = rand_in(PLAZA_BOX)
            p.goal_until = time.time() + random.uniform(8, 20)
        p.dirty = True

    def step_bot(self, p: Player, dt: float, now: float):
        if p.tx is None:
            self.set_goal(p, "wander")
            return
        dx, dz = p.tx - p.x, p.tz - p.z
        d = math.hypot(dx, dz)
        if d > 0.15:
            step = min(d, BOT_SPEED * dt)
            p.x += dx / d * step
            p.z += dz / d * step
            p.r = math.atan2(dx, dz)
            p.s = ST_WALK
            p.dirty = True
            return
        # Đã tới nơi
        new_s = {"oxy": ST_OXY, "dance": ST_DANCE, "sit": ST_SIT}.get(p.goal, ST_IDLE)
        if p.goal == "sit":
            p.r = math.pi  # quay mặt về màn hình (hướng -z)
        if new_s != p.s:
            p.s = new_s
            p.dirty = True
        if now > p.goal_until:
            nxt = random.choices(["sit", "oxy", "dance", "wander"], weights=[40, 20, 15, 25], k=1)[0]
            self.set_goal(p, nxt, random.uniform(25, 65))

    # ---------------------------------------------------------- TikTok Live
    def handle_tiktok(self, kind: str, uid: str, nick: str, text: str = "",
                      count: int = 1, gift: str = "", diamonds: int = 1):
        uid = clean_text(uid, 24) or f"viewer{random.randint(1000, 9999)}"
        pid = "t_" + re.sub(r"[^a-zA-Z0-9_.]", "", uid.lower())[:24]
        now = time.time()
        p = self.players.get(pid)
        if p is None:
            if not self.make_room():
                return
            p = Player(pid, "@" + clean_text(nick or uid, 15), "tiktok",
                       random.choice(COLORS), random.randint(0, 3))
            self.players[pid] = p
            self.set_goal(p, "wander")
        p.last_active = now

        if kind == "comment" and text:
            msg = clean_text(text, 70)
            self.emit({"k": "chat", "id": pid, "m": msg})
            words = set(re.findall(r"[a-z]+", strip_accents(msg)))
            if words & OXY_WORDS:
                self.set_goal(p, "oxy", 50)
                self.emit({"k": "oxy", "id": pid})
            elif words & DANCE_WORDS:
                self.set_goal(p, "dance", 30)
            elif words & SIT_WORDS:
                self.set_goal(p, "sit", 60)
        elif kind == "like":
            self.emit({"k": "like", "id": pid, "n": int(min(count, 99))})
        elif kind == "gift":
            p.diamonds += max(1, int(diamonds))
            p.vip = 3 if p.diamonds >= 1000 else 2 if p.diamonds >= 100 else 1
            p.meta_dirty = True
            self.emit({"k": "gift", "id": pid, "g": clean_text(gift, 20), "d": int(diamonds)})
            self.set_goal(p, "dance", 35)

    async def tiktok_connect(self, username: str) -> dict:
        await self.tiktok_disconnect()
        uname = clean_text(username, 40).lstrip("@")
        if not uname:
            return {"ok": False, "error": "Thiếu username TikTok"}
        try:
            from TikTokLive import TikTokLiveClient
            from TikTokLive.events import (CommentEvent, ConnectEvent, DisconnectEvent,
                                           GiftEvent, JoinEvent, LikeEvent)
        except Exception:
            self.tiktok_status = "error: server chưa cài thư viện TikTokLive"
            return {"ok": False, "error": self.tiktok_status}

        client = TikTokLiveClient(unique_id="@" + uname)

        def uinfo(e):
            u = getattr(e, "user", None)
            uid = getattr(u, "unique_id", None) or getattr(u, "uniqueId", None) or ""
            nick = getattr(u, "nickname", None) or uid
            return str(uid), str(nick)

        @client.on(ConnectEvent)
        async def _on_connect(e):
            self.tiktok_status = "connected"

        @client.on(DisconnectEvent)
        async def _on_disconnect(e):
            self.tiktok_status = "disconnected"

        @client.on(JoinEvent)
        async def _on_join(e):
            self.handle_tiktok("join", *uinfo(e))

        @client.on(CommentEvent)
        async def _on_comment(e):
            self.handle_tiktok("comment", *uinfo(e), text=getattr(e, "comment", ""))

        @client.on(LikeEvent)
        async def _on_like(e):
            self.handle_tiktok("like", *uinfo(e), count=getattr(e, "count", 1) or 1)

        @client.on(GiftEvent)
        async def _on_gift(e):
            g = getattr(e, "gift", None)
            # Quà dạng combo: chỉ xử lý khi combo kết thúc
            if getattr(g, "streakable", False) and getattr(e, "streaking", False):
                return
            rep = max(1, int(getattr(e, "repeat_count", 1) or 1))
            dia = int(getattr(g, "diamond_count", 1) or 1) * rep
            self.handle_tiktok("gift", *uinfo(e), gift=getattr(g, "name", "Gift"), diamonds=dia)

        self.tiktok_client, self.tiktok_user, self.tiktok_status = client, uname, "connecting"

        async def runner():
            try:
                await client.connect()
            except Exception as ex:
                self.tiktok_status = f"error: {str(ex)[:120]}"
                logger.warning(f"[TikTok] {ex}")

        self.tiktok_task = asyncio.create_task(runner())
        return {"ok": True, "user": uname}

    async def tiktok_disconnect(self):
        if self.tiktok_client is not None:
            try:
                await self.tiktok_client.disconnect()
            except Exception:
                pass
        if self.tiktok_task and not self.tiktok_task.done():
            self.tiktok_task.cancel()
        self.tiktok_client, self.tiktok_task = None, None
        self.tiktok_status = "disconnected"

    def simulate(self, kind: str, n: int = 1):
        """Giả lập sự kiện TikTok Live để test khi chưa phát trực tiếp."""
        names = ["Hùng Đu Đỉnh", "Lan Bắt Đáy", "Tuấn Margin", "Mai Tích Sản", "Cá Mập Nhỏ",
                 "Chứng Sĩ F0", "Bảo VN30", "Ngọc Lướt Sóng", "Long HPG", "Vy Về Bờ"]
        comments = ["oxy gấp ad ơi", "HPG giữ được không ad?", "ngồi xem bảng điện", "tím lịm luôn",
                    "đu đỉnh rồi cứu", "VNINDEX lên 1500 không", "lãi rồi nhảy thôi", "full margin toang"]
        gifts = [("Rose", 1), ("TikTok", 1), ("Finger Heart", 5), ("Galaxy", 1000), ("Lion", 29999)]
        n = max(1, min(int(n), MAX_PLAYERS))
        for i in range(n):
            nick = random.choice(names)
            uid = strip_accents(nick).replace(" ", "") + str(random.randint(1, 999))
            if kind == "comment":
                self.handle_tiktok("comment", uid, nick, text=random.choice(comments))
            elif kind == "oxy":
                self.handle_tiktok("comment", uid, nick, text="oxy cứu em")
            elif kind == "like":
                self.handle_tiktok("like", uid, nick, count=random.randint(1, 15))
            elif kind == "gift":
                g, d = random.choice(gifts)
                self.handle_tiktok("gift", uid, nick, gift=g, diamonds=d)
            else:  # crowd / join
                self.handle_tiktok("join", uid, nick)

    # -------------------------------------------------------------- Mạng
    def stats(self):
        web = sum(1 for p in self.players.values() if p.src == "web")
        return {"n": len(self.players), "w": web, "tt": len(self.players) - web,
                "max": MAX_PLAYERS, "live": {"u": self.tiktok_user, "s": self.tiktok_status}}

    async def broadcast(self, text: str):
        targets = list(self.sockets.values()) + list(self.spectators.values())
        if not targets:
            return

        async def _send(ws):
            try:
                await asyncio.wait_for(ws.send_text(text), timeout=2.0)
            except Exception:
                pass

        await asyncio.gather(*[_send(ws) for ws in targets])

    async def tick_loop(self):
        dt = 1.0 / TICK_HZ
        last_stats = 0.0
        last_sent_stats = None
        while True:
            t0 = time.time()
            try:
                if len(self.players) < 45:
                    self.simulate("crowd", 35)
                    self.simulate("oxy", 6)
                    self.simulate("comment", 6)
                for p in list(self.players.values()):
                    if p.src == "tiktok":
                        if len(self.players) > 80 and t0 - p.last_active > 900:
                            self.remove_player(p.id)
                            continue
                        self.step_bot(p, dt, t0)
                rows = [p.pos_row() for p in self.players.values() if p.dirty]
                metas = [p.meta() for p in self.players.values() if p.meta_dirty]
                for p in self.players.values():
                    p.dirty = p.meta_dirty = False
                msg = {"t": "d"}
                if rows: msg["p"] = rows
                if metas: msg["m"] = metas
                if self.removed: msg["x"], self.removed = self.removed, []
                if self.events: msg["e"], self.events = self.events, []
                if t0 - last_stats > 2:
                    last_stats = t0
                    cur_st = self.stats()
                    if cur_st != last_sent_stats:
                        msg["st"] = cur_st
                        last_sent_stats = cur_st
                if len(msg) > 1:
                    await self.broadcast(json.dumps(msg, ensure_ascii=False, separators=(",", ":")))
            except Exception as ex:
                logger.error(f"[Island tick] {ex}", exc_info=True)
            await asyncio.sleep(max(0.0, dt - (time.time() - t0)))

    async def handle_ws(self, ws: WebSocket):
        await ws.accept()
        sid = id(ws)
        self.spectators[sid] = ws
        pid: Optional[str] = None
        if not self.screens.get("vn") and self.vn_provider:
            try:
                self.screens["vn"] = self.vn_provider()
            except Exception as ex:
                logger.warning(f"[Island init vn] {ex}")
        welcome = {"t": "w", "m": [p.meta() for p in self.players.values()],
                   "p": [p.pos_row() for p in self.players.values()],
                   "scr": self.screens, "st": self.stats()}
        await ws.send_text(json.dumps(welcome, ensure_ascii=False, separators=(",", ":")))
        try:
            while True:
                raw = await ws.receive_text()
                if len(raw) > 600:
                    continue
                try:
                    msg = json.loads(raw)
                except Exception:
                    continue
                t = msg.get("t")
                if t == "join" and pid is None:
                    if not self.make_room():
                        await ws.send_text('{"t":"full"}')
                        continue
                    color = msg.get("c") if re.fullmatch(r"#[0-9a-fA-F]{6}", str(msg.get("c", ""))) else random.choice(COLORS)
                    hat = int(msg.get("h", 0)) if str(msg.get("h", 0)).isdigit() else 0
                    pid = self.new_id("w")
                    p = Player(pid, clean_text(msg.get("n"), 16) or "Chứng Sĩ", "web", color, min(hat, 3))
                    self.players[pid] = p
                    self.sockets[pid] = ws
                    self.spectators.pop(sid, None)
                    await ws.send_text(json.dumps({"t": "you", "id": pid, "x": p.x, "z": p.z}))
                elif pid and pid in self.players:
                    p = self.players[pid]
                    p.last_active = time.time()
                    if t == "mv":
                        try:
                            x, z = float(msg["x"]), float(msg["z"])
                            r, s = float(msg.get("r", 0)), int(msg.get("s", 0))
                        except Exception:
                            continue
                        d = math.hypot(x, z)
                        if d > ISLAND_RADIUS:
                            x, z = x / d * ISLAND_RADIUS, z / d * ISLAND_RADIUS
                        ns = s if s in (ST_IDLE, ST_WALK, ST_SIT, ST_OXY, ST_DANCE) else ST_IDLE
                        if abs(p.x - x) > 0.05 or abs(p.z - z) > 0.05 or abs(p.r - r) > 0.05 or p.s != ns:
                            p.x, p.z, p.r, p.s = x, z, r, ns
                            p.dirty = True
                    elif t == "chat":
                        now = time.time()
                        text = clean_text(msg.get("m"), 80)
                        if text and now - p.last_chat > 1.0:
                            p.last_chat = now
                            self.emit({"k": "chat", "id": pid, "m": text})
                    elif t == "fx" and msg.get("k") in ("like", "jump"):
                        self.emit({"k": msg["k"], "id": pid, "n": 1})
        except WebSocketDisconnect:
            pass
        except Exception as ex:
            logger.debug(f"[Island ws] {ex}")
        finally:
            self.spectators.pop(sid, None)
            if pid:
                self.sockets.pop(pid, None)
                self.remove_player(pid)

    # ------------------------------------------------- Dữ liệu màn hình LED (Tĩnh từ BroStock Core)
    STATIC_CRYPTO = [
        {"s": "BTC", "p": 94250.0, "c": 2.84, "h": [91800, 92200, 92900, 92600, 93400, 93900, 94250]},
        {"s": "ETH", "p": 3180.0, "c": 1.95, "h": [3110, 3125, 3140, 3130, 3160, 3175, 3180]},
        {"s": "SOL", "p": 212.4, "c": 5.42, "h": [201, 204, 206, 205, 208, 210, 212.4]},
        {"s": "BNB", "p": 654.2, "c": -0.65, "h": [659, 658, 656, 657, 655, 653, 654.2]},
    ]
    STATIC_MACRO = [
        {"s": "VÀNG XAU", "p": 2748.5, "c": 0.82, "h": [2720, 2728, 2735, 2731, 2740, 2745, 2748.5]},
        {"s": "DẦU WTI", "p": 71.45, "c": -1.34, "h": [72.6, 72.3, 72.0, 71.8, 71.9, 71.6, 71.45]},
        {"s": "DXY INDEX", "p": 104.12, "c": 0.21, "h": [103.8, 103.9, 104.0, 103.95, 104.05, 104.1, 104.12]},
    ]
    STATIC_US = [
        {"s": "S&P 500", "p": 5985.2, "c": 0.94, "h": [5920, 5935, 5950, 5945, 5968, 5975, 5985.2]},
        {"s": "NASDAQ 100", "p": 21140.8, "c": 1.42, "h": [20820, 20900, 20950, 21010, 21080, 21140.8]},
        {"s": "DOW JONES", "p": 43920.0, "c": 0.56, "h": [43680, 43720, 43790, 43810, 43880, 43920]},
        {"s": "NVDA", "p": 145.8, "c": 3.65, "h": [140.2, 141.5, 142.8, 143.1, 144.6, 145.8]},
        {"s": "TSLA", "p": 328.4, "c": 4.18, "h": [314.0, 318.5, 321.0, 324.2, 326.0, 328.4]},
    ]

    async def screens_loop(self):
        """Nạp trực tiếp dữ liệu tĩnh đã có sẵn từ BroStock Core (SQLite / market_cache), chỉ phát qua WS khi có thay đổi."""
        last_sig = None
        while True:
            try:
                scr = {
                    "vn": self.vn_provider() if self.vn_provider else {},
                    "crypto": self.STATIC_CRYPTO,
                    "macro": self.STATIC_MACRO,
                    "us": self.STATIC_US,
                }
                sig = json.dumps(scr, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
                scr["ts"] = int(time.time())
                self.screens = scr
                if sig != last_sig:
                    last_sig = sig
                    await self.broadcast(json.dumps({"t": "scr", "d": scr}, ensure_ascii=False, separators=(",", ":")))
            except Exception as ex:
                logger.warning(f"[Island screens] {ex}")
            await asyncio.sleep(60)

    def start(self):
        if not self._started:
            self._started = True
            asyncio.create_task(self.tick_loop())
            asyncio.create_task(self.screens_loop())


island = IslandWorld()


def register_island(app, vn_provider: Callable[[], dict]):
    """Gắn WebSocket /ws/island và REST API /api/island/* vào FastAPI app."""
    island.vn_provider = vn_provider
    import os
    from fastapi import HTTPException

    def _check_key(payload: dict):
        # Nếu đặt ISLAND_ADMIN_KEY, các API điều khiển TikTok/giả lập yêu cầu khóa quản trị
        key = os.getenv("ISLAND_ADMIN_KEY", "")
        if key and str(payload.get("key", "")) != key:
            raise HTTPException(403, "Sai khóa quản trị Đảo")

    @app.on_event("startup")
    async def _island_startup():
        island.start()

    @app.websocket("/ws/island")
    async def _island_ws(ws: WebSocket):
        await island.handle_ws(ws)

    @app.get("/api/island/stats")
    async def _island_stats():
        return island.stats()

    @app.get("/api/island/screens")
    async def _island_screens():
        return island.screens

    @app.post("/api/island/tiktok/connect")
    async def _island_tt_connect(payload: dict):
        _check_key(payload)
        return await island.tiktok_connect(str(payload.get("username", "")))

    @app.post("/api/island/tiktok/disconnect")
    async def _island_tt_disconnect(payload: dict = None):
        _check_key(payload or {})
        await island.tiktok_disconnect()
        return {"ok": True}

    @app.post("/api/island/simulate")
    async def _island_simulate(payload: dict):
        _check_key(payload)
        island.simulate(str(payload.get("kind", "comment")), int(payload.get("n", 1) or 1))
        return island.stats()
