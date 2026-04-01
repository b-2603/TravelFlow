import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function AgentDashboard() {
  const { data: payload } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => (await agentAPI.dashboard()).data?.data ?? {},
  });

  const stats = payload?.stats || {};
  const recentBookings = payload?.recent_bookings || [];
  const tours = payload?.available_tours || [];

  return (
    <div className="d-grid gap-4">
      <div className="row g-3">
        {[
          { label: 'Booking phụ trách', value: stats.assigned_bookings ?? 0 },
          { label: 'Booking đã chốt', value: stats.confirmed_bookings ?? 0 },
          { label: 'Doanh thu phụ trách', value: formatCurrency(stats.assigned_revenue ?? 0) },
          { label: 'Tỉ lệ hủy', value: `${stats.cancel_rate ?? 0}%` },
        ].map((item) => (
          <div className="col-md-6 col-xl-3" key={item.label}>
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-2 small text-muted">{item.label}</div>
                <div className="display-6 fw-semibold">{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="h-100 rounded-4 border bg-white p-4 shadow-sm">
            <div className="mb-3 d-flex justify-content-between gap-2">
              <h2 className="h5 mb-0">Booking phụ trách gần đây</h2>
              <Link to="/agent/bookings" className="btn btn-outline-primary btn-sm">
                Xem tất cả
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Tour</th>
                    <th>Ngày đi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.user?.name || '--'}</td>
                      <td>{booking.tour?.title || '--'}</td>
                      <td>{formatDate(booking.departure_date)}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        Chưa có booking phụ trách nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="h-100 rounded-4 border bg-white p-4 shadow-sm">
            <div className="mb-3 d-flex justify-content-between gap-2">
              <h2 className="h5 mb-0">Tour nổi bật để tư vấn</h2>
              <Link to="/agent/create-booking" className="btn btn-primary btn-sm">
                Tạo booking
              </Link>
            </div>
            <div className="d-grid gap-3">
              {tours.map((tour) => (
                <div key={tour.id} className="rounded-3 border p-3">
                  <div className="fw-semibold">{tour.title}</div>
                  <div className="small text-muted mb-2">{tour.destination}</div>
                  <div className="small">Giá từ {formatCurrency(tour.price_per_person)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
