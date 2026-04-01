import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

function assignmentBadgeClass(status) {
  return status === 'assigned' ? 'bg-success' : 'bg-warning text-dark';
}

function bookingStatusLabel(status) {
  const labels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  return labels[status] || status || '--';
}

export default function GuideAssignments() {
  const queryClient = useQueryClient();
  const [guideSelections, setGuideSelections] = useState({});

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-guide-assignments'],
    queryFn: async () => (await adminAPI.guideAssignments()).data?.data ?? [],
  });

  const { data: guidePayload } = useQuery({
    queryKey: ['guide-options'],
    queryFn: async () => (await adminAPI.users({ role: 'guide', status: 'active' })).data?.data ?? {},
  });

  const assignMutation = useMutation({
    mutationFn: ({ tourId, departureDate, guideId }) =>
      adminAPI.assignGuide(tourId, {
        guide_id: guideId,
        departure_date: departureDate,
      }),
    onSuccess: () => {
      toast.success('Đã phân công hướng dẫn viên cho đợt khởi hành.');
      queryClient.invalidateQueries({ queryKey: ['admin-guide-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['guide-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['tour-approval'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể phân công hướng dẫn viên.');
    },
  });

  const guides = guidePayload?.items || [];
  const groupedSummary = useMemo(
    () => ({
      totalDepartures: assignments.length,
      unassigned: assignments.filter((item) => item.assignment_status === 'unassigned').length,
      assigned: assignments.filter((item) => item.assignment_status === 'assigned').length,
      passengers: assignments.reduce((sum, item) => sum + (item.passenger_count || 0), 0),
    }),
    [assignments]
  );

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="h4 mb-1">Điều phối hướng dẫn viên</h2>
          <p className="mb-0 text-muted">
            Mỗi khi khách đặt tour, đợt khởi hành tương ứng sẽ hiện ở đây để admin phân công hướng dẫn viên theo ngày đi thực tế.
          </p>
        </div>

        <div className="row g-3">
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Đợt khởi hành có booking</div>
              <div className="fs-5 fw-semibold">{groupedSummary.totalDepartures}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-warning-subtle p-3">
              <div className="small text-muted mb-2">Chưa phân công</div>
              <div className="fs-5 fw-semibold">{groupedSummary.unassigned}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-success-subtle p-3">
              <div className="small text-muted mb-2">Đã phân công</div>
              <div className="fs-5 fw-semibold">{groupedSummary.assigned}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-info-subtle p-3">
              <div className="small text-muted mb-2">Tổng hành khách chờ phục vụ</div>
              <div className="fs-5 fw-semibold">{groupedSummary.passengers}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải danh sách điều phối...</div>
        ) : assignments.length === 0 ? (
          <div className="py-5 text-center text-muted">Chưa có booking nào cần phân công hướng dẫn viên.</div>
        ) : (
          <div className="d-grid gap-3">
            {assignments.map((item) => {
              const selectedGuide = guideSelections[item.assignment_key] ?? item.guide?.id ?? '';

              return (
                <div key={item.assignment_key} className="rounded-4 border p-4">
                  <div className="row g-4 align-items-start">
                    <div className="col-xl-4">
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <span className={`badge ${assignmentBadgeClass(item.assignment_status)}`}>
                            {item.assignment_status === 'assigned' ? 'Đã phân công' : 'Chờ phân công'}
                          </span>
                          <span className="badge bg-light text-dark">{item.departure_status}</span>
                        </div>
                        <div>
                          <h3 className="h5 mb-1">{item.tour_title}</h3>
                          <div className="text-muted small">
                            {item.destination} | {item.category}
                          </div>
                        </div>
                        <div className="small">
                          <div>Ngày khởi hành: <strong>{formatDate(item.departure_date)}</strong></div>
                          <div>Số booking: <strong>{item.bookings_count}</strong></div>
                          <div>Số hành khách: <strong>{item.passenger_count}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="col-xl-4">
                      <label className="form-label small fw-semibold">Chọn hướng dẫn viên</label>
                      <div className="d-flex flex-column flex-sm-row gap-2">
                        <select
                          className="form-select"
                          value={selectedGuide}
                          onChange={(e) =>
                            setGuideSelections((current) => ({
                              ...current,
                              [item.assignment_key]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Chọn hướng dẫn viên</option>
                          {guides.map((guide) => (
                            <option key={guide.id} value={guide.id}>
                              {guide.name} - {guide.email}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary flex-shrink-0"
                          disabled={!selectedGuide || assignMutation.isPending}
                          onClick={() =>
                            assignMutation.mutate({
                              tourId: item.tour_id,
                              departureDate: item.departure_date,
                              guideId: selectedGuide,
                            })
                          }
                        >
                          {item.guide ? 'Cập nhật HDV' : 'Phân công HDV'}
                        </button>
                      </div>
                      <div className="mt-2 small text-muted">
                        HDV hiện tại: <strong>{item.guide?.name || 'Chưa có'}</strong>
                      </div>
                    </div>

                    <div className="col-xl-4">
                      <div className="rounded-3 bg-light-subtle p-3">
                        <div className="small fw-semibold mb-2">Khách đã đặt tour</div>
                        <div className="d-grid gap-2">
                          {item.customers.map((customer) => (
                            <div key={customer.booking_id} className="rounded-3 border bg-white p-2">
                              <div className="fw-semibold">{customer.name || 'Khách hàng'}</div>
                              <div className="small text-muted">
                                {customer.email || '--'} | {customer.phone || '--'}
                              </div>
                              <div className="small">
                                {customer.num_pax} khách | {bookingStatusLabel(customer.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
