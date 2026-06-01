import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { guideAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function AssignmentSummary() {
  const { tourId, departureDate } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['guide-assignment-summary', tourId, departureDate],
    queryFn: async () => {
      if (!tourId) return null;
      const response = await guideAPI.showAssignment(tourId, departureDate);
      return response.data?.data ?? null;
    },
    enabled: Boolean(tourId),
  });

  const assignment = useMemo(() => (Array.isArray(data) ? data[0] : data) || null, [data]);

  if (isLoading) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="text-muted">Đang tải bản tổng hợp...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="alert alert-warning mb-0">Không tìm thấy dữ liệu phân công.</div>
      </div>
    );
  }

  const passengers = assignment.passengers || [];
  const partners = assignment.partners || [];
  const itinerary = assignment.itinerary || [];
  const latestProgress = assignment.latest_progress || null;

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <div className="small text-muted mb-1">Hướng dẫn viên</div>
          <h2 className="h4 mb-2">Bản tổng hợp chuyến</h2>
          <div className="text-muted">
            {assignment.tour_title} · {assignment.destination} · {formatDate(assignment.departure?.date)}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/guide/assignments/${assignment.tour_id}/${assignment.departure?.date}`} className="btn btn-outline-primary">
            Mở chi tiết
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            In bản tổng hợp
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="rounded-3 border bg-light p-3 h-100">
            <div className="small text-muted">Tour</div>
            <div className="fw-semibold">{assignment.tour_title}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rounded-3 border bg-light p-3 h-100">
            <div className="small text-muted">Ngày đi</div>
            <div className="fw-semibold">{formatDate(assignment.departure?.date)}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rounded-3 border bg-light p-3 h-100">
            <div className="small text-muted">Đoàn khách</div>
            <div className="fw-semibold">{assignment.passenger_count ?? passengers.length} khách</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rounded-3 border bg-light p-3 h-100">
            <div className="small text-muted">Trạng thái gần nhất</div>
            <div className="fw-semibold">{latestProgress?.status || assignment.assignment_state || '--'}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Lịch trình</h3>
            <div className="d-grid gap-3">
              {itinerary.length ? itinerary.map((item) => (
                <div key={`${item.day}-${item.title}`} className="rounded-3 bg-light p-3">
                  <div className="small text-muted">Ngày {item.day}</div>
                  <div className="fw-semibold">{item.title}</div>
                  <div className="text-muted">{item.description}</div>
                </div>
              )) : <div className="text-muted">Chưa có lịch trình.</div>}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100 d-grid gap-4">
            <div>
              <h3 className="h5 mb-3">Đối tác liên kết</h3>
              {partners.length ? partners.map((partner) => (
                <div key={partner.id} className="rounded-3 bg-light p-3 mb-2">
                  <div className="fw-semibold">{partner.company_name || partner.name}</div>
                  <div className="small text-muted">{partner.service_type || partner.type || '--'}</div>
                </div>
              )) : <div className="text-muted">Chưa liên kết đối tác.</div>}
            </div>
            <div>
              <h3 className="h5 mb-3">Danh sách khách</h3>
              {passengers.length ? passengers.map((passenger, index) => (
                <div key={`${passenger.name}-${index}`} className="d-flex justify-content-between border-bottom py-2">
                  <span>{passenger.name}</span>
                  <span className="text-muted">{passenger.phone || passenger.email || '--'}</span>
                </div>
              )) : <div className="text-muted">Chưa có khách.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
