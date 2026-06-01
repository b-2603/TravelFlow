import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { guideAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
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

function severityLabel(value) {
  const map = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    critical: 'Khẩn cấp',
  };

  return map[value] || value || '--';
}

function fileListToFormData(formData, files) {
  files.forEach((file) => {
    formData.append('image_files[]', file);
  });
}

export default function AssignmentDetail() {
  const { tourId, departureDate } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const guideCacheKey = user?.id || user?._id || user?.email || user?.username || 'me';
  const [progressStatus, setProgressStatus] = useState('scheduled');
  const [progressNote, setProgressNote] = useState('');
  const [progressDayNumber, setProgressDayNumber] = useState(1);
  const [progressLocation, setProgressLocation] = useState('');
  const [progressWeather, setProgressWeather] = useState('');
  const [progressFiles, setProgressFiles] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceLocation, setAttendanceLocation] = useState('');
  const [attendanceDayNumber, setAttendanceDayNumber] = useState(1);
  const [incidentType, setIncidentType] = useState('medical');
  const [incidentSeverity, setIncidentSeverity] = useState('medium');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentPassengers, setIncidentPassengers] = useState([]);
  const [dayNote, setDayNote] = useState('');
  const [dayNoteLocation, setDayNoteLocation] = useState('');
  const [dayNoteWeather, setDayNoteWeather] = useState('');
  const [dayNoteHighlights, setDayNoteHighlights] = useState('');
  const [dayNoteNumber, setDayNoteNumber] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['guide-assignment-detail', guideCacheKey, tourId, departureDate],
    queryFn: async () => {
      if (!tourId) return null;
      const response = await guideAPI.showAssignment(tourId, departureDate);
      return response.data?.data ?? null;
    },
    enabled: Boolean(tourId),
  });

  const assignments = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data]);

  const assignment = assignments[0] || null;
  const activeDepartureDate = assignment?.departure?.date || departureDate || '';

  useEffect(() => {
    if (!assignment) return;

    setProgressStatus(assignment.latest_progress?.status || 'scheduled');
    setProgressNote(assignment.latest_progress?.note || '');
    setProgressDayNumber(assignment.latest_progress?.day_number || 1);
    setProgressLocation(assignment.latest_progress?.location || '');
    setProgressWeather(assignment.latest_progress?.weather || '');
    setProgressFiles([]);

    const passengers = assignment.passengers || [];
    setAttendanceRows(
      passengers.map((passenger) => ({
        name: passenger.name || '',
        present: true,
        note: '',
      })),
    );
    setAttendanceLocation(assignment.departure?.location || '');
    setAttendanceDayNumber(assignment.latest_progress?.day_number || 1);

    setIncidentType('medical');
    setIncidentSeverity('medium');
    setIncidentDescription('');
    setIncidentLocation(assignment.departure?.location || '');
    setIncidentPassengers(passengers.map((passenger) => passenger.name).filter(Boolean));

    setDayNote('');
    setDayNoteLocation(assignment.departure?.location || '');
    setDayNoteWeather('');
    setDayNoteHighlights('');
    setDayNoteNumber(assignment.latest_progress?.day_number || 1);
  }, [assignment]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['guide-assignment-detail'] });
    queryClient.invalidateQueries({ queryKey: ['guide-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['guide-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['guide-history'] });
    queryClient.invalidateQueries({ queryKey: ['guide-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['guide-assignment-summary'] });
  };

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, payload }) => guideAPI.updateStatus(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật tiến trình thực địa.');
      setProgressFiles([]);
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật tiến trình.');
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id, departureDateValue, payload }) => guideAPI.takeAttendance(id, departureDateValue, payload),
    onSuccess: () => {
      toast.success('Đã lưu điểm danh.');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể lưu điểm danh.');
    },
  });

  const incidentMutation = useMutation({
    mutationFn: ({ id, payload }) => guideAPI.reportIncident(id, payload),
    onSuccess: () => {
      toast.success('Đã ghi nhận sự cố.');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể báo cáo sự cố.');
    },
  });

  const dayNoteMutation = useMutation({
    mutationFn: ({ id, payload }) => guideAPI.submitDayNote(id, payload),
    onSuccess: () => {
      toast.success('Đã lưu ghi chú cuối ngày.');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể lưu ghi chú cuối ngày.');
    },
  });

  const stats = assignment?.statistics || {};

  const passengerOptions = assignment?.passengers || [];
  const latestProgress = assignment?.latest_progress || null;
  const progressHistory = assignment?.guide_progress || [];

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start align-items-md-center mb-4">
          <div>
            <h2 className="h4 mb-1">Chi tiết phân công</h2>
            <p className="mb-0 text-muted">Quản lý điểm danh, tiến trình, sự cố và ghi chú cuối ngày cho chuyến tour.</p>
          </div>
          <Link className="btn btn-outline-primary btn-sm" to="/guide/assignments">
            Quay lại phân công
          </Link>
          {assignment ? (
            <Link
              className="btn btn-outline-dark btn-sm"
              to={`/guide/assignments/${assignment.tour_id}/${activeDepartureDate}/summary`}
            >
              Bản tổng hợp
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="py-5 text-center text-muted">Đang tải chi tiết...</div>
        ) : assignment ? (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-6 col-xl-3">
                <div className="rounded-4 border bg-light-subtle p-3 h-100">
                  <div className="small text-muted mb-2">Tour</div>
                  <div className="fw-semibold">{assignment.tour_title}</div>
                  <div className="small text-muted">{assignment.destination}</div>
                </div>
              </div>
              <div className="col-md-6 col-xl-3">
                <div className="rounded-4 border bg-light-subtle p-3 h-100">
                  <div className="small text-muted mb-2">Ngày khởi hành</div>
                  <div className="fw-semibold">{formatDate(assignment.departure?.date)}</div>
                </div>
              </div>
              <div className="col-md-6 col-xl-3">
                <div className="rounded-4 border bg-light-subtle p-3 h-100">
                  <div className="small text-muted mb-2">Khách / booking</div>
                  <div className="fw-semibold">{stats.total_pax ?? assignment.passenger_count ?? 0} khách</div>
                  <div className="small text-muted">{stats.bookings_count ?? assignment.bookings_count ?? 0} booking</div>
                </div>
              </div>
              <div className="col-md-6 col-xl-3">
                <div className="rounded-4 border bg-light-subtle p-3 h-100">
                  <div className="small text-muted mb-2">Trạng thái gần nhất</div>
                  <div className={`badge ${statusBadgeClass(latestProgress?.status || assignment.assignment_state)}`}>
                    {guideProgressLabel(latestProgress?.status || assignment.assignment_state)}
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-xl-7">
                <div className="rounded-4 border p-3 mb-4">
                  <h3 className="h5 mb-3">Thông tin chuyến đi</h3>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Địa điểm</div>
                      <div className="fw-semibold">{assignment.destination}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Trạng thái tour</div>
                      <div className="fw-semibold">{assignment.tour_status}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Slot còn lại</div>
                      <div className="fw-semibold">{assignment.departure?.available_slots ?? 0}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Phạm vi lịch trình</div>
                      <div className="fw-semibold">{assignment.duration_days} ngày</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-4 border p-3 mb-4">
                  <h3 className="h5 mb-3">Lịch trình</h3>
                  <div className="d-grid gap-3">
                    {(assignment.itinerary || []).map((item) => (
                      <div key={`${item.day}-${item.title}`} className="border-start border-4 border-primary ps-3">
                        <div className="small text-muted">Ngày {item.day}</div>
                        <div className="fw-semibold">{item.title}</div>
                        <div className="small text-muted">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-4 border p-3 mb-4">
                  <h3 className="h5 mb-3">Đối tác đi kèm</h3>
                  {assignment.partners?.length ? (
                    <div className="d-grid gap-3">
                      {assignment.partners.map((partner) => (
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

                <div className="rounded-4 border p-3">
                  <h3 className="h5 mb-3">Lịch sử tiến trình</h3>
                  {progressHistory.length ? (
                    <div className="d-grid gap-3">
                      {[...progressHistory].reverse().map((entry, index) => (
                        <div key={`${entry.updated_at}-${index}`} className="rounded-3 bg-light p-3">
                          <div className="d-flex justify-content-between gap-2 mb-2">
                            <strong>{guideProgressLabel(entry.status)}</strong>
                            <span className="small text-muted">{formatDate(entry.updated_at)}</span>
                          </div>
                          <div className="small text-muted">Ngày khởi hành: {entry.departure_date || '--'}</div>
                          {entry.day_number ? <div className="small text-muted">Ngày báo cáo: {entry.day_number}</div> : null}
                          {entry.location ? <div className="small text-muted">Địa điểm: {entry.location}</div> : null}
                          {entry.weather ? <div className="small text-muted">Thời tiết: {entry.weather}</div> : null}
                          {entry.note ? <div className="mt-2">{entry.note}</div> : null}
                          {entry.day_note ? <div className="small text-muted mt-1">Ghi chú cuối ngày: {entry.day_note}</div> : null}
                          {entry.incident_type ? <div className="small text-danger mt-1">Sự cố: {entry.incident_type}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted">Chưa có cập nhật thực địa nào.</div>
                  )}
                </div>
              </div>

              <div className="col-xl-5 d-grid gap-4">
                <div className="rounded-4 border p-3">
                  <h3 className="h5 mb-3">Điểm danh</h3>
                  <div className="small text-muted mb-3">Chốt danh sách hành khách có mặt trong ngày {activeDepartureDate || '--'}.</div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Ngày báo cáo</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={attendanceDayNumber}
                        onChange={(e) => setAttendanceDayNumber(Number(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Địa điểm</label>
                      <input
                        className="form-control"
                        value={attendanceLocation}
                        onChange={(e) => setAttendanceLocation(e.target.value)}
                        placeholder="Sân bay, khách sạn..."
                      />
                    </div>
                  </div>
                  <div className="rounded-3 border p-3 mb-3">
                    <div className="row g-2">
                      {attendanceRows.length ? (
                        attendanceRows.map((row, index) => (
                          <div className="col-12" key={`${row.name}-${index}`}>
                            <div className="d-flex flex-column gap-2 border-bottom pb-2 mb-2">
                              <div className="form-check">
                                <input
                                  id={`attendance-${index}`}
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={row.present}
                                  onChange={(e) =>
                                    setAttendanceRows((current) =>
                                      current.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, present: e.target.checked } : entry,
                                      ),
                                    )
                                  }
                                />
                                <label htmlFor={`attendance-${index}`} className="form-check-label fw-semibold">
                                  {row.name}
                                </label>
                              </div>
                              <input
                                className="form-control form-control-sm"
                                value={row.note}
                                onChange={(e) =>
                                  setAttendanceRows((current) =>
                                    current.map((entry, entryIndex) =>
                                      entryIndex === index ? { ...entry, note: e.target.value } : entry,
                                    ),
                                  )
                                }
                                placeholder="Ghi chú cá nhân nếu cần"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted">Chưa có hành khách để điểm danh.</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    disabled={!assignment || attendanceMutation.isPending}
                    onClick={() => {
                      if (!assignment) return;
                      attendanceMutation.mutate({
                        id: assignment.tour_id,
                        departureDateValue: activeDepartureDate,
                        payload: {
                          day_number: attendanceDayNumber,
                          location: attendanceLocation || undefined,
                          attendance: attendanceRows.map((row) => ({
                            name: row.name,
                            present: Boolean(row.present),
                            note: row.note || undefined,
                          })),
                        },
                      });
                    }}
                  >
                    Lưu điểm danh
                  </button>
                </div>

                <div className="rounded-4 border p-3">
                  <h3 className="h5 mb-3">Cập nhật tiến trình</h3>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Trạng thái</label>
                      <select className="form-select" value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)}>
                        <option value="scheduled">Đã nhận tour</option>
                        <option value="boarding">Đang điểm danh</option>
                        <option value="in_progress">Đang dẫn tour</option>
                        <option value="issue">Có sự cố</option>
                        <option value="completed">Hoàn thành</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Ngày báo cáo</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={progressDayNumber}
                        onChange={(e) => setProgressDayNumber(Number(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Địa điểm</label>
                      <input className="form-control" value={progressLocation} onChange={(e) => setProgressLocation(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Thời tiết</label>
                      <input className="form-control" value={progressWeather} onChange={(e) => setProgressWeather(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ghi chú</label>
                      <textarea className="form-control" rows="3" value={progressNote} onChange={(e) => setProgressNote(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ảnh hiện trường</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".jpg,.jpeg,.png,.webp"
                        multiple
                        onChange={(e) => setProgressFiles(Array.from(e.currentTarget.files || []))}
                      />
                      {progressFiles.length ? (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {progressFiles.map((file) => (
                            <span key={file.name} className="badge text-bg-light border">
                              {file.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 mt-3"
                    disabled={!assignment || updateProgressMutation.isPending}
                    onClick={() => {
                      if (!assignment) return;
                      const formData = new FormData();
                      formData.append('status', progressStatus);
                      formData.append('departure_date', activeDepartureDate || '');
                      formData.append('day_number', String(progressDayNumber));
                      formData.append('location', progressLocation || '');
                      formData.append('weather', progressWeather || '');
                      formData.append('note', progressNote || '');
                      formData.append('day_note', '');
                      fileListToFormData(formData, progressFiles);
                      updateProgressMutation.mutate({
                        id: assignment.tour_id,
                        payload: formData,
                      });
                    }}
                  >
                    Lưu tiến trình
                  </button>
                </div>

                <div className="rounded-4 border p-3">
                  <h3 className="h5 mb-3">Báo cáo sự cố</h3>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Loại sự cố</label>
                      <select className="form-select" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                        <option value="medical">Y tế</option>
                        <option value="transportation">Vận chuyển</option>
                        <option value="accommodation">Lưu trú</option>
                        <option value="weather">Thời tiết</option>
                        <option value="security">An ninh</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Mức độ</label>
                      <select className="form-select" value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value)}>
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="critical">Khẩn cấp</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Mô tả sự cố</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={incidentDescription}
                        onChange={(e) => setIncidentDescription(e.target.value)}
                        placeholder="Mô tả ngắn gọn sự cố, thời điểm, ảnh hưởng..."
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Địa điểm</label>
                      <input className="form-control" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Hành khách liên quan</label>
                      <div className="rounded-3 border p-3">
                        <div className="row g-2">
                          {passengerOptions.length ? (
                            passengerOptions.map((passenger) => {
                              const checked = incidentPassengers.includes(passenger.name);
                              return (
                                <div className="col-12" key={`${passenger.booking_id}-${passenger.name}`}>
                                  <label className="form-check">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={checked}
                                      onChange={(e) =>
                                        setIncidentPassengers((current) =>
                                          e.target.checked
                                            ? [...current, passenger.name]
                                            : current.filter((name) => name !== passenger.name),
                                        )
                                      }
                                    />
                                    <span className="form-check-label">{passenger.name}</span>
                                  </label>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-muted">Chưa có hành khách.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger w-100 mt-3"
                    disabled={!assignment || incidentMutation.isPending || !incidentDescription}
                    onClick={() => {
                      if (!assignment) return;
                      incidentMutation.mutate({
                        id: assignment.tour_id,
                        payload: {
                          incident_type: incidentType,
                          incident_description: incidentDescription,
                          severity: incidentSeverity,
                          departure_date: activeDepartureDate || undefined,
                          location: incidentLocation || undefined,
                          affected_passengers: incidentPassengers,
                        },
                      });
                    }}
                  >
                    Gửi báo cáo sự cố
                  </button>
                </div>

                <div className="rounded-4 border p-3">
                  <h3 className="h5 mb-3">Ghi chú cuối ngày</h3>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Ngày báo cáo</label>
                      <input type="number" min="1" className="form-control" value={dayNoteNumber} onChange={(e) => setDayNoteNumber(Number(e.target.value) || 1)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Địa điểm</label>
                      <input className="form-control" value={dayNoteLocation} onChange={(e) => setDayNoteLocation(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Thời tiết</label>
                      <input className="form-control" value={dayNoteWeather} onChange={(e) => setDayNoteWeather(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ghi chú cuối ngày</label>
                      <textarea className="form-control" rows="3" value={dayNote} onChange={(e) => setDayNote(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Điểm nổi bật, mỗi dòng một ý</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={dayNoteHighlights}
                        onChange={(e) => setDayNoteHighlights(e.target.value)}
                        placeholder="Ăn trưa tốt\nKhách check-in sớm\nDời lịch tham quan..."
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success w-100 mt-3"
                    disabled={!assignment || dayNoteMutation.isPending || !dayNote}
                    onClick={() => {
                      if (!assignment) return;
                      dayNoteMutation.mutate({
                        id: assignment.tour_id,
                        payload: {
                          departure_date: activeDepartureDate || '',
                          day_number: dayNoteNumber,
                          day_note: dayNote,
                          location: dayNoteLocation || undefined,
                          weather: dayNoteWeather || undefined,
                          highlights: dayNoteHighlights
                            .split('\n')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        },
                      });
                    }}
                  >
                    Lưu ghi chú cuối ngày
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-5 text-center text-muted">Không tìm thấy phân công.</div>
        )}
      </section>
    </div>
  );
}
