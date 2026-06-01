import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { guideAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, statusBadgeClass } from '../../utils/formatters';

const assignmentTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'ongoing', label: 'Đang diễn ra' },
  { key: 'completed', label: 'Đã xong' },
];

const progressOptions = [
  { value: 'scheduled', label: 'Đã nhận tour' },
  { value: 'boarding', label: 'Đang điểm danh' },
  { value: 'in_progress', label: 'Đang dẫn tour' },
  { value: 'issue', label: 'Có sự cố' },
  { value: 'completed', label: 'Hoàn thành' },
];

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

function assignmentStateLabel(state) {
  const map = {
    upcoming: 'Sắp tới',
    ongoing: 'Đang diễn ra',
    completed: 'Đã xong',
  };

  return map[state] || state || '--';
}

function assignmentStateClass(state) {
  const map = {
    upcoming: 'bg-info text-dark',
    ongoing: 'bg-primary',
    completed: 'bg-success',
  };

  return map[state] || 'bg-secondary';
}

export default function Assignments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const guideCacheKey = user?.id || user?._id || user?.email || user?.username || 'me';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [status, setStatus] = useState('scheduled');
  const [note, setNote] = useState('');
  const [dayNote, setDayNote] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['guide-assignments', guideCacheKey],
    queryFn: async () => (await guideAPI.assignments()).data?.data ?? [],
  });

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const matchesState = activeTab === 'all' || item.assignment_state === activeTab;
      const haystack = `${item.tour_title || ''} ${item.destination || ''} ${item.category || ''}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());

      return matchesState && matchesSearch;
    });
  }, [activeTab, assignments, search]);

  const summary = useMemo(
    () => ({
      total: assignments.length,
      upcoming: assignments.filter((item) => item.assignment_state === 'upcoming').length,
      ongoing: assignments.filter((item) => item.assignment_state === 'ongoing').length,
      completed: assignments.filter((item) => item.assignment_state === 'completed').length,
    }),
    [assignments]
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => guideAPI.updateStatus(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật tiến trình thực địa.');
      setSelectedAssignment(null);
      setNote('');
      setDayNote('');
      setIncidentType('');
      setAttendance([]);
      setImageFiles([]);
      queryClient.invalidateQueries({ queryKey: ['guide-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['guide-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['guide-history'] });
      queryClient.invalidateQueries({ queryKey: ['guide-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['guide-assignment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['guide-assignment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật tiến trình.');
    },
  });

  const openUpdateModal = (assignment) => {
    setSelectedAssignment(assignment);
    setStatus(assignment.latest_progress?.status || 'scheduled');
    setNote(assignment.latest_progress?.note || '');
    setDayNote(assignment.latest_progress?.day_note || '');
    setIncidentType(assignment.latest_progress?.incident_type || '');
    setDayNumber(assignment.latest_progress?.day_number || 1);
    setLocation(assignment.latest_progress?.location || '');
    setWeather(assignment.latest_progress?.weather || '');
    setImageFiles([]);

    const passengerItems = assignment.bookings.flatMap((booking) =>
      (booking.passengers || []).map((passenger) => ({
        name: passenger.name,
        present: true,
      }))
    );

    setAttendance(passengerItems);
  };

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between">
          <div>
            <h2 className="h4 mb-1">Tour được phân công</h2>
            <p className="mb-0 text-muted">
              Theo dõi tour sắp dẫn, danh sách đoàn khách, đối tác đi kèm và cập nhật diễn biến thực địa.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {assignmentTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <input
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên tour, điểm đến hoặc nhóm tour..."
            />
          </div>
          <div className="col-lg-4 text-lg-end align-self-center small text-muted">
            {filteredAssignments.length} kết quả
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Tổng phân công</div>
              <div className="fs-5 fw-semibold">{summary.total}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Sắp tới</div>
              <div className="fs-5 fw-semibold">{summary.upcoming}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Đang diễn ra</div>
              <div className="fs-5 fw-semibold">{summary.ongoing}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3">
              <div className="small text-muted mb-2">Đã xong</div>
              <div className="fs-5 fw-semibold">{summary.completed}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải danh sách phân công...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-5 text-center text-muted">Chưa có tour phù hợp với bộ lọc hiện tại.</div>
        ) : (
          <div className="row g-4">
            {filteredAssignments.map((assignment) => (
              <div className="col-xl-6" key={assignment.assignment_id}>
                <div className="card h-100 border-0 shadow-sm overflow-hidden">
                  <img
                    src={assignment.images?.[0] || 'https://picsum.photos/seed/guide-assignment/1200/800'}
                    alt={assignment.tour_title}
                    className="card-img-top"
                    style={{ height: 220, objectFit: 'cover' }}
                  />
                  <div className="card-body d-grid gap-3">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <span className={`badge ${assignmentStateClass(assignment.assignment_state)}`}>
                        {assignmentStateLabel(assignment.assignment_state)}
                      </span>
                      <span className={`badge ${statusBadgeClass(assignment.tour_status)}`}>{assignment.tour_status}</span>
                    </div>

                    <div>
                      <h3 className="h5 mb-1">{assignment.tour_title}</h3>
                      <p className="mb-0 text-muted">
                        {assignment.destination} | {assignment.category} | {assignment.duration_days} ngày
                      </p>
                    </div>

                    <div className="row g-3">
                      <div className="col-sm-6">
                        <div className="rounded-3 border p-3 h-100">
                          <div className="small text-muted">Ngày khởi hành</div>
                          <div className="fw-semibold">{formatDate(assignment.departure?.date)}</div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="rounded-3 border p-3 h-100">
                          <div className="small text-muted">Đoàn khách</div>
                          <div className="fw-semibold">
                            {assignment.passenger_count} khách / {assignment.bookings_count} booking
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="small text-muted">
                      Trạng thái gần nhất: <strong>{guideProgressLabel(assignment.latest_progress?.status || 'scheduled')}</strong>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <Link
                        to={`/guide/assignments/${assignment.tour_id}/${assignment.departure?.date}`}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Xem chi tiết
                      </Link>
                      <Link
                        to={`/guide/assignments/${assignment.tour_id}/${assignment.departure?.date}/summary`}
                        className="btn btn-outline-dark btn-sm"
                      >
                        Bản tổng hợp
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#updateProgressModal"
                        onClick={() => openUpdateModal(assignment)}
                      >
                        Cập nhật thực địa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="modal fade" id="guideDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">{selectedAssignment?.tour_title || 'Chi tiết phân công'}</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedAssignment ? (
                <div className="text-muted">Chưa chọn chuyến đi.</div>
              ) : (
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="rounded-4 border p-3 mb-4">
                      <h4 className="h6 mb-3">Thông tin chuyến đi</h4>
                      <div className="d-grid gap-2 small">
                        <div>Điểm đến: <strong>{selectedAssignment.destination}</strong></div>
                        <div>Ngày khởi hành: <strong>{formatDate(selectedAssignment.departure?.date)}</strong></div>
                        <div>Slot còn lại: <strong>{selectedAssignment.departure?.available_slots ?? 0}</strong></div>
                        <div>Trạng thái chuyến: <strong>{assignmentStateLabel(selectedAssignment.assignment_state)}</strong></div>
                      </div>
                    </div>

                    <div className="rounded-4 border p-3 mb-4">
                      <h4 className="h6 mb-3">Lịch trình</h4>
                      <div className="d-grid gap-3">
                        {(selectedAssignment.itinerary || []).map((item) => (
                          <div key={`${item.day}-${item.title}`} className="border-start border-4 border-primary ps-3">
                            <div className="small text-muted">Ngày {item.day}</div>
                            <div className="fw-semibold">{item.title}</div>
                            <div className="small text-muted">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-4 border p-3">
                      <h4 className="h6 mb-3">Đối tác đi kèm</h4>
                      {selectedAssignment.partners?.length ? (
                        <div className="d-grid gap-3">
                          {selectedAssignment.partners.map((partner) => (
                            <div key={partner.id} className="rounded-3 bg-light p-3">
                              <div className="fw-semibold">{partner.company_name}</div>
                              <div className="small text-muted">
                                {partner.service_type} | {partner.contact_name || 'Chưa có đầu mối'}
                              </div>
                              <div className="small text-muted">
                                {partner.phone || '--'} | {partner.email || '--'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Chưa liên kết đối tác cho tour này.</div>
                      )}
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="rounded-4 border p-3 mb-4">
                      <h4 className="h6 mb-3">Danh sách đoàn khách</h4>
                      {selectedAssignment.bookings?.length ? (
                        <div className="accordion" id="bookingAccordion">
                          {selectedAssignment.bookings.map((booking, index) => (
                            <div className="accordion-item" key={booking.id}>
                              <h2 className="accordion-header">
                                <button
                                  className={`accordion-button ${index === 0 ? '' : 'collapsed'}`}
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#booking-${booking.id}`}
                                >
                                  {booking.customer?.name || 'Khách hàng'} | {booking.num_pax} khách
                                </button>
                              </h2>
                              <div
                                id={`booking-${booking.id}`}
                                className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                                data-bs-parent="#bookingAccordion"
                              >
                                <div className="accordion-body">
                                  <div className="small mb-2 text-muted">
                                    {booking.customer?.phone || '--'} | {booking.customer?.email || '--'}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Ghi chú:</strong> {booking.note || 'Không có'}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Yêu cầu đặc biệt:</strong>{' '}
                                    {booking.special_requirements?.length ? booking.special_requirements.join(', ') : 'Không có'}
                                  </div>
                                  <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                      <thead>
                                        <tr>
                                          <th>Hành khách</th>
                                          <th>Ngày sinh</th>
                                          <th>CCCD / Passport</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(booking.passengers || []).map((passenger, passengerIndex) => (
                                          <tr key={`${booking.id}-${passengerIndex}`}>
                                            <td>{passenger.name}</td>
                                            <td>{passenger.dob || '--'}</td>
                                            <td>{passenger.passport || '--'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Chưa có booking nào gắn với ngày khởi hành này.</div>
                      )}
                    </div>

                    <div className="rounded-4 border p-3">
                      <h4 className="h6 mb-3">Nhật ký thực địa</h4>
                      {selectedAssignment.guide_progress?.length ? (
                        <div className="d-grid gap-3">
                          {[...selectedAssignment.guide_progress].reverse().map((item, index) => (
                            <div key={`${item.updated_at}-${index}`} className="rounded-3 bg-light p-3">
                              <div className="d-flex justify-content-between gap-2">
                                <strong>{guideProgressLabel(item.status)}</strong>
                                <span className="small text-muted">{formatDate(item.updated_at)}</span>
                              </div>
                              {item.incident_type ? <div className="small text-danger mt-1">Sự cố: {item.incident_type}</div> : null}
                              {item.note ? <div className="small mt-2">{item.note}</div> : null}
                              {item.day_note ? <div className="small text-muted mt-1">Ghi chú cuối ngày: {item.day_note}</div> : null}
                              {item.images?.length ? (
                                <div className="mt-3 d-flex flex-wrap gap-2">
                                  {item.images.map((image, imageIndex) => (
                                    <a
                                      key={`${image}-${imageIndex}`}
                                      href={image}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="d-inline-block"
                                    >
                                      <img
                                        src={image}
                                        alt={`Hình thực địa ${imageIndex + 1}`}
                                        className="rounded-3 border"
                                        style={{ width: 88, height: 88, objectFit: 'cover' }}
                                      />
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Chưa có cập nhật thực địa nào.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="updateProgressModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Cập nhật thực địa</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedAssignment ? (
                <div className="text-muted">Chưa chọn chuyến đi.</div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                      {progressOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Loại sự cố</label>
                    <input
                      className="form-control"
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      placeholder="Ví dụ: trễ xe, thời tiết xấu, sức khỏe khách"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Ngày báo cáo</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={dayNumber}
                      onChange={(e) => setDayNumber(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Địa điểm</label>
                    <input
                      type="text"
                      className="form-control"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ví dụ: Sân bay, khách sạn, bến tàu"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Thời tiết</label>
                    <input
                      type="text"
                      className="form-control"
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      placeholder="Ví dụ: nắng, mưa, nhiều gió"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ghi chú hiện trường</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Mô tả ngắn tình hình đoàn, điểm đến, thay đổi phát sinh..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ghi chú cuối ngày cho quản lý tour</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={dayNote}
                      onChange={(e) => setDayNote(e.target.value)}
                      placeholder="Báo cáo cuối ngày, lưu ý cho chặng tiếp theo..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Hình thực địa</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      className="form-control"
                      onChange={(e) => setImageFiles(Array.from(e.currentTarget.files || []))}
                    />
                    <div className="form-text">Có thể tải nhiều ảnh hiện trường. Mỗi ảnh tối đa 5MB.</div>
                    {imageFiles.length ? (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {imageFiles.map((file, index) => (
                          <span key={`${file.name}-${index}`} className="badge text-bg-light border">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Điểm danh hành khách</label>
                    <div className="rounded-3 border p-3">
                      {attendance.length ? (
                        <div className="row g-3">
                          {attendance.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="col-md-6">
                              <div className="form-check">
                                <input
                                  id={`attendance-${index}`}
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={item.present}
                                  onChange={(e) =>
                                    setAttendance((current) =>
                                      current.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, present: e.target.checked } : entry
                                      )
                                    )
                                  }
                                />
                                <label htmlFor={`attendance-${index}`} className="form-check-label">
                                  {item.name}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted">Chưa có danh sách hành khách để điểm danh.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!selectedAssignment || updateMutation.isPending}
                onClick={() => {
                  if (!selectedAssignment) {
                    return;
                  }

                  const formData = new FormData();
                  formData.append('status', status);
                  formData.append('note', note);
                  formData.append('day_note', dayNote);
                  formData.append('incident_type', incidentType || '');
                  formData.append('day_number', String(dayNumber));
                  formData.append('location', location);
                  formData.append('weather', weather);
                  formData.append('departure_date', selectedAssignment.departure?.date || '');

                  attendance.forEach((item, index) => {
                    formData.append(`attendance[${index}][name]`, item.name);
                    formData.append(`attendance[${index}][present]`, item.present ? '1' : '0');
                  });

                  imageFiles.forEach((file) => {
                    formData.append('image_files[]', file);
                  });

                  updateMutation.mutate({
                    id: selectedAssignment.tour_id,
                    payload: formData,
                  });
                }}
              >
                Lưu cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
