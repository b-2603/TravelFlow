# TravelFlow

Hệ thống quản lý du lịch gồm:
- Frontend: React 18 + Vite + Bootstrap 5
- Backend: Laravel 10 + JWT
- Database: MongoDB

Các vai trò đang có trong hệ thống:
- Khách hàng
- Nhân viên tư vấn
- Quản lý tour
- Đối tác dịch vụ
- Kế toán / Tài chính
- Hướng dẫn viên
- Quản trị viên

## Cấu trúc hiện tại

- `frontend/`: ứng dụng React đang dùng thật
- `backend/`: API Laravel đang dùng thật

Lưu ý:
- Thư mục backup scaffold cũ đã bị xóa
- Repo hiện chỉ còn phần dùng thật

## Yêu cầu

Để chạy local, bạn cần:
- MongoDB đang chạy ở `127.0.0.1:27017`
- Node.js 18+
- npm
- PHP 8.2+

PHP được ưu tiên theo thứ tự:
- `D:\codexphp\php.exe`
- `C:\Program Files\php\php.exe`
- hoặc `php` trong `PATH`

## Biến môi trường

Các file đang dùng:
- [backend/.env](d:/Công%20nghệ%20mới/bokinng_tour/backend/.env)
- [frontend/.env](d:/Công%20nghệ%20mới/bokinng_tour/frontend/.env)

Giá trị chính:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`
- API URL frontend: `http://localhost:8000/api`
- MongoDB: `mongodb://127.0.0.1:27017`

## Thanh toán chuyển khoản tự động (webhook)

Trong thực tế, để hệ thống tự đổi trạng thái sau khi khách chuyển khoản, cần tích hợp dịch vụ đối soát giao dịch/cổng thanh toán có **webhook** (thay vì để khách bấm "Tôi đã chuyển khoản").

Backend đã chuẩn bị endpoint webhook:
- `POST /api/webhooks/bank-transfer`
- Payload mẫu: `{ "reference": "PAY-XXXXXXXXXXXX", "amount": 2000, "paid_at": "2026-04-18T12:34:56+07:00" }`
- Hoặc có thể chỉ cần `description/content` chứa mã `PAY-...` (ví dụ: `BOOKING PAY-...`) + `amount` (webhook sẽ tự bóc mã `PAY-...` từ nội dung).
- Nếu cấu hình `BANK_TRANSFER_WEBHOOK_SECRET` thì gửi kèm header `X-Webhook-Secret` (hoặc field `secret`) để xác thực.

Lưu ý khi chạy local:
- Webhook là hệ thống **ngân hàng/dịch vụ** gọi về server của bạn, nên muốn test thực tế cần URL public (ví dụ dùng ngrok/cloudflared) hoặc gọi thử thủ công bằng Postman/curl.

## Cách chạy

### Cách nhanh nhất

Chỉ cần đứng trong `frontend` và chạy:

```powershell
cd "d:\Công nghệ mới\bokinng_tour\frontend"
npm run dev
```

Lệnh này sẽ:
- tự bật backend Laravel nếu chưa chạy
- sau đó chạy frontend Vite

Sau khi chạy:
- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

### Nếu muốn chạy thủ công

Backend:

```powershell
cd "d:\Công nghệ mới\bokinng_tour\backend"
& "D:\codexphp\php.exe" -c "D:\codexphp" artisan serve --host=127.0.0.1 --port=8000
```

Frontend:

```powershell
cd "d:\Công nghệ mới\bokinng_tour\frontend"
npm.cmd run dev:web
```

## Seed dữ liệu mẫu

### 🟢 Cách AN TOÀN (KHÔNG xóa dữ liệu cũ)

```powershell
cd "d:\Công nghệ mới\bokinng_tour\backend"
& "D:\codexphp\php.exe" -c "D:\codexphp" artisan db:seed
```

Seeder này sẽ **THÊM** dữ liệu mẫu mà **KHÔNG XÓA** dữ liệu hiện có. Sử dụng khi:
- Bạn muốn thêm dữ liệu mẫu lần đầu
- Bạn đã có dữ liệu và muốn giữ nguyên
- Tài khoản mới đăng ký sẽ KHÔNG bị mất

### 🔴 Cách RESET HOÀN TOÀN (XÓA toàn bộ dữ liệu)

