import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function AgentDashboard() {
  const [period, setPeriod] = useState('month');

  const { data: payload } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => (await agentAPI.dashboard()).data?.data ?? {},
  });

  const { data: statsPayload } = useQuery({
    queryKey: ['agent-stats', period],
    queryFn: async () => (await agentAPI.stats({ period })).data?.data ?? {},
  });

  const stats = payload?.stats || {};
  const recentBookings = payload?.recent_bookings || [];
  const tours = payload?.available_tours || [];
  const currentKpi = statsPayload?.current_period || {};
  const allTimeKpi = statsPayload?.all_time || {};
  const hasCurrentKpi = (currentKpi.total_bookings ?? 0) > 0;
  const kpi = hasCurrentKpi ? currentKpi : allTimeKpi;
  const trendRaw = statsPayload?.daily_trend || [];
  const fallbackTrendRaw = statsPayload?.all_time_trend || [];
  const activeTrendRaw = hasCurrentKpi ? trendRaw : fallbackTrendRaw;
  const trend = Array.isArray(activeTrendRaw)
    ? activeTrendRaw
    : Object.entries(activeTrendRaw).map(([date, item]) => ({ date, ...(item || {}) }));

  return (
    <div className="d-grid gap-4">
      <div className="row g-3">
        {[
          { label: 'Booking phụ trách', value: stats.assigned_bookings ?? 0 },
          { label: 'Booking đã chốt', value: stats.confirmed_bookings ?? 0 },
          { label: 'Doanh thu phụ trách', value: formatCurrency(stats.assigned_revenue ?? 0) },
          { label: 'Tỉ lệ hủy', value: `${stats.cancel_rate ?? 0}%` },
          { label: 'Ticket mở', value: stats.open_tickets ?? 0 },
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

      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 mb-1">KPI cá nhân</h2>
            <p className="mb-0 text-muted">Theo dõi theo ngày, tuần, tháng hoặc năm để kiểm soát hiệu suất tư vấn.</p>
            {!hasCurrentKpi && (allTimeKpi.total_bookings ?? 0) > 0 ? (
              <div className="small text-primary mt-2">Kỳ đang chọn chưa có booking, đang hiển thị dữ liệu tổng phụ trách.</div>
            ) : null}
          </div>
          <select className="form-select" style={{ width: 180 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
          </select>
        </div>
        <div className="row g-3 mb-3">
          {[
            { label: 'Tổng booking', value: kpi.total_bookings ?? 0 },
            { label: 'Doanh thu', value: formatCurrency(kpi.revenue ?? 0) },
            { label: 'Đã xác nhận', value: kpi.confirmed ?? 0 },
            { label: 'Đã hoàn thành', value: kpi.completed ?? 0 },
            { label: 'Đã hủy', value: kpi.cancelled ?? 0 },
            { label: 'Đã thanh toán', value: kpi.paid_bookings ?? 0 },
          ].map((item) => (
            <div className="col-md-4 col-xl-2" key={item.label}>
              <div className="rounded-3 border bg-light p-3 h-100">
                <div className="small text-muted">{item.label}</div>
                <div className="fw-semibold">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="d-grid gap-2">
          {trend.length === 0 ? (
            <div className="text-muted">Chưa có dữ liệu trong giai đoạn này.</div>
          ) : (
            trend.map((item) => (
              <div key={item.date || item.label || JSON.stringify(item)} className="d-flex justify-content-between border rounded-3 px-3 py-2">
                <span>{item.date || item.label}</span>
                <span className="text-muted">
                  {item.count ?? 0} booking - {formatCurrency(item.revenue ?? 0)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="h-100 rounded-4 border bg-white p-4 shadow-sm">
            <div className="mb-3 d-flex justify-content-between gap-2">
              <h2 className="h5 mb-0">Booking phụ trách gần đây</h2>
              <div className="d-flex gap-2">
                <Link to="/agent/support-tickets" className="btn btn-outline-secondary btn-sm">
                  Ticket hỗ trợ
                </Link>
                <Link to="/agent/bookings" className="btn btn-outline-primary btn-sm">
                  Xem tất cả
                </Link>
              </div>
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
              <div className="d-flex gap-2">
                <Link to="/agent/custom-tours" className="btn btn-outline-secondary btn-sm">
                  Custom tour
                </Link>
                <Link to="/agent/create-booking" className="btn btn-primary btn-sm">
                  Tạo booking
                </Link>
              </div>
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
