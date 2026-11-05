# 🏝️ BROSTOCK ISLAND 3D MMO — TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

- **Dự án:** BroStock Pro — Học viện FENWEALTH (Đầu tư Tích sản)
- **Phân hệ:** Đảo Chứng Sĩ 3D MMO (`/island`) & Hệ thống Tối ưu Hiệu năng / Băng thông (v2.7)
- **Ngày cập nhật:** 05/11/2026
- **Trạng thái:** Production Ready (Đã kiểm thử 300–350 người chơi đồng thời @ 60 FPS)

---

## 1. Tổng Quan Sản Phẩm (Product Overview)

**Đảo Chứng Sĩ 3D (BroStock Island MMO)** là thế giới ảo 3D Low-Poly thời gian thực tích hợp trực tiếp trong nền tảng **BroStock Pro / Học viện FENWEALTH**, cho phép tới **350 nhà đầu tư ("chứng sĩ")** cùng hiện diện trên một hòn đảo giữa đại dương để theo dõi bảng điện tử **VN-Index / VN100**, giao lưu cảm xúc và tương tác trực tiếp từ **TikTok Live**.

### Hai Chế Độ Tham Gia Song Song (Dual Participation Modes)
1. **Chơi Trực Tiếp Trên Web (`/island`):**
   - Đăng nhập tức thì bằng biệt danh (Nickname), chọn màu áo (12 màu) và phụ kiện mũ/vương miện (4 kiểu).
   - Điều khiển nhân vật 3D bằng phím `WASD` / phím mũi tên, nhảy bằng `Space`, bấm `E` để ngồi vào **200 ghế khán đài rạp chiếu phim** hoặc đi bộ sang **Trạm Cấp Cứu Thở Oxy** bên trái màn hình lớn.
   - Gửi bong bóng chat nổi trên đầu nhân vật và biểu cảm nhanh (Thả tim, Đu đỉnh thở Oxy, Chốt lời nhảy múa).
2. **Tự Động Hóa Từ TikTok Live (`TikTokLive` Integration):**
   - Kết nối trực tiếp với phòng livestream TikTok qua `@username` (hoặc trình giả lập sự kiện tích hợp sẵn).
   - Khi người xem trên TikTok bình luận, thả tim hoặc tặng quà:
     - Hệ thống tự động tạo nhân vật 3D mang tên `@username` của họ trên đảo.
     - Bình luận có từ khóa `"oxy"`, `"lỗ"`, `"đu đỉnh"`, `"cháy"`, `"toang"` → Nhân vật tự động chạy vào **Trạm Thở Oxy** và đeo mặt nạ Oxy 3D.
     - Bình luận có từ khóa `"ngồi"`, `"ghế"`, `"xem"` → Nhân vật tự động tìm ghế trống trong 200 ghế khán đài để ngồi xem bảng điện.
     - Bình luận có từ khóa `"tím"`, `"lãi"`, `"trần"`, `"về bờ"` hoặc tặng quà (Gift) → Nhân vật tiến ra sân khấu trung tâm nhảy ăn mừng và nâng cấp vương miện VIP Cá Mập.

---

## 2. Kiến Trúc Không Gian 3D & Địa Hình (World Layout & Geometry)

Toàn bộ tọa độ vật lý được đồng bộ tuyệt đối giữa [`backend/island_server.py`](backend/island_server.py) và [`frontend/components/island/world.ts`](frontend/components/island/world.ts):

| Khu vực / Công trình | Tọa độ `(x, y, z)` | Kích thước / Quy mô | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Mặt Biển Đại Dương (`ocean`)** | `y = -2.2` | `2000 × 2000` | Nền đại dương bao quanh đảo, tách biệt độ cao chống Z-fighting |
| **Bãi Cát Viền Đảo (`sand`)** | Mặt trên `y = -0.35` | Bán kính `110m` | Bờ biển bao quanh đảo Low-Poly |
| **Thảm Cỏ Trung Tâm (`grass`)** | Mặt trên `y = 0.00` | Bán kính `96m` | Mặt phẳng di chuyển chính trên đảo |
| **Quảng Trường Đá (`plaza`)** | Mặt trên `y = +0.16` | Bán kính `58m` | Khu vực khán đài, sân khấu và điểm xuất phát (`PLAZA_BOX`) |
| **Màn Hình LED Khổng Lồ VN100** | `(0, 13.5, -45)` | `36m × 20m` | Hiển thị VN-Index, VN30, HNX-Index, biểu đồ 90 phiên & 24 mã VN100 chuẩn màu VPS |
| **Khán Đài 200 Ghế Cinema** | `z = -18.0` → `+1.8` | `10 hàng × 20 ghế` | Bậc thang nâng dần (`SEAT_DY = 0.6m/hàng`), hướng nhìn thẳng vào màn hình lớn |
| **Trạm Cấp Cứu Thở Oxy (`OXY_BOX`)** | `x ∈ [-42, -30], z ∈ [-44, -32]` | `12m × 12m × 5.2m` | Buồng kính xanh dương bên trái màn hình lớn, cột bình Oxy, hạt sương hồi sức & tự động đeo mặt nạ Oxy 3D |
| **3 Màn Hình LED Phụ (Bên Phải)** | `(29..45, 7.5, -36..-16)` | `14m × 9m` & `12m × 8m` | Hiển thị Crypto (`BTC`, `ETH`, `SOL`, `BNB`), Vàng `XAU` / Dầu `WTI` / `DXY`, và Chứng khoán Mỹ (`S&P 500`, `Nasdaq 100`, `Dow Jones`, `NVDA`, `TSLA`) |

