# Lộ Trình Triển Khai Actor

Tài liệu này chốt phạm vi triển khai theo đúng thứ tự actor:

1. Khách hàng (`customer`)
2. Nhân viên tư vấn (`agent`)
3. Quản lý tour (`tour_manager`)
4. Đối tác dịch vụ (`partner`)
5. Kế toán / Tài chính (`accountant`)
6. Hướng dẫn viên (`guide`)
7. Quản trị viên (`admin`)

Mục tiêu là triển khai tuần tự, giữ được chất lượng chạy thật của hệ thống và tránh dàn trải.

---

## 1. Khách hàng (`customer`)

### Tài khoản và hồ sơ
- [x] Đăng ký tài khoản
- [x] Đăng nhập JWT + lưu localStorage
- [x] Đăng xuất + blacklist token
- [x] Cập nhật thông tin cá nhân
- [x] Đổi mật khẩu với mật khẩu cũ
- [x] Quên mật khẩu / đặt lại mật khẩu

### Tìm kiếm và khám phá tour
- [x] Xem danh sách tour
- [x] Lọc theo điểm đến, danh mục, giá, ngày, số khách
- [x] Tìm theo từ khóa `q`
- [x] Sắp xếp giá tăng/giảm, mới nhất, phổ biến
- [x] Xem chi tiết tour
- [x] Xem departure còn slot
- [x] Lưu tour yêu thích
- [x] Xem review đã duyệt

### Đặt tour và thanh toán
- [x] Đặt tour, nhập hành khách
- [x] Xem tóm tắt đơn hàng
- [x] Chọn phương thức thanh toán
- [x] Thanh toán đặt cọc / toàn phần
- [x] Gửi email xác nhận booking sau thanh toán thành công
- [x] Xem lịch trình / voucher sau khi đặt
- [x] Hủy tour áp chính sách hoàn tiền tự động

### Theo dõi và sau chuyến đi
- [x] Xem lịch sử booking
- [x] Tải hóa đơn / chứng từ PDF
- [x] Gửi đánh giá sau chuyến đi
- [x] Gửi ticket hỗ trợ
- [x] Nhận email nhắc lịch / phản hồi khiếu nại

### Trạng thái
- Đã hoàn thiện phần lõi của actor khách hàng.
- Email local hiện gửi qua `log`; muốn gửi thật cần cấu hình SMTP.

---

## 2. Nhân viên tư vấn (`agent`)

### Tư vấn khách hàng
- [x] Có workspace riêng
- [x] Xem toàn bộ tour để tư vấn
- [x] Xây dựng custom tour
- [x] Tra cứu lịch sử khách hàng cơ bản
- [x] Tạo booking thay khách
- [x] Ghi chú nội bộ vào booking / hồ sơ xử lý

### Xử lý đơn và hỗ trợ
- [x] Xem booking được giao phụ trách
- [x] Xác nhận lại thông tin hành khách
- [x] Xử lý yêu cầu hủy và chuyển kế toán
- [x] Hỗ trợ sự cố hành trình
- [x] Gửi email / SMS nhắc trước chuyến đi
- [x] Cập nhật ghi chú đặc biệt cho booking

### Báo cáo cá nhân
- [x] Có dashboard cơ bản
- [x] Thống kê số booking đã xử lý
- [x] Theo dõi doanh thu booking được giao
- [x] KPI cá nhân cơ bản

### Trạng thái
- Đã hoàn thiện toàn bộ luồng tư vấn và hỗ trợ khách hàng.
- Có đầy đủ chức năng: custom tour, xác nhận hành khách, xử lý hủy, hỗ trợ sự cố, gửi reminder.

---

## 3. Quản lý tour (`tour_manager`)

### Quản lý gói tour
- [x] Tạo tour
- [x] Sửa tour
- [x] Soạn itinerary
- [x] Upload nhiều ảnh
- [x] Highlights
- [x] Soft delete tour
- [x] Hỗ trợ trạng thái `draft` và gửi duyệt lại

