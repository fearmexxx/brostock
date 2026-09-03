# Kế Hoạch Đưa BroStock Pro Lên Sóng (Go-Live) Cho VBE Agency (vbe.com.vn)
> **Mục tiêu:** Đưa hệ thống vào vận hành thực tế phục vụ đội ngũ chuyên viên tư vấn và khách hàng VBE Agency trong vòng 2 tuần tới.

---

## 1. Đánh giá hiện trạng hệ thống (System Readiness Audit)

| Hạng mục | Trạng thái | Ghi chú vận hành |
| :--- | :---: | :--- |
| **Backend Core (FastAPI)** | ✅ SẴN SÀNG | Chạy trên Python 3.11.8, tích hợp đa luồng tính toán tín hiệu. |
| **Dữ liệu thị trường (vnstock VCI)** | ✅ HOẠT ĐỘNG | Dữ liệu EOD 250 phiên & Intraday khớp lệnh liên tục. |
| **Bảng xếp hạng Alpha (Top 100)** | ✅ SẴN SÀNG | Phân loại 2 chế độ: Swing (T+15) & Tích luỹ dài hạn (3-6M). |
| **Kiểm thử thực chiến (Backtest)** | ✅ ĐÃ TRỪ PHÍ | Trừ 0.4% thuế & phí môi giới VN, xếp hạng Tin cậy Cao/TB/Rủi ro. |
| **Phái sinh VN30F Daily Bias** | ✅ SẴN SÀNG | Đo lường Basis Spread, Momentum kép, điểm Chốt lời/Cắt lỗ ATR. |
| **Tài liệu thuật toán (/doc)** | ✅ HOÀN TẤT | Minh bạch toàn bộ công thức toán học và trọng số. |
| **Nhận diện VBE Agency (vbe.com.vn)** | ✅ TÍCH HỢP | Navbar, Footer pháp lý UBCKNN, nút sao chép lệnh cho môi giới. |

---

## 2. Kế hoạch hành động chi tiết 14 ngày (14-Day Action Plan)

```
Tuần 1: Hạ tầng, Tên miền & Ổn định Server
├── Ngày 1-2: Trỏ Subdomain stock.vbe.com.vn về Vercel
├── Ngày 3-4: Cấu hình chống ngủ đông (Keep-Alive) cho Render Backend
└── Ngày 5-7: Kiểm tra đồng bộ dữ liệu SQLite / Cloud Database

Tuần 2: Thử nghiệm thực chiến & Ra mắt khách hàng
├── Ngày 8-10: Môi giới VBE test lệnh trong phiên giao dịch thật (9:15 - 14:45)
├── Ngày 11-12: Hoàn thiện kênh Telegram VIP bắn tín hiệu tự động
└── Ngày 13-14: Chính thức công bố và phân quyền cho khách hàng VBE Agency
```

### 🗓️ TUẦN 1: Cấu hình hạ tầng & Tên miền doanh nghiệp

#### Bước 1: Trỏ tên miền phụ thương hiệu VBE Agency (`stock.vbe.com.vn`)
1. Đăng nhập trang quản trị DNS của domain `vbe.com.vn`.
2. Tạo bản ghi CNAME:
   - **Host / Name:** `stock` (hoặc `terminal`)
   - **Type:** `CNAME`
   - **Value:** `cname.vercel-dns.com`
3. Trong Dashboard Vercel của dự án `frontend`:
   - Vào **Settings** -> **Domains**.
   - Thêm `stock.vbe.com.vn`. Vercel sẽ tự động cấp chứng chỉ SSL HTTPS miễn phí.

#### Bước 2: Chống hiện tượng Cold Start (Ngủ đông) của Render Free Tier
- Vì backend chạy trên Render free instance, nếu không có truy cập trong 15 phút, server sẽ ngủ đông và mất ~45 giây để khởi động lại.
- **Giải pháp:**
  - Dùng dịch vụ miễn phí như **UptimeRobot** hoặc **Cron-Job.org** tạo ping mỗi 5 phút gửi GET request tới:
    `https://brostock-backend.onrender.com/api/health`
  - Đảm bảo server luôn ấm (warm) 100%, phản hồi tức thì cho chuyên viên và khách hàng trong giờ giao dịch.