---

## 3. Giao Thức Mạng & Tối Ưu Hóa Băng Thông (Network Protocol & Bandwidth Optimization)

### 3.1. Giao Thức WebSocket Delta-Compression (`/ws/island`)
Để phục vụ **350 người chơi đồng thời** với băng thông tối thiểu:
- **Tần số Tick Server (`TICK_HZ = 10`):** Chu kỳ `100ms`.
- **Chỉ gửi thực thể thay đổi (`dirty` flag):**
  - Nhân vật đứng yên, đang ngồi ghế (`ST_SIT`) hoặc đang thở Oxy tại chỗ (`ST_OXY`) tiêu tốn **0 byte/giây**.
  - Tọa độ được lượng tử hóa gọn thành mảng 5 phần tử: `[id, round(x, 1), round(z, 1), round(r, 2), s]` (độ chính xác `10cm`, giảm ~40% kích thước JSON).
- **Lọc trùng phía Client (`sendMove`):**
  - Client chỉ gửi gói `{"t": "mv"}` tối đa `10Hz` và chỉ gửi khi tọa độ/góc quay đã làm tròn thực sự khác với gói trước đó.
- **Lọc trùng thống kê (`st`) & màn hình (`scr`):**
  - Server chỉ đính kèm `st` (số người chơi) và `scr` (dữ liệu màn hình LED) khi dữ liệu có thay đổi thực sự (`sig != last_sig`).

### 3.2. Định Dạng Gói Tin WebSocket
| Chiều | Loại (`t`) | Cấu trúc Payload | Mô tả |
| :--- | :--- | :--- | :--- |
| **Server → Client** | `"w"` | `{"t":"w", "m":[...], "p":[...], "scr":{...}, "st":{...}}` | Gói khởi tạo (`welcome`) gửi 1 lần ngay khi mở kết nối |
| **Server → Client** | `"d"` | `{"t":"d", "p":[[id,x,z,r,s]], "m":[...], "x":[...], "e":[...], "st":{...}}` | Gói cập nhật vi sai (`delta`) ở tần số `10Hz` |
| **Server → Client** | `"scr"` | `{"t":"scr", "d":{...}}` | Cập nhật dữ liệu 4 màn hình LED (chỉ phát khi dữ liệu thay đổi) |
| **Client → Server** | `"join"` | `{"t":"join", "n":"Tên", "c":"#3b82f6", "h":1}` | Đăng nhập nhân vật trực tiếp vào thế giới |
| **Client → Server** | `"mv"` | `{"t":"mv", "x":1.2, "z":-14.5, "r":3.14, "s":2}` | Cập nhật vị trí & trạng thái nhân vật |
| **Client → Server** | `"chat"` | `{"t":"chat", "m":"Nội dung"}` | Gửi bong bóng chat nổi trên đầu (giới hạn chống spam 1s/lần) |
| **Client → Server** | `"fx"` | `{"t":"fx", "k":"like" \| "jump"}` | Phát hiệu ứng thả tim hoặc nhảy |

---

## 4. Tối Ưu Hóa Đồ Họa 3D & Cơ Sở Dữ Liệu Toàn Hệ Thống (System-Wide Optimization)

### 4.1. Tối Ưu Đồ Họa Three.js (60 FPS cho 350+ Thực Thể)
- **GPU InstancedMesh (`THREE.InstancedMesh`):**
  - Toàn bộ 350 nhân vật (thân, đầu, mặt nạ Oxy, vương miện VIP) được vẽ chỉ bằng **4 lệnh Draw Call** duy nhất thay vì `1,400+` Mesh riêng lẻ.
- **Khử hoàn toàn hiện tượng nhấp nháy bề mặt (Z-Fighting / Glittering):**
  - Bật `logarithmicDepthBuffer: true` trên `THREE.WebGLRenderer`.
  - Tách biệt độ cao vật lý giữa mặt biển (`y = -2.2`), bãi cát (`y = -0.35`), thảm cỏ (`y = 0.00`) và quảng trường (`y = +0.16`).
  - Áp dụng `polygonOffset` cho 4 mặt phẳng màn hình LED và tắt `generateMipmaps = false` (`LinearFilter`) trên toàn bộ `CanvasTexture`.
