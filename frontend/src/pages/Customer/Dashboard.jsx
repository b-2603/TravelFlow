import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerAPI } from '../../services/api';
import {
  bookingPaymentLabel,
  bookingStatusLabel,
  formatCurrency,
  formatDate,
  statusBadgeClass,
} from '../../utils/formatters';

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-4 border bg-light-subtle p-3 h-100">
      <div className="small text-muted mb-2">{label}</div>
      <div className="fs-5 fw-semibold mb-1">{value}</div>
      {note ? <div className="small text-muted">{note}</div> : null}
    </div>
  );
}

function ActivityBadge({ type }) {
  const map = {
    booking: 'bg-primary-subtle text-primary',
    support: 'bg-warning-subtle text-warning-emphasis',
    refund: 'bg-danger-subtle text-danger-emphasis',
  };

  return <span className={`badge ${map[type] || 'bg-light text-dark'}`}>{type}</span>;
}

export default function CustomerDashboard() {
  const { data: payload = {}, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => (await customerAPI.dashboard()).data?.data ?? {},
  });

  const summary = payload?.summary || {};
  const nextTrip = payload?.next_trip || null;
  const recentBookings = payload?.recent_bookings || [];
  const favoriteTours = payload?.favorite_tours || [];
  const recentActivity = payload?.recent_activity || [];

  return (
    <div className="container py-4 py-lg-5 pb-5 pb-lg-6">
      <section className="rounded-4 border bg-white p-4 shadow-sm mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h1 className="h3 mb-1">Tổng quan khách hàng</h1>
            <p className="mb-0 text-muted">Theo dõi booking, yêu thích, hỗ trợ và hoàn tiền trong một nơi.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/tours" className="btn btn-primary btn-sm">Khám phá tour</Link>
            <Link to="/my-bookings" className="btn btn-outline-primary btn-sm">Đơn của tôi</Link>
            <Link to="/my-support" className="btn btn-outline-secondary btn-sm">Hỗ trợ</Link>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-xl-3">
            <StatCard label="Tổng booking" value={summary.total_bookings ?? 0} note="Tất cả đơn đã tạo" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Chuyến sắp đi" value={summary.upcoming_bookings ?? 0} note="Booking còn hiệu lực" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Tour yêu thích" value={summary.favorite_tours ?? 0} note="Đang lưu để theo dõi" />
          </div>
          <div className="col-md-6 col-xl-3">
            <StatCard label="Tổng chi tiêu" value={formatCurrency(summary.total_spent || 0)} note="Từ các giao dịch thành công" />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Hỗ trợ mở</div>
              <div className="fw-semibold">{summary.open_supports ?? 0}</div>
              <div className="small text-muted">Yêu cầu chưa đóng</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Hoàn tiền chờ xử lý</div>
              <div className="fw-semibold">{summary.pending_refunds ?? 0}</div>
              <div className="small text-muted">Đang được kế toán xem xét</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Chuyến hoàn thành</div>
              <div className="fw-semibold">{summary.completed_bookings ?? 0}</div>
              <div className="small text-muted">Đã đi và có thể đánh giá</div>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 mb-1">Chuyến đi gần nhất</h2>
                <p className="mb-0 text-muted">Booking sắp khởi hành tiếp theo của bạn.</p>
              </div>
              <Link to="/my-bookings" className="btn btn-sm btn-outline-primary">Mở danh sách</Link>
            </div>

            {nextTrip ? (
              <div className="rounded-4 border bg-light p-3">
                <div className="fw-semibold mb-1">{nextTrip.tour?.title || '--'}</div>
                <div className="small text-muted mb-2">{nextTrip.tour?.destination || '--'}</div>
                <div className="d-flex flex-column gap-1 small">
                  <div className="d-flex justify-content-between"><span>Ngày đi</span><strong>{formatDate(nextTrip.departure_date)}</strong></div>
                  <div className="d-flex justify-content-between"><span>Khách</span><strong>{nextTrip.num_pax}</strong></div>
                  <div className="d-flex justify-content-between"><span>Còn lại</span><strong>{formatCurrency(nextTrip.remaining_amount)}</strong></div>
                  <div className="d-flex justify-content-between"><span>Trạng thái</span><strong>{bookingStatusLabel(nextTrip.status)}</strong></div>
                  <div className="d-flex justify-content-between"><span>Thanh toán</span><strong>{bookingPaymentLabel(nextTrip)}</strong></div>
                </div>
                {nextTrip.tour?.slug ? (
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <Link to={`/my-bookings/${nextTrip.id}`} className="btn btn-primary btn-sm">Xem booking</Link>
                    <Link to={`/tours/${nextTrip.tour.slug}`} className="btn btn-outline-primary btn-sm">Xem tour</Link>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-muted">Chưa có chuyến đi sắp tới.</div>
            )}
          </section>
        </div>

        <div className="col-lg-7">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 mb-1">Hoạt động gần đây</h2>
                <p className="mb-0 text-muted">Các booking, hỗ trợ và hoàn tiền vừa phát sinh.</p>
              </div>
            </div>

            <div className="d-grid gap-3">
              {isLoading ? (
                <div className="text-muted py-3">Đang tải dữ liệu...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-muted">Chưa có hoạt động gần đây.</div>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="rounded-3 border p-3 d-flex justify-content-between gap-3 align-items-start">
                    <div>
                      <div className="fw-semibold mb-1">{item.title}</div>
                      <div className="small text-muted">{item.description}</div>
                      <div className="small text-muted">{formatDate(item.date)}</div>
                    </div>
                    <ActivityBadge type={item.type} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 mb-1">Đơn đặt gần đây</h2>
                <p className="mb-0 text-muted">Theo dõi lịch sử booking mới nhất.</p>
              </div>
              <Link to="/my-bookings" className="btn btn-sm btn-outline-primary">Xem tất cả</Link>
            </div>

            <div className="d-grid gap-3">
              {recentBookings.length === 0 ? (
                <div className="text-muted">Chưa có booking nào.</div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="rounded-3 border p-3">
                    <div className="d-flex justify-content-between gap-2">
                      <div>
                        <div className="fw-semibold">{booking.tour?.title || '--'}</div>
                        <div className="small text-muted">{booking.tour?.destination || '--'}</div>
                      </div>
                      <div className="text-end">
                        <div className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</div>
                        <div className="small text-muted mt-1">{bookingPaymentLabel(booking)}</div>
                      </div>
                    </div>
                    <div className="small text-muted mt-2">
                      {formatDate(booking.departure_date)} • {booking.num_pax} khách • {formatCurrency(booking.total_price)}
                    </div>
                    <div className="mt-2">
                      <Link to={`/my-bookings/${booking.id}`} className="btn btn-sm btn-outline-primary">Xem chi tiết</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="col-lg-6">
          <section className="rounded-4 border bg-white p-4 shadow-sm h-100 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 mb-1">Tour yêu thích</h2>
                <p className="mb-0 text-muted">Các tour bạn đang theo dõi.</p>
              </div>
              <Link to="/favorites" className="btn btn-sm btn-outline-primary">Mở danh sách</Link>
            </div>

            <div className="d-grid gap-3">
              {favoriteTours.length === 0 ? (
                <div className="text-muted">Chưa có tour yêu thích.</div>
              ) : (
                favoriteTours.map((item) => (
                  <div key={item.id} className="rounded-3 border p-3">
                    <div className="fw-semibold">{item.tour?.title || '--'}</div>
                    <div className="small text-muted">{item.tour?.destination || '--'}</div>
                    <div className="small text-muted mt-1">Giá từ {formatCurrency(item.tour?.price_per_person)}</div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