### Quản lý lịch và giá
- [x] Thêm departure + slot + giá riêng
- [x] Khuyến mãi theo phần trăm / số tiền cố định
- [x] Theo dõi slot còn lại
- [x] Tạm dừng / mở lại departure cụ thể

### Vận hành và duyệt
- [x] Gửi tour chờ admin duyệt
- [x] Nhận trạng thái approved / rejected
- [x] Phân công hướng dẫn viên
- [x] Phân công theo tour + departure cụ thể
- [x] Báo cáo lấp đầy / doanh thu theo tour cơ bản
- [x] Liên kết dịch vụ đối tác vào tour

### Trạng thái
- Đã có luồng quản lý tour dùng được khá đầy đủ.
- Còn thiếu pricing rule nâng cao và workflow đối tác sâu hơn.

---

## 4. Đối tác dịch vụ (`partner`)

### Đăng ký và hồ sơ
- [x] Có workspace
- [ ] Đăng ký đối tác chờ admin duyệt
- [x] Hồ sơ công ty cơ bản
- [x] Upload giấy phép / ảnh cơ sở bằng URL dữ liệu
- [x] Cập nhật đầu mối liên hệ đầy đủ

### Quản lý dịch vụ
- [x] Danh mục dịch vụ
- [x] Giá theo ngày / mùa ở mức ghi chú cấu hình
- [x] Tồn kho dịch vụ
- [x] Chính sách hủy riêng

### Xử lý đơn hàng
- [x] Xem các tour đang liên kết dịch vụ
- [x] Xem đơn dịch vụ phát sinh từ booking liên quan
- [ ] Xác nhận / từ chối đơn dịch vụ
- [ ] Cập nhật trạng thái chuẩn bị / hoàn tất
- [ ] Điều chỉnh khi lịch thay đổi

### Tài chính
- [x] Có dashboard tối thiểu
- [x] Doanh thu theo kỳ cơ bản
- [ ] Chi tiết hóa đơn
- [ ] Xác nhận đã nhận tiền
- [ ] Báo cáo công nợ

### Trạng thái
- Đã có cổng đối tác dùng được ở mức cơ bản.
- Còn thiếu workflow xác nhận đơn dịch vụ và xác nhận thanh toán đối tác.

---

## 5. Kế toán / Tài chính (`accountant`)

### Quản lý thu
- [x] Xem payment records
- [x] Xác nhận thanh toán thủ công
- [ ] Đối soát tự động MoMo / VNPay
- [x] Tổng thu theo kỳ cơ bản
- [x] Lọc theo tháng, trạng thái, phương thức

### Quản lý chi và hoàn tiền
- [x] Xem danh sách yêu cầu hoàn tiền
- [x] Duyệt / từ chối yêu cầu hoàn tiền
- [x] Hoàn tiền giao dịch thành công
- [x] Đồng bộ refund với booking và payment
- [x] Xem công nợ đối tác cơ bản
- [ ] Lịch thanh toán định kỳ cho đối tác

### Báo cáo và chứng từ
- [x] Có trang báo cáo tài chính cơ bản
- [x] Báo cáo doanh thu, hoàn tiền, chi phí dịch vụ
- [x] Báo cáo lợi nhuận ước tính
- [ ] Xuất VAT
- [ ] Export Excel / PDF
- [ ] Biểu đồ dòng tiền aggregation đầy đủ

### Trạng thái
- Đã có luồng kế toán cốt lõi dùng được: xác nhận thu, xử lý hoàn tiền, xem công nợ, xem báo cáo cơ bản.
- Còn thiếu đối soát cổng thanh toán tự động, export chứng từ và lịch thanh toán đối tác.

---

## 6. Hướng dẫn viên (`guide`)

### Xem thông tin được phân công
- [x] Xem tour được phân công
- [x] Lọc sắp tới / đang diễn ra / đã xong
- [x] Xem chi tiết lịch trình, điểm tham quan, địa chỉ cơ bản
- [x] Xem danh sách đoàn đầy đủ
- [x] Xem đối tác đi kèm
- [x] Nhận thông báo đổi lịch