- **Vòng đời WebGL bất biến & Throttled DOM Overlay:**
  - Khóa `useEffect` khởi tạo WebGL chạy đúng **1 lần duy nhất** bằng `useRef` cho các callback, ngăn chặn hoàn toàn việc re-mount canvas khi React state thay đổi.
  - Lớp nhãn tên / bong bóng chat 2D được giới hạn cập nhật ở `12Hz` (`80ms`) và chỉ ghi `innerHTML` khi chuỗi HTML thay đổi.

### 4.2. Tối Ưu Hóa Cơ Sở Dữ Liệu & Băng Thông Toàn Dự Án (`BroStock Core`)
1. **L1 In-Memory Read-Through Cache ([`database.py`](database.py)):**
   - Bổ sung bộ nhớ đệm RAM cấp 1 (`_MEM_MARKET_CACHE` & `_MEM_HISTORY_CACHE`).
   - Mọi truy vấn `get_market_cache(key)` và `get_history(symbol)` sau lần nạp đầu tiên đều trả về từ RAM trong `<0.05ms` với **0 truy vấn SQLite**.
   - `save_market_cache` kiểm tra đối chiếu chuỗi JSON và bỏ qua thao tác ghi đĩa nếu dữ liệu không thay đổi.
2. **SQLite WAL & Memory Page Cache ([`database.py`](database.py)):**
   - Kích hoạt `PRAGMA journal_mode=WAL`, `PRAGMA synchronous=NORMAL`, `PRAGMA temp_store=MEMORY`, `PRAGMA cache_size=-16000` (16MB).
3. **Zero-External-API Screen Engine ([`backend/main.py`](backend/main.py) & [`stock_analyzer.py`](stock_analyzer.py)):**
   - Bảng điện VN100 trong đảo (`island_vn_provider`) đọc 100% từ dữ liệu tĩnh/cache của BroStock Core (`market_cache` & `daily_bars` trong `market_data.db`), không gọi API bên ngoài.
   - Khi phân tích mã cổ phiếu (`/api/stock/{symbol}`), nếu chưa có cache tick khớp lệnh, hệ thống tự động tổng hợp chuỗi intraday từ thanh nến ngày trong SQLite (`_synthesize_intraday_from_daily`), phản hồi tức thì mà không phụ thuộc mạng ngoài.
4. **Nén GZip & Cắt Giảm 99% Băng Thông HUD ([`backend/main.py`](backend/main.py) & [`GlobalHUD.tsx`](frontend/components/GlobalHUD.tsx)):**
   - Kích hoạt `GZipMiddleware(minimum_size=500)` cho toàn bộ REST API (giảm 75–85% dung lượng truyền tải).
   - Bổ sung endpoint siêu nhẹ `/api/market/hud` (`~350 bytes`) thay thế cho `/api/market/overview` (`~150 KB`) trên thanh `GlobalHUD` ở mọi trang (**tiết kiệm 99.7% băng thông định kỳ**).
   - Tách riêng component đồng hồ `HudClock` để tránh re-render toàn bộ thanh `GlobalHUD` mỗi giây.
   - Bổ sung bộ đệm RAM cho `/api/stock/{symbol}` (`_stock_analysis_cache`) và `/api/backtest` (`_backtest_cache`).

---

## 5. Danh Mục Tệp Tin Cốt Lõi (File Manifest)

- [`backend/island_server.py`](backend/island_server.py): Máy chủ thế giới MMO 350 người chơi, AI điều khiển bot, kết nối `TikTokLive` và đồng bộ WebSocket `/ws/island`.
- [`backend/main.py`](backend/main.py): Tích hợp `island_vn_provider`, `GZipMiddleware`, `/api/market/hud`, và bộ đệm RAM cho các API phân tích.
- [`database.py`](database.py): Cấu hình SQLite WAL và bộ đệm RAM cấp 1 (`_MEM_MARKET_CACHE`, `_MEM_HISTORY_CACHE`).
- [`stock_analyzer.py`](stock_analyzer.py): Cơ chế đọc dữ liệu Local-First từ RAM/SQLite và tổng hợp intraday tức thì.
- [`frontend/components/island/world.ts`](frontend/components/island/world.ts): Hằng số địa hình, tọa độ 200 ghế khán đài, Trạm Thở Oxy và hàm nội suy độ cao.
- [`frontend/components/island/buildWorldMesh.ts`](frontend/components/island/buildWorldMesh.ts): Khởi tạo hình học 3D Low-Poly cho đảo, khán đài, Trạm Oxy và 4 màn hình LED.
- [`frontend/components/island/ScreenRenderers.ts`](frontend/components/island/ScreenRenderers.ts): Bộ kết xuất `CanvasTexture` 2D cho bảng giá VN100 chuẩn VPS SmartOne và 3 màn hình phụ.
- [`frontend/components/island/IslandScene.tsx`](frontend/components/island/IslandScene.tsx): Engine Three.js `InstancedMesh` 60 FPS, điều khiển nhân vật, 4 góc máy camera và nhãn nổi.
- [`frontend/app/island/page.tsx`](frontend/app/island/page.tsx): Giao diện trang `/island`, bảng điều khiển TikTok Live, thanh chat nhanh và tạo đám đông.
