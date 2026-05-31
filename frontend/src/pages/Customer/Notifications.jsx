import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { bookingStatusLabel, formatDate, refundStatusLabel, statusBadgeClass, supportStatusLabel } from '../../utils/formatters';

function SectionCard({ title, children, action }) {
  return (
    <section className="rounded-4 border bg-white p-4 shadow-sm h-100">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 className="h5 mb-1">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CustomerNotifications() {
  const { data: payload = {}, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => (await customerAPI.dashboard()).data?.data ?? {},
  });

  const recentActivity = payload?.recent_activity || [];
  const recentBookings = payload?.recent_bookings || [];
  const supportTickets = payload?.support_tickets || [];
  const refundRequests = payload?.refund_requests || [];

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
        <div>
          <h1 className="h3 mb-1">Thông báo của tôi</h1>
          <p className="mb-0 text-muted">Tổng hợp các cập nhật hệ thống, booking, hỗ trợ và hoàn tiền.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/customer/dashboard" className="btn btn-outline-primary">Tổng quan</Link>
          <Link to="/my-bookings" className="btn btn-primary">Booking của tôi</Link>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <SectionCard
            title="Cập nhật mới nhất"
            action={<span className="badge bg-primary-subtle text-primary">{recentActivity.length} mục</span>}
          >
            {isLoading ? (
              <div className="text-muted">Đang tải thông báo...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-muted">Chưa có cập nhật nào.</div>
            ) : (
              <div className="d-grid gap-3">
                {recentActivity.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="rounded-3 border p-3 d-flex justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">{item.title}</div>
                      <div className="small text-muted">{item.description}</div>
                      <div className="small text-muted">{formatDate(item.date)}</div>
                    </div>
                    <span className={`badge ${item.type === 'booking' ? 'bg-primary' : item.type === 'support' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="col-lg-5">
          <div className="d-grid gap-4">
            <SectionCard
              title="Booking gần đây"
              action={<span className="badge bg-light text-dark">{recentBookings.length}</span>}
            >
              <div className="d-grid gap-2">
                {recentBookings.length === 0 ? (
                  <div className="text-muted">Chưa có booking.</div>
                ) : (
                  recentBookings.slice(0, 4).map((booking) => (
                    <div key={booking.id} className="rounded-3 border p-3">
                      <div className="d-flex justify-content-between gap-2">
                        <div className="fw-semibold">{booking.tour?.title || '--'}</div>
                        <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                      </div>
                      <div className="small text-muted">{formatDate(booking.departure_date)}</div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Hỗ trợ và hoàn tiền"
              action={<span className="badge bg-light text-dark">{supportTickets.length + refundRequests.length}</span>}
            >
              <div className="d-grid gap-3">
                <div>
                  <div className="fw-semibold mb-2">Hỗ trợ</div>
                  {supportTickets.length === 0 ? (
                    <div className="text-muted small">Chưa có ticket.</div>
                  ) : (
                    supportTickets.slice(0, 3).map((ticket) => (
                      <div key={ticket.id} className="small mb-2">
                        <div className="d-flex justify-content-between gap-2">
                          <span>{ticket.subject}</span>
                          <span className={`badge ${statusBadgeClass(ticket.status)}`}>{supportStatusLabel(ticket.status)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <div className="fw-semibold mb-2">Hoàn tiền</div>
                  {refundRequests.length === 0 ? (
                    <div className="text-muted small">Chưa có yêu cầu.</div>
                  ) : (
                    refundRequests.slice(0, 3).map((refund) => (
                      <div key={refund.id} className="small mb-2">
                        <div className="d-flex justify-content-between gap-2">
                          <span>{refund.booking?.tour?.title || '--'}</span>
                          <span className={`badge ${statusBadgeClass(refund.status)}`}>{refundStatusLabel(refund.status)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