```powershell
cd "d:\Công nghệ mới\bokinng_tour\backend"
& "D:\codexphp\php.exe" -c "D:\codexphp" artisan db:seed --class=InitialDataSeeder
```

**CẢNH BÁO:** Lệnh này sẽ **XÓA SẠCH** toàn bộ dữ liệu (users, bookings, tours, payments, v.v.) và tạo lại từ đầu. Chỉ sử dụng khi muốn reset hoàn toàn database!

### Các seeder có sẵn:

| Seeder | Mô tả | Hành động |
|--------|-------|-----------|
| `DatabaseSeeder` (mặc định) | Thêm dữ liệu mẫu an toàn | KHÔNG xóa dữ liệu cũ |
| `SampleDataSeeder` | Thêm dữ liệu mẫu chi tiết | KHÔNG xóa dữ liệu cũ |
| `InitialDataSeeder` | Reset và tạo mới toàn bộ | **XÓA TOÀN BỘ** dữ liệu |

Nếu MongoDB chưa chạy, lệnh seed sẽ lỗi kết nối.

## Đăng nhập

Trang đăng nhập:
- `http://localhost:5173/login`

Hệ thống cho phép đăng nhập bằng:
- tên đăng nhập
- hoặc email

## Tài khoản mẫu

### Quản trị viên
- Username: `quan_tri`
- Email: `quantri@gmail.com`
- Password: `Password@123`

### Quản lý tour
- Username: `quan_ly_tour_01`
- Email: `quanlytour01@gmail.com`
- Password: `Password@123`

### Nhân viên tư vấn
- Username: `tu_van_01`
- Email: `tuvan01@gmail.com`
- Password: `Password@123`

### Kế toán / Tài chính
- Username: `ke_toan_01`
- Email: `ketoan01@gmail.com`
- Password: `Password@123`

### Hướng dẫn viên
- Username: `huong_dan_01`
- Email: `huongdan01@gmail.com`
- Password: `Password@123`

- Username: `huong_dan_02`
- Email: `huongdan02@gmail.com`
- Password: `Password@123`

- Username: `huong_dan_03`
- Email: `huongdan03@gmail.com`
- Password: `Password@123`

### Đối tác dịch vụ
- Username: `doi_tac_01`
- Email: `doitac01@gmail.com`
- Password: `Password@123`

### Khách hàng
- Username: `khach_hang_01`
- Email: `khachhang01@gmail.com`
- Password: `Password@123`

- Username: `khach_hang_02`
- Email: `khachhang02@gmail.com`
- Password: `Password@123`

- Username: `khach_hang_03`
- Email: `khachhang03@gmail.com`
- Password: `Password@123`

- Username: `khach_hang_04`
- Email: `khachhang04@gmail.com`
- Password: `Password@123`

## Luồng phân công hướng dẫn viên hiện tại

Luồng đúng hiện tại là:
1. Khách hàng đặt tour
2. Booking `pending` hoặc `confirmed` sẽ xuất hiện ở màn `Admin -> Điều phối HDV`
3. Admin phân công hướng dẫn viên theo từng `ngày khởi hành`
4. Hướng dẫn viên đăng nhập vào `/guide/assignments` sẽ thấy đúng tour được giao

Lưu ý:
- `Duyệt tour` chỉ để duyệt hoặc từ chối tour mới
- `Điều phối HDV` là màn riêng cho vận hành tour thực tế

## Build frontend

```powershell
cd "d:\Công nghệ mới\bokinng_tour\frontend"
npm.cmd run build
```

## Một số API chính

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Tour / Booking
- `GET /api/tours`
- `GET /api/tours/{slug}`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/{id}`
- `GET /api/bookings/{id}/document`
- `GET /api/bookings/{id}/cancel-preview`
- `POST /api/bookings/{id}/cancel`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/tours`
- `GET /api/admin/reviews`
- `GET /api/admin/guide-assignments`
- `POST /api/admin/tours/{id}/approve`
- `POST /api/admin/tours/{id}/reject`
- `POST /api/admin/tours/{id}/assign-guide`

## Ghi chú

- Username dùng tiếng Việt không dấu để đăng nhập ổn định hơn
- Tên hiển thị trong UI là tiếng Việt có dấu
- Nếu muốn gửi email thật, cần cấu hình mail server thay vì để `MAIL_MAILER=log`

# CONGNGHEMOI
