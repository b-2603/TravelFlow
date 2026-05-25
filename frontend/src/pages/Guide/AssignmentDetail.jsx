import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { guideAPI } from '../../services/api';
import { formatDate, statusBadgeClass } from '../../utils/formatters';

function guideProgressLabel(status) {
  const map = {
    scheduled: 'Đã nhận tour',
    boarding: 'Đang điểm danh',
    in_progress: 'Đang dẫn tour',
    issue: 'Có sự cố',
    completed: 'Hoàn thành',
  };

  return map[status] || status || '--';
}

export default function AssignmentDetail() {
  const { tourId, departureDate } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['guide-assignment-detail', tourId, departureDate],
    queryFn: async () => {
      if (!tourId) return null;
      const response = await guideAPI.showAssignment(tourId, departureDate);
      return response.data?.data ?? null;
    },
    enabled: Boolean(tourId),
  });

  const items = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data]);

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start align-items-md-center mb-4">
          <div>
            <h2 className="h4 mb-1">Chi tiết phân công</h2>
            <p className="mb-0 text-muted">Xem chi tiết tour, khách đoàn, đối tác và nhật ký thực địa.</p>
          </div>
          <Link className="btn btn-outline-primary btn-sm" to="/guide/assignments">
            Quay lại phân công
          </Link>
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải chi tiết...</div>
        ) : items.length === 0 ? (
          <div className="py-5 text-center text-muted">Không tìm thấy phân công.</div>
        ) : (
          <div className="d-grid gap-4">
            {items.map((assignment) => (
              <div key={`${assignment.tour_id}-${assignment.departure?.date}`} className="rounded-4 border p-4 shadow-sm">
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                  <div>
                    <h3 className="h5 mb-2">{assignment.tour_title}</h3>
                    <div className="small text-muted">{assignment.destination} | {assignment.category}</div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <span className={`badge ${statusBadgeClass(assignment.tour_status)}`}>{assignment.tour_status}</span>
                    <span className={`badge ${statusBadgeClass(assignment.assignment_state)}`}>{assignment.assignment_state}</span>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="rounded-4 border bg-light-subtle p-3">
                      <div className="small text-muted">Ngày khởi hành</div>
                      <div className="fw-semibold">{formatDate(assignment.departure?.date)}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="rounded-4 border bg-light-subtle p-3">
                      <div className="small text-muted">Khách đoàn</div>
                      <div className="fw-semibold">{assignment.passenger_count} khách</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="rounded-4 border bg-light-subtle p-3">
                      <div className="small text-muted">Booking</div>
                      <div className="fw-semibold">{assignment.bookings_count} đơn</div>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="rounded-4 border p-3 mb-4">
                      <h4 className="h6 mb-3">Hành trình</h4>
                      {(assignment.itinerary || []).map((item) => (
                        <div key={`${item.day}-${item.title}`} className="mb-3">
                          <div className="small text-muted">Ngày {item.day}</div>
                          <div className="fw-semibold">{item.title}</div>
                          <div className="small text-muted">{item.description}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-4 border p-3">
                      <h4 className="h6 mb-3">Đối tác đi kèm</h4>
                      {assignment.partners?.length ? (
                        <div className="d-grid gap-3">
                          {assignment.partners.map((partner) => (
                            <div key={partner.id} className="rounded-3 bg-light p-3">
                              <div className="fw-semibold">{partner.company_name}</div>
                              <div className="small text-muted">{partner.service_type}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Không có đối tác liên kết.</div>
                      )}
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="rounded-4 border p-3 mb-4">
                      <h4 className="h6 mb-3">Danh sách khách</h4>
                      {assignment.bookings?.length ? (
                        <div className="table-responsive">
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Khách</th>
                                <th>Booking</th>
                                <th>Số khách</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assignment.bookings.map((booking) => (
                                <tr key={booking.id}>
                                  <td>{booking.customer?.name || '---'}</td>
                                  <td>{booking.status}</td>
                                  <td>{booking.num_pax}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-muted">Không có booking cho ngày khởi hành này.</div>
                      )}
                    </div>

                    <div className="rounded-4 border p-3">
                      <h4 className="h6 mb-3">Nhật ký thực địa</h4>
                      {assignment.guide_progress?.length ? (
                        <div className="d-grid gap-3">
                          {[...assignment.guide_progress].reverse().map((entry, index) => (
                            <div key={`${entry.updated_at}-${index}`} className="rounded-3 bg-light p-3">
                              <div className="d-flex justify-content-between gap-2 mb-2">
                                <strong>{guideProgressLabel(entry.status)}</strong>
                                <span className="small text-muted">{formatDate(entry.updated_at)}</span>
                              </div>
                              {entry.note ? <div className="small mb-1">{entry.note}</div> : null}
                              {entry.day_note ? <div className="small text-muted">Ghi chú cuối ngày: {entry.day_note}</div> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Chưa có cập nhật thực địa.</div>
                      )}
                    </div>
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
