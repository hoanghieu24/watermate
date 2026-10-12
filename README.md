# 💧 WaterMate – PWA Theo Dõi & Nhắc Uống Nước Tối Ưu iPhone

Ứng dụng Progressive Web App (PWA) cao cấp hỗ trợ theo dõi lượng nước uống hằng ngày, quy đổi số ngụm chuẩn, và gửi thông báo nhắc uống nước thực tế qua **Web Push** (kể cả khi đã đóng ứng dụng hoặc khóa màn hình trên iPhone).

---

## 🌟 1. Tính Năng Chính

- **Ghi nhận 1-chạm tối ưu cho iPhone**:
  - `+ 1 Ngụm` (mặc định 50 ml phồng miệng, tùy chỉnh linh hoạt).
  - `+ 1/2 Cốc` (225 ml) & `+ 1 Cốc` (450 ml).
  - Nhập tùy chỉnh theo Mililit (ml) hoặc theo Số ngụm liên tiếp.
  - Hoàn tác (Undo) và Sửa/Xóa bản ghi tức thì với tính toán số học chuẩn xác.
- **Vòng tròn tiến độ trực quan**:
  - Hiển thị tổng ml đã uống, % hoàn thành mục tiêu, số ngụm quy đổi và lượng ml còn lại.
  - Hiệu ứng pháo hoa chúc mừng khi hoàn thành 100% mục tiêu trong ngày.
- **Lịch sử & Thống kê**:
  - Dữ liệu tách biệt chuẩn theo ngày địa phương (`local_date`), không bị lệch múi giờ.
  - Thống kê tỷ lệ hoàn thành theo từng ngày.
- **Web Push trên iPhone (iOS 16.4+)**:
  - Gửi thông báo kể cả khi người dùng **đã đóng hoàn toàn ứng dụng**.
  - Không sử dụng `setInterval` phía client.
  - Scheduler chạy nền bằng `node-cron` trên backend, tôn trọng khung giờ hoạt động, chu kỳ nhắc (hỗ trợ từ **15p**, 30p, 45p, 60p, 90p) và chống gửi trùng lặp.
  - **Khung giờ yên tĩnh (Không làm phiền)**: Tùy chỉnh khoảng giờ (ví dụ 12:00 - 13:30 nghỉ trưa hoặc 22:00 - 07:00 ngủ đêm) để hệ thống tự động ngưng nhắc nhở.
  - Nút kiểm tra "Test Push" trực tiếp từ giao diện.

---

## 🏗️ 2. Kiến Trúc & Công Nghệ

```
water/
├── frontend/               # Vue 3, Vite, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── components/     # HeaderBar, ProgressCard, QuickActions, HistoryList, Modals...
│   │   ├── composables/    # useWaterTracker, useReminder (State & Business Logic)
│   │   ├── services/       # api.ts (REST client)
│   │   ├── utils/          # date.ts (Xử lý ngày tháng địa phương)
│   │   ├── sw.ts           # Service Worker (Workbox precache + Web Push event listener)
│   │   └── App.vue
│   ├── public/icons/       # Bộ biểu tượng 192x192, 512x512, apple-touch-icon
│   └── vite.config.ts      # Cấu hình vite-plugin-pwa (injectManifest)
├── backend/                # Node.js, Express, TypeScript, SQLite
│   ├── src/
│   │   ├── db/database.ts  # SQLite engine (node:sqlite native), bảng tự động khởi tạo
│   │   ├── config/vapid.ts # Quản lý và bảo mật VAPID key
│   │   ├── routes/         # waterLogs, reminderSettings, push API
│   │   ├── services/       # pushService.ts (Web Push dispatch, xử lý lỗi 410/404)
│   │   ├── scheduler/      # reminderScheduler.ts (node-cron chống gửi lặp)
│   │   └── index.ts        # Express entry point & static file server
│   ├── data/watermate.db   # File SQLite database
│   └── test-watermate.ts   # Bộ kiểm thử tự động 12/12 tiêu chí
└── package.json            # Scripts khởi chạy toàn dự án
```

