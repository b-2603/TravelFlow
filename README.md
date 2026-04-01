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
- `docs/postman/`: Postman collection và environment
- `infra/nginx/`: cấu hình Nginx phục vụ deploy
- `infra/docker-compose.yml`: cấu hình Docker
- `ACTOR_ROADMAP.md`: ghi chú phạm vi actor và tiến độ triển khai

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

```powershell
cd "d:\Công nghệ mới\bokinng_tour\backend"
& "D:\codexphp\php.exe" -c "D:\codexphp" artisan db:seed --force
```

Seeder hiện tạo:
- người dùng mẫu theo từng vai trò
- nhiều hướng dẫn viên để test điều phối
- tour mẫu
- booking mẫu
- payment mẫu
- review mẫu
- favorite mẫu
- support ticket mẫu
- refund request mẫu

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
- Email: `quantri@travel.local`
- Password: `Admin@123456`

### Quản lý tour
- Username: `quan_ly_tour_01`
- Email: `quanlytour01@travel.local`
- Password: `Password@123`

### Nhân viên tư vấn
- Username: `tu_van_01`
- Email: `tuvan01@travel.local`
- Password: `Password@123`

### Kế toán / Tài chính
- Username: `ke_toan_01`
- Email: `ketoan01@travel.local`
- Password: `Password@123`

### Hướng dẫn viên
- Username: `huong_dan_01`
- Email: `huongdan01@travel.local`
- Password: `Password@123`

- Username: `huong_dan_02`
- Email: `huongdan02@travel.local`
- Password: `Password@123`

- Username: `huong_dan_03`
- Email: `huongdan03@travel.local`
- Password: `Password@123`

### Đối tác dịch vụ
- Username: `doi_tac_01`
- Email: `doitac01@travel.local`
- Password: `Password@123`

### Khách hàng
- Username: `khach_hang_01`
- Email: `khachhang01@travel.local`
- Password: `Password@123`

- Username: `khach_hang_02`
- Email: `khachhang02@travel.local`
- Password: `Password@123`

- Username: `khach_hang_03`
- Email: `khachhang03@travel.local`
- Password: `Password@123`

- Username: `khach_hang_04`
- Email: `khachhang04@travel.local`
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

## Deploy và test API

Nếu cần test API bằng Postman:
- [travel-management.postman_collection.json](d:/Công%20nghệ%20mới/bokinng_tour/docs/postman/travel-management.postman_collection.json)
- [travel-management.postman_environment.json](d:/Công%20nghệ%20mới/bokinng_tour/docs/postman/travel-management.postman_environment.json)

Nếu cần deploy hoặc chạy bằng Docker/Nginx:
- [docker-compose.yml](d:/Công%20nghệ%20mới/bokinng_tour/infra/docker-compose.yml)
- [default.conf](d:/Công%20nghệ%20mới/bokinng_tour/infra/nginx/default.conf)

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
- `GET /api/admin/guide-assignments`
- `POST /api/admin/tours/{id}/approve`
- `POST /api/admin/tours/{id}/reject`
- `POST /api/admin/tours/{id}/assign-guide`

## Ghi chú

- Username dùng tiếng Việt không dấu để đăng nhập ổn định hơn
- Tên hiển thị trong UI là tiếng Việt có dấu
- Nếu muốn gửi email thật, cần cấu hình mail server thay vì để `MAIL_MAILER=log`

# CONGNGHEMOI
