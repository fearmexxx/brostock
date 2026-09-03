# Kế Hoạch Đưa BroStock Pro Lên Sóng (Go-Live) Cùng Học Viện FENWEALTH
> **Mục tiêu:** Đưa hệ thống BroStock Pro vào vận hành thực tế như một công cụ thiết bị đầu cuối định lượng phục vụ học viên & cộng đồng Học viện FENWEALTH (Đầu tư tích sản) trong 2 tuần tới.

---

## 1. Định vị hệ thống trong Hệ sinh thái FENWEALTH

| Hạng mục | Vai trò | Trạng thái kỹ thuật |
| :--- | :--- | :---: |
| **Học viện FENWEALTH** | Đơn vị chủ quản, đào tạo triết lý đầu tư tích sản, tư duy phân bổ tài sản dài hạn. | 🎯 Đang xây dựng |
| **BroStock Pro** | Công cụ thiết bị đầu cuối định lượng (Quantitative Terminal), hỗ trợ lọc cổ phiếu, phân tích dòng tiền và đo lường rủi ro. | ✅ SẴN SÀNG |
| **Bảng xếp hạng Alpha (Tích luỹ 3-6M)** | Bộ lọc chiến lược gom cổ phiếu nền giá vững, biến động thấp, định giá hợp lý cho học viên tích sản. | ✅ HOÀN THIỆN |
| **Bảng xếp hạng Alpha (Swing T+15)** | Dành cho học viên muốn tối ưu hoá dòng tiền ngắn hạn dựa trên đà tăng trưởng (Momentum). | ✅ HOÀN THIỆN |
| **Kiểm thử thực chiến (Backtest)** | Minh chứng lịch sử 250 phiên thực tế (đã trừ 0.4% thuế & phí) giúp học viên kiên định đầu tư. | ✅ HOÀN THIỆN |
| **Phái sinh VN30F Daily Bias** | Công cụ phòng vệ danh mục (Hedging) khi thị trường chung bước vào pha giảm mạnh. | ✅ HOÀN THIỆN |
| **Tài liệu thuật toán (/doc)** | Giáo trình kĩ thuật giải thích toàn bộ công thức và cơ chế thích ứng ADX. | ✅ HOÀN THIỆN |

---

## 2. Kế hoạch hành động 14 ngày (14-Day Action Plan)

```
Tuần 1: Ổn định máy chủ & Tích hợp cổng thành viên
├── Ngày 1-2: Cấu hình UptimeRobot giữ Render Backend luôn thức (không bị Cold-Start)
├── Ngày 3-4: Thiết lập tên miền (Vercel Custom Domain) cho BroStock Terminal
└── Ngày 5-7: Kiểm tra kết nối dữ liệu và bộ nhớ đệm SQLite

Tuần 2: Thử nghiệm thực chiến & Giới thiệu học viên FENWEALTH
├── Ngày 8-10: Test tín hiệu trực tiếp trong phiên giao dịch (09:15 - 14:45)
├── Ngày 11-12: Hướng dẫn đội ngũ Mentor FENWEALTH sử dụng công cụ
└── Ngày 13-14: Chính thức mở quyền truy cập cho học viên & cộng đồng FENWEALTH
```

### 🗓️ TUẦN 1: Cấu hình hạ tầng & Ổn định Server

#### Bước 1: Chống hiện tượng Cold Start (Ngủ đông) của Render
- Vì backend chạy trên Render instance, nếu không có truy cập trong 15 phút, server sẽ ngủ đông và mất ~45 giây để khởi động lại.
- **Giải pháp:**
  - Dùng dịch vụ miễn phí như **UptimeRobot** hoặc **Cron-Job.org** tạo ping mỗi 5 phút gửi GET request tới:
    `https://brostock-backend.onrender.com/api/health`
  - Đảm bảo server luôn ấm (warm) 100%, học viên mở web là dữ liệu hiển thị tức thì.

#### Bước 2: Thiết lập tên miền tùy chỉnh (Custom Domain)
- Trong Dashboard Vercel của dự án `frontend`:
  - Vào **Settings** -> **Domains**.
  - Thêm tên miền mong muốn (ví dụ `terminal.fenwealth.vn` hoặc subdomain theo tên miền học viện).
  - Vercel sẽ tự động cấp chứng chỉ SSL HTTPS an toàn.

#### Bước 3: Kiểm tra biến môi trường
- **Frontend (Vercel):**
  - `NEXT_PUBLIC_API_URL`: `https://brostock-backend.onrender.com`
- **Backend (Render):**
  - `ALLOWED_ORIGINS`: Danh sách domain FENWEALTH hoặc để trống để nhận diện tự động.
  - `ENABLE_TELEGRAM_BOT`: `true`

---

### 🗓️ TUẦN 2: Thử nghiệm thực tế & Khởi chạy cùng Học viện

#### Bước 4: Kiểm thử trong phiên giao dịch thực tế
- Theo dõi hệ thống trong các khung giờ giao dịch then chốt:
  - **Khung 09:15 - 10:30:** Kiểm tra bảng giá mở cửa và tín hiệu quét sớm.
  - **Khung 11:00 - 11:30:** Kiểm tra sức mạnh dòng tiền Smart Money (Shark Flow) gom/xả.
  - **Khung 14:00 - 14:45:** Đối chiếu điểm Target/Stop Loss và sức mạnh tích luỹ dài hạn.

#### Bước 5: Ứng dụng tính năng "Sao chép khuyến nghị" chia sẻ vào cộng đồng học viên
- Mentor và quản trị viên chỉ cần click nút **Copy** ngay cạnh mã cổ phiếu trên bảng Alpha:
  - Định dạng chuẩn Zalo/Telegram tự động sinh ra:
    ```
    📊 [FENWEALTH - TÍN HIỆU ĐẦU TƯ TÍCH SẢN]
    Mã cổ phiếu: HPG (Thép & Vật liệu)
    Giá hiện tại: 28,500 VNĐ (+2.15%)
    Chiến lược: Tích luỹ Nắm giữ (3-6 Tháng)
    Khuyến nghị: TÍCH LŨY (Điểm: +72 | TIN CẬY CAO)
    🎯 Mục tiêu Net: 33,500 VNĐ (+17.54%)
    🛡️ Cắt lỗ Net: 26,000 VNĐ (-8.77%)
    Tỷ lệ R:R: 2.0:1
    Hiệu suất kiểm thử: Thắng 78% | Lời TB: +8.40% (Đã trừ thuế & phí 0.4%)
    --
    👉 Nền tảng: BroStock Pro by Học viện FENWEALTH
    ```
  - Giúp việc chia sẻ cơ hội và thảo luận bài học tích sản trong cộng đồng trở nên chuẩn xác và trực quan.

---

## 3. Quy trình vận hành định kỳ

1. **Kiểm tra trạng thái máy chủ:** `https://brostock-backend.onrender.com/api/health`
2. **Cập nhật dữ liệu thủ công (khi cần):** `https://brostock-backend.onrender.com/api/market/update`
3. **Tra cứu thông tin học viện:** `https://brostock-backend.onrender.com/api/academy/info`