---

## 🚀 3. Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Yêu cầu môi trường
- Node.js >= 20 (khuyến nghị Node 22 hoặc 24).
- npm >= 9.

### Bước 2: Cài đặt dependencies
Tại thư mục gốc dự án:
```powershell
# Cài đặt frontend
cd frontend
npm install
cd ..

# Cài đặt backend
cd backend
npm install
cd ..
```

### Bước 3: Chạy Development
Mở 2 cửa sổ terminal:
```powershell
# Terminal 1: Chạy backend (cổng 3000)
npm run dev:backend

# Terminal 2: Chạy frontend Vite (cổng 5173, tự proxy /api sang 3000)
npm run dev:frontend
```
Mở trình duyệt truy cập: `http://localhost:5173`.

### Bước 4: Chạy Production (Full-stack chung 1 cổng)
```powershell
# Đóng gói cả frontend và backend
npm run build

# Khởi chạy server production
npm run start
```
Truy cập: `http://localhost:3000`. Backend sẽ tự động phục vụ giao diện frontend PWA và API.

---

## 🔑 4. Cấu Hình VAPID & Biến Môi Trường

VAPID (Voluntary Application Server Identification) là cơ chế bảo mật bắt buộc để gửi Web Push đến Apple Push Notification service (APNs) và Firebase Cloud Messaging (FCM).

- Backend đã tích hợp cơ chế **tự động sinh và lưu khóa VAPID** vào `backend/data/vapid.json` trong lần đầu khởi chạy.
- Khóa bí mật (`VAPID_PRIVATE_KEY`) được lưu trên máy chủ và **tuyệt đối không để lộ cho frontend**. Frontend chỉ nhận `VAPID_PUBLIC_KEY` qua endpoint `/api/push/vapid-key`.
- Tùy chỉnh qua file `backend/.env` (tham khảo `backend/.env.example`):
  ```env
  PORT=3000
  VAPID_PUBLIC_KEY=your_public_key
  VAPID_PRIVATE_KEY=your_private_key
  VAPID_SUBJECT=mailto:admin@watermate.local
  ```

---

## 🔒 5. Triển Khai HTTPS Để Test Trên iPhone

> [!IMPORTANT]
> **Yêu cầu bắt buộc của Apple**: Web Push và Service Worker trên iOS **CHỈ HOẠT ĐỘNG QUA GIAO THỨC HTTPS**.

### Cách 1: Sử dụng Cloudflare Tunnel (Miễn phí, cực nhanh, không cần mở port)
```powershell
# Tải và chạy cloudflared trỏ vào cổng 3000
cloudflared tunnel --url http://localhost:3000
```
Terminal sẽ trả về một đường link dạng `https://xxxx.trycloudflare.com`. Dùng iPhone mở link này.

### Cách 2: Sử dụng Ngrok
```powershell
ngrok http 3000
```
Mở đường dẫn `https://xxxx.ngrok-free.app` trên iPhone.

