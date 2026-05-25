import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { guideAPI } from '../../services/api';
import { formatDate, statusBadgeClass } from '../../utils/formatters';

export default function GuideHistory() {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['guide-history'],
    queryFn: async () => (await guideAPI.assignments()).data?.data ?? [],
  });

  const historyItems = useMemo(() => {
    return assignments
      .flatMap((assignment) => (assignment.guide_progress || []).map((entry) => ({
        ...entry,
        tour_title: assignment.tour_title,
        tour_id: assignment.tour_id,
      })))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [assignments]);

  const departureSummary = useMemo(() => {
    const groups = assignments.flatMap((assignment) => assignment.guide_progress || [])
      .reduce((acc, item) => {
        const key = item.departure_date || 'Không xác định';
        const group = acc[key] || { departure_date: key, total_updates: 0, statuses: new Set() };
        group.total_updates += 1;
        if (item.status) {
          group.statuses.add(item.status);
        }
        acc[key] = group;
        return acc;
      }, {});

    return Object.values(groups).map((group) => ({
      ...group,
      statuses: Array.from(group.statuses),
    }));
  }, [assignments]);

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start align-items-md-center">
          <div>
            <h2 className="h4 mb-1">Lịch sử tiến trình tour</h2>
            <p className="mb-0 text-muted">Xem lại tất cả cập nhật thực địa và trạng thái tour đã ghi nhận.</p>
          </div>
          <div className="text-end">
            <div className="small text-muted">Tổng cập nhật</div>
            <div className="fs-5 fw-semibold">{historyItems.length}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải lịch sử...</div>
        ) : historyItems.length === 0 ? (
          <div className="py-5 text-center text-muted">Chưa có bản ghi tiến trình nào.</div>
        ) : (
          <div className="row g-4">
            <div className="col-xl-4">
              <div className="rounded-4 border bg-light-subtle p-3 h-100">
                <h3 className="h6">Tóm tắt theo ngày khởi hành</h3>
                <div className="mt-3 d-grid gap-3">
                  {departureSummary.map((item) => (
                    <div key={item.departure_date} className="rounded-3 bg-white border p-3">
                      <div className="small text-muted">{item.departure_date}</div>
                      <div className="fw-semibold">{item.total_updates} cập nhật</div>
                      <div className="small text-muted">Trạng thái: {item.statuses.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-xl-8">
              <div className="d-grid gap-3">
                {historyItems.map((item, index) => (
                  <div key={`${item.updated_at}-${index}`} className="rounded-4 border p-3 shadow-sm">
                    <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                      <span className={`badge ${statusBadgeClass(item.status)}`}>{item.status || 'unknown'}</span>
                      <span className="small text-muted">{formatDate(item.updated_at)}</span>
                    </div>
                    <div className="fw-semibold">Ngày khởi hành: {item.departure_date || 'Chưa xác định'}</div>
                    {item.day_number ? <div className="small text-muted">Ngày báo cáo: {item.day_number}</div> : null}
                    {item.location ? <div className="small text-muted">Địa điểm: {item.location}</div> : null}
                    {item.weather ? <div className="small text-muted">Thời tiết: {item.weather}</div> : null}
                    {item.note ? <div className="mt-2">{item.note}</div> : null}
                    {item.day_note ? <div className="mt-2 small text-muted">Ghi chú cuối ngày: {item.day_note}</div> : null}
                    {item.incident_description ? (
                      <div className="mt-2 text-danger">Sự cố: {item.incident_description}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
