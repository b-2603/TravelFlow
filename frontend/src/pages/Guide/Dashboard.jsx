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
  const todayTours = payload.today_tours || [];
  const nextTours = payload.next_tours || [];
  const recentUpdates = payload.recent_updates || [];

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
            <h2 className="h5 mb-1">Tour trong ngày</h2>
            <p className="mb-0 text-muted">Các chuyến cần xử lý ngay hôm nay.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải dữ liệu...</div>
        ) : todayTours.length === 0 ? (
          <div className="py-5 text-center text-muted">Hôm nay không có chuyến nào được phân công.</div>
        ) : (
          <div className="row g-3">
            {todayTours.map((tour) => (
              <div className="col-md-6" key={`${tour.id}-${tour.departure_date}`}>
                <div className="rounded-4 border p-3 h-100">
                  <div className="d-flex justify-content-between gap-2 align-items-start">
                    <div>
                      <h3 className="h6 mb-1">{tour.title}</h3>
                      <div className="small text-muted">{tour.destination}</div>
                    </div>
                    <span className="badge bg-primary">Hôm nay</span>
                  </div>
                  <div className="small text-muted mt-3">Khởi hành: {formatDate(tour.departure_date)}</div>
                  <div className="small text-muted">Slot còn lại: {tour.available_slots ?? 0}</div>
                  <div className="mt-3">
                    <Link to={`/guide/assignments/${tour.id}/${tour.departure_date}`} className="btn btn-sm btn-outline-primary">
                      Mở workspace
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="h5 mb-1">Cập nhật gần nhất</h2>
          <p className="mb-0 text-muted">Các thay đổi tiến trình gần đây nhất từ chuyến bạn phụ trách.</p>
        </div>

        {recentUpdates.length === 0 ? (
          <div className="py-5 text-center text-muted">Chưa có cập nhật nào.</div>
        ) : (
          <div className="d-grid gap-3">
            {recentUpdates.map((item, index) => (
              <div key={`${item.tour_id}-${item.updated_at}-${index}`} className="rounded-3 bg-light p-3">
                <div className="d-flex justify-content-between gap-2">
                  <strong>{item.tour_title}</strong>
                  <span className="small text-muted">{formatDate(item.updated_at)}</span>
                </div>
                <div className="small text-muted">Trạng thái: {item.status || '--'}</div>
                <div className="small text-muted">Ngày khởi hành: {item.departure_date || '--'}</div>
                {item.note ? <div className="mt-2">{item.note}</div> : null}
                {item.day_note ? <div className="small text-muted mt-1">Ghi chú cuối ngày: {item.day_note}</div> : null}
                {item.incident_type ? <div className="small text-danger mt-1">Sự cố: {item.incident_type}</div> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
