import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { guideAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function GuideNotifications() {
  const { data = {}, isLoading, error } = useQuery({
    queryKey: ['guide-notifications'],
    queryFn: async () => (await guideAPI.notifications()).data?.data ?? {},
  });

  const notifications = data.notifications ?? [];
  const unreadCount = data.unread_count ?? 0;

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4 align-items-start align-items-md-center">
          <div>
            <h2 className="h4 mb-1">Thông báo hướng dẫn viên</h2>
            <p className="mb-0 text-muted">Xem các cập nhật thay đổi lịch và thông báo từ quản lý.</p>
          </div>
          <div className="badge bg-primary fs-6">Chưa đọc: {unreadCount}</div>
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải thông báo...</div>
        ) : error ? (
          <div className="py-5 text-center text-danger">Không thể tải thông báo. Vui lòng thử lại sau.</div>
        ) : notifications.length === 0 ? (
          <div className="py-5 text-center text-muted">Bạn chưa có thông báo mới.</div>
        ) : (
          <div className="list-group">
            {notifications.map((item) => (
              <div key={item.id} className="list-group-item list-group-item-action rounded-4 mb-3">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <h3 className="h6 mb-1">{item.message}</h3>
                    <div className="small text-muted">{formatDate(item.created_at)}</div>
                  </div>
                  <span className="badge bg-secondary">{item.action}</span>
                </div>
                {item.detail?.tour_title ? (
                  <div className="mt-3 small text-muted">Tour: {item.detail.tour_title}</div>
                ) : null}
                {item.detail?.departure_date ? (
                  <div className="mt-1 small text-muted">Ngày khởi hành: {item.detail.departure_date}</div>
                ) : null}
                {item.detail?.tour_id ? (
                  <div className="mt-3">
                    <Link
                      to={
                        item.detail.departure_date
                          ? `/guide/assignments/${item.detail.tour_id}/${item.detail.departure_date}`
                          : `/guide/assignments/${item.detail.tour_id}`
                      }
                      className="btn btn-sm btn-outline-primary"
                    >
                      Xem phân công
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