### Cập nhật thực địa
- [x] Điểm danh khách (chi tiết theo ngày)
- [x] Cập nhật tiến trình tour
- [x] Báo cáo sự cố thực địa (với mức độ nghiêm trọng)
- [x] Ghi chú cuối ngày cho quản lý tour
- [x] Chuyển trạng thái `in-progress -> completed`

### Báo cáo và thống kê
- [x] Dashboard tổng quan với thống kê
- [x] Thống kê KPI cá nhân (theo ngày/tuần/tháng/năm)
- [x] Xem lịch sử tiến trình tour

### Trạng thái
- Đã hoàn thiện toàn bộ luồng hướng dẫn viên.
- Có đầy đủ chức năng: xem assignment, điểm danh, báo cáo sự cố, gửi ghi chú, nhận thông báo, thống kê KPI.

---

## 7. Quản trị viên (`admin`)

### Quản lý người dùng và phân quyền
- [x] Xem danh sách người dùng
- [x] Tạo tài khoản nhân sự nội bộ
- [x] Phân quyền RBAC cơ bản
- [x] Khóa / mở khóa tài khoản
- [x] Reset mật khẩu bất kỳ
- [x] Xem chi tiết hồ sơ + lịch sử từng user

### Duyệt nội dung
- [x] Duyệt tour
- [x] Duyệt review
- [x] Duyệt đối tác mới
- [x] Xử lý khiếu nại / tranh chấp ở mức ticket phản hồi

### Giám sát và bảo mật
- [x] Dashboard tổng quan
- [x] Audit log
- [ ] Giám sát response time / error rate
- [x] Quản lý JWT expire ở config
- [ ] IP whitelist / blacklist
- [ ] Phát hiện đăng nhập bất thường
- [ ] Sao lưu / phục hồi MongoDB tự động

### Cấu hình hệ thống
- [x] Thông tin công ty
- [ ] Danh mục điểm đến / loại tour
- [x] Cấu hình cổng thanh toán ở mức cơ bản
- [ ] Template email
- [x] Chính sách hủy tour ở mức cơ bản
- [x] Banner khuyến mãi / thông báo ở mức cơ bản
- [ ] Email marketing tự động

### Trạng thái
- Đã có khu vực quản trị dùng được cho các tác vụ cốt lõi: nhân sự, duyệt nội dung, ticket hỗ trợ, duyệt đối tác và cấu hình hệ thống cơ bản.
- Còn thiếu giám sát hạ tầng sâu, template email, marketing và các cơ chế bảo mật nâng cao.

---

## Thứ Tự Triển Khai Đề Xuất

1. Hoàn thiện nốt `customer`
2. Làm sâu `agent`
3. Hoàn thiện vận hành `tour_manager`
4. Nối `partner`
5. Hoàn thiện `accountant`
6. Hoàn thiện `guide`
7. Khóa lại toàn bộ quy trình ở `admin`

---

## Mối Liên Hệ Giữa Các Actor

- Khách hàng → Nhân viên tư vấn: tư vấn, tạo booking thay, hỗ trợ phát sinh.
- Khách hàng ↔ Kế toán: thanh toán, đối soát, hoàn tiền.
- Khách hàng ↔ Hướng dẫn viên: tương tác trực tiếp trong chuyến đi.
- Nhân viên tư vấn ↔ Quản lý tour: phản hồi nhu cầu khách và dữ liệu tour.
- Quản lý tour → Admin: submit tour để duyệt.
- Quản lý tour → Hướng dẫn viên: phân công dẫn tour.
- Quản lý tour ↔ Đối tác dịch vụ: liên kết khách sạn, xe, vé.
- Kế toán ↔ Đối tác dịch vụ: công nợ và thanh toán.
- Admin → Tất cả actor: phân quyền, giám sát, duyệt nội dung.

Luồng nghiệp vụ chính:
- Khách đặt tour
- Nhân viên hỗ trợ
- Kế toán xác nhận thanh toán
- Quản lý phân công hướng dẫn viên
- Hướng dẫn viên vận hành tour
- Khách đánh giá
- Admin kiểm duyệt đánh giá