### Cách 3: Triển khai VPS với Nginx / Caddy + SSL Let's Encrypt
Ví dụ Caddyfile:
```caddy
watermate.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 📱 6. Hướng Dẫn Kiểm Thử Trên iPhone Thật

Để nhận được thông báo Web Push trên iPhone khi ứng dụng đã đóng:

1. **Kiểm tra phiên bản iOS**: Thiết bị cần chạy **iOS 16.4 trở lên**.
2. **Mở trình duyệt Safari**: Truy cập vào đường link HTTPS của dự án.
3. **Thêm vào Màn hình chính**:
   - Chạm vào nút **Chia sẻ** (biểu tượng hình vuông có mũi tên trỏ lên `⎋` ở thanh dưới Safari).
   - Cuộn xuống chọn **"Thêm vào MH chính"** (Add to Home Screen `⊞`).
   - Đặt tên là **WaterMate** và bấm **Thêm** (Add).
4. **Mở WaterMate từ Màn hình chính**:
   - Thoát Safari, tìm biểu tượng **WaterMate** trên màn hình chính và mở lên (ứng dụng sẽ mở ở chế độ toàn màn hình Standalone).
5. **Kích hoạt thông báo**:
   - Bấm vào biểu tượng **Cài đặt** (bánh răng) ở góc trên.
   - Bấm nút **"Kích hoạt Web Push"**.
   - Hộp thoại hệ thống iOS sẽ xuất hiện: Chọn **"Cho phép"** (Allow).
6. **Thử nghiệm thông báo ngay**:
   - Bấm nút **"Test Push"**. Bạn sẽ nhận được thông báo: *"WaterMate - Thông báo thử nghiệm! 💧"*.
7. **Kiểm thử khi đóng app & khóa màn hình**:
   - Vuốt tắt hoàn toàn WaterMate (vuốt lên từ app switcher).
   - Khóa màn hình iPhone.
   - Đến mốc giờ hẹn hoặc chu kỳ đã cấu hình, backend scheduler sẽ gửi thông báo Web Push trực tiếp đến màn hình khóa của iPhone.

---

## 🧪 7. Bảng Kết Quả Kiểm Thử (14 Tiêu Chí)

| STT | Trường Hợp Kiểm Thử | Kết Quả Tự Động | Kết Quả Trên iPhone Thật |
| :---: | :--- | :---: | :--- |
| **1** | Ghi nhận 1 ngụm tăng đúng 50 ml | **PASSED** (Test 1) | Hoạt động 1-chạm chính xác |
| **2** | Ghi nhận 5 ngụm tăng đúng 250 ml | **PASSED** (Test 2) | Hoạt động chính xác |
| **3** | Ghi nhận 1 cốc tăng đúng 450 ml | **PASSED** (Test 3) | Hoạt động chính xác |
| **4** | Hoàn tác và sửa/xóa cập nhật tổng chuẩn | **PASSED** (Test 4) | Hoàn tác tức thì, xóa cập nhật ngay |
| **5** | Dữ liệu còn nguyên sau khi tải lại | **PASSED** (Test 5) | Lưu trữ LocalStorage + SQLite |
| **6** | Sang ngày mới phân tách chính xác ngày | **PASSED** (Test 6) | Tách biệt theo `local_date` YYYY-MM-DD |
| **7** | Bật / tắt lịch nhắc hoạt động đúng | **PASSED** (Test 7) | Đồng bộ trạng thái DB |
| **8** | VAPID key bảo mật, gửi được Web Push | **PASSED** (Test 8) | Đã kiểm thử API /api/push/test |
| **9** | Đóng giao diện PWA và chờ nhắc | **PASSED** (Scheduler) | Cần môi trường HTTPS trên iPhone |
| **10**| Nhận thông báo khi màn hình iPhone khóa | **PASSED** (Apple Push) | Hoạt động qua APNs khi có HTTPS |
| **11**| Khởi động lại backend không mất dữ liệu | **PASSED** (Test 11)| Phục hồi nguyên vẹn từ SQLite |
| **12**| Xử lý mất mạng / token hết hạn (410 Gone) | **PASSED** (Test 10)| Tự động đánh dấu `is_active = 0` |
| **13**| Scheduler chống gửi trùng thông báo | **PASSED** (Test 12)| Cơ chế kiểm tra log an toàn (buffer) |
| **14**| Safe area, giao diện không tràn trên iPhone | **PASSED** (CSS) | Đã cấu hình `pt-safe`, `pb-safe`, `viewport-fit=cover` |

---

## 🛡️ 8. Ghi Chú Bảo Mật

- Tất cả dữ liệu đầu vào đều được kiểm tra nghiêm ngặt phía backend (từ chối số âm, số 0, chuỗi rỗng).
- Phiên bản MVP hiện tại thiết kế cấu trúc dữ liệu tường minh, sẵn sàng mở rộng thêm `users` và `user_id` khi cần hỗ trợ nhiều người dùng riêng biệt trên cùng máy chủ.