#### Bước 3: Kiểm tra biến môi trường (Environment Variables)
- **Frontend (Vercel):**
  - `NEXT_PUBLIC_API_URL`: `https://brostock-backend.onrender.com`
- **Backend (Render):**
  - `ALLOWED_ORIGINS`: `https://stock.vbe.com.vn,https://vbe.com.vn,https://brostock-odn5.vercel.app`
  - `ENABLE_TELEGRAM_BOT`: `true`
  - `TELEGRAM_BOT_TOKEN`: Token bot chính thức của VBE.

---

### 🗓️ TUẦN 2: Thử nghiệm thực tế & Khởi chạy thương mại

#### Bước 4: Kiểm thử trong phiên giao dịch thực tế (Real-Time Live Testing)
- Cho 2-3 chuyên viên phân tích của VBE Agency theo dõi hệ thống trực tiếp trong 3 phiên giao dịch liên tiếp từ thứ Hai đến thứ Tư:
  - **Khung 09:15 - 10:30:** Kiểm tra bảng giá mở cửa và quét tín hiệu ATO.
  - **Khung 11:00 - 11:30:** Kiểm tra sức mạnh dòng tiền Shark Flow (dòng tiền lớn gom/xả).
  - **Khung 14:00 - 14:45:** Đối chiếu điểm Target/Stop Loss của nhóm cổ phiếu Alpha Swing T+15.

#### Bước 5: Ứng dụng tính năng "Sao chép khuyến nghị" tư vấn khách hàng
- Chuyên viên tư vấn chỉ cần click nút **Copy** ngay cạnh mã cổ phiếu trên bảng Alpha:
  - Định dạng chuẩn Zalo/Telegram tự động sinh ra:
    ```
    📊 [VBE AGENCY - KHUYẾN NGHỊ ĐẦU TƯ]
    Mã cổ phiếu: HPG (Thép & Vật liệu)
    Giá hiện tại: 28,500 VNĐ (+2.15%)
    Chiến lược: Swing Trading (T+15)
    Khuyến nghị: MUA (Conviction: +68 | TIN CẬY CAO)
    🎯 Mục tiêu Net: 31,200 VNĐ (+9.47%)
    🛡️ Cắt lỗ Net: 27,200 VNĐ (-4.56%)
    Tỷ lệ R:R: 2.1:1
    Hiệu suất kiểm thử: Thắng 72% | Lời TB: +4.20% (Đã trừ thuế & phí 0.4%)
    --
    👉 Phân tích chi tiết: https://stock.vbe.com.vn | Terminal BroStock Pro
    ```
  - Giúp tiết kiệm 90% thời gian soạn thảo báo cáo, tư vấn nhanh và chuyên nghiệp cho khách hàng VIP.

#### Bước 6: Kích hoạt kênh Telegram cảnh báo tự động
- Đưa Telegram Bot vào nhóm chat VIP hoặc kênh Channel của VBE Agency:
  - Gõ lệnh `/subscribe` để đăng ký nhận Báo cáo Tổng kết phiên giao dịch EOD tự động vào lúc 16:00 mỗi ngày.
  - Sử dụng lệnh `/price <MÃ>` để tra cứu nhanh cho khách hàng ngay trên điện thoại.

---

## 3. Quy trình vận hành & Hỗ trợ kỹ thuật (SOP)

1. **Khởi động phiên sáng (08:45):** Kiểm tra trạng thái hệ thống tại `https://brostock-backend.onrender.com/api/health`.
2. **Cập nhật thủ công khi cần:** Truy cập `https://brostock-backend.onrender.com/api/market/update` để ép buộc làm mới cache toàn thị trường.
3. **Sao lưu dữ liệu:** Cơ sở dữ liệu SQLite `market_data.db` được lưu giữ lịch sử giao dịch và tín hiệu. Đối với quy mô mở rộng hàng nghìn khách hàng, có thể chuyển đổi sang Supabase / PostgreSQL qua biến `DB_CONNECTION_STRING`.
