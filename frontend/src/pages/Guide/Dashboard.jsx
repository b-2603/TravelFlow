import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { guideAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function GuideDashboard() {
  const { data: payload = {}, isLoading } = useQuery({
    queryKey: ['guide-dashboard'],
    queryFn: async () => (await guideAPI.dashboard()).data?.data ?? {},
  });

  const stats = payload.stats || {};
  const nextTours = payload.next_tours || [];

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between align-items-start align-items-lg-center">
          <div>
            <h2 className="h4 mb-1">Bảng điều hành hướng dẫn viên</h2>
            <p className="mb-0 text-muted">
              Xem nhanh số tour được phân công, trạng thái chuyến và lịch trình sắp tới.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/guide/assignments" className="btn btn-primary btn-sm">
              Xem phân công chi tiết
            </Link>
            <Link to="/guide/notifications" className="btn btn-outline-secondary btn-sm">
              Xem thông báo
            </Link>
            <Link to="/guide/history" className="btn btn-outline-secondary btn-sm">
              Lịch sử tiến trình
            </Link>
          </div>
        </div>

        <div className="row g-3">
          {[
            { label: 'Tổng tour', value: stats.total_tours },
            { label: 'Sắp tới', value: stats.upcoming_tours },
            { label: 'Đang diễn ra', value: stats.ongoing_tours },
            { label: 'Đã xong', value: stats.completed_tours },
            { label: 'Tổng khách đã dẫn', value: stats.total_pax_served },
          ].map((item) => (
            <div className="col-md-6 col-xl-4" key={item.label}>
              <div className="rounded-4 border bg-light-subtle p-3 h-100">
                <div className="small text-muted mb-2">{item.label}</div>
                <div className="fs-4 fw-semibold">{item.value ?? 0}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
          <div>
            <h2 className="h5 mb-1">Tour phân công sắp tới</h2>
            <p className="mb-0 text-muted">Xem nhanh những chuyến tour chuẩn bị khởi hành để sẵn sàng.</p>
          </div>
          <Link to="/guide/assignments" className="btn btn-outline-primary btn-sm">
            Xem tất cả phân công
          </Link>
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải dữ liệu...</div>
        ) : nextTours.length === 0 ? (
          <div className="py-5 text-center text-muted">Chưa có chuyến tour sắp tới.</div>
        ) : (
          <div className="row g-3">
            {nextTours.map((tour) => (
              <div className="col-md-6" key={`${tour.id}-${tour.departure_date}`}>
                <div className="rounded-4 border p-3 h-100 shadow-sm">
                  <div className="d-flex justify-content-between gap-2 align-items-start">
                    <div>
                      <h3 className="h6 mb-1">{tour.title}</h3>
                      <div className="small text-muted">{tour.destination}</div>
                    </div>
                    <span className="badge bg-info text-dark">{tour.duration_days} ngày</span>
                  </div>
                  <div className="mt-3 small text-muted">Khởi hành: {formatDate(tour.departure_date)}</div>
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Link to="/guide/assignments" className="btn btn-sm btn-outline-secondary">
                      Chi tiết phân công
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
