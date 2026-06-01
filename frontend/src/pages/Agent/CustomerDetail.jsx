import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatDate, statusBadgeClass } from '../../utils/formatters';

function statBox({ label, value }) {
  return (
    <div className="rounded-3 border bg-light p-3 h-100">
      <div className="small text-muted">{label}</div>
      <div className="fs-4 fw-semibold">{value}</div>
    </div>
  );
}

export default function AgentCustomerDetail() {
  const { id } = useParams();

  const { data: payload, isLoading } = useQuery({
    queryKey: ['agent-customer-detail-page', id],
    queryFn: async () => (await agentAPI.showCustomer(id)).data?.data ?? {},
    enabled: Boolean(id),
  });

  const customer = payload?.customer;
  const bookingStats = payload?.booking_stats || {};
  const recentBookings = payload?.recent_bookings || [];

  if (isLoading) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="text-muted">Đang tải chi tiết khách hàng...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="alert alert-warning mb-0">Không tìm thấy khách hàng.</div>
      </div>
    );
  }

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <div className="small text-muted mb-1">Nhân viên tư vấn</div>
          <h2 className="h4 mb-2">{customer.name}</h2>
          <div className="text-muted">
            {customer.email} · {customer.phone || '--'} · @{customer.username || '--'}
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/agent/customers" className="btn btn-outline-secondary">
            Quay lại danh sách
          </Link>
          <Link to="/agent/create-booking" state={{ customerId: customer.id }} className="btn btn-primary">
            Tạo booking
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {statBox({ label: 'Tổng booking', value: bookingStats.total ?? 0 })}
        {statBox({ label: 'Đã xác nhận', value: bookingStats.confirmed ?? 0 })}
        {statBox({ label: 'Hoàn thành', value: bookingStats.completed ?? 0 })}
        {statBox({ label: 'Đã hủy', value: bookingStats.cancelled ?? 0 })}
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Thông tin cơ bản</h3>
            <div className="d-grid gap-2 small">
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Họ tên</span>
                <strong>{customer.name}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Tài khoản</span>
                <strong>@{customer.username || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Email</span>
                <strong>{customer.email}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Điện thoại</span>
                <strong>{customer.phone || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Trạng thái</span>
                <strong>{customer.status || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Ngày tạo</span>
                <strong>{formatDate(customer.created_at)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="rounded-4 border p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Booking gần đây</h3>
              <Link to="/agent/bookings" className="btn btn-outline-primary btn-sm">
                Xem tất cả booking
              </Link>
            </div>
            {recentBookings.length ? (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Tour</th>
                      <th>Ngày đi</th>
                      <th>Khách</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div className="fw-semibold">{booking.tour?.title || '--'}</div>
                          <div className="small text-muted">{booking.tour?.destination || '--'}</div>
                        </td>
                        <td>{formatDate(booking.departure_date)}</td>
                        <td>{booking.num_pax ?? 0}</td>
                        <td>
                          <span className={`badge ${statusBadgeClass(booking.status)}`}>
                            {bookingStatusLabel(booking.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">Khách này chưa có booking nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
