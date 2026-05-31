import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatCurrency, formatDate, paymentStatusLabel, statusBadgeClass } from '../../utils/formatters';
import DateInput from '../../components/DateInput';

export default function AgentBookings() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [internalNote, setInternalNote] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [confirmationNote, setConfirmationNote] = useState('');
  const [passengerConfirmed, setPassengerConfirmed] = useState(true);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendSms, setSendSms] = useState(false);

  const { data: payload } = useQuery({
    queryKey: ['agent-bookings', status],
    queryFn: async () => (await agentAPI.bookings(status ? { status } : {})).data?.data ?? {},
  });

  const { data: detailPayload, isFetching: detailLoading } = useQuery({
    queryKey: ['agent-booking-detail', selectedBookingId],
    queryFn: async () => (await agentAPI.showBooking(selectedBookingId)).data?.data ?? {},
    enabled: Boolean(selectedBookingId),
  });

  const bookings = payload?.items || [];
  const selectedBooking = detailPayload?.booking;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentAPI.updateBooking(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật booking');
      queryClient.invalidateQueries({ queryKey: ['agent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agent-booking-detail'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật booking'),
  });

  const confirmPassengerMutation = useMutation({
    mutationFn: ({ id, payload }) => agentAPI.confirmPassengerInfo(id, payload),
    onSuccess: () => {
      toast.success('Đã xác nhận hành khách');
      queryClient.invalidateQueries({ queryKey: ['agent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agent-booking-detail'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể xác nhận hành khách'),
  });

  const cancellationMutation = useMutation({
    mutationFn: ({ id, payload }) => agentAPI.processCancellation(id, payload),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu hủy cho kế toán');
      queryClient.invalidateQueries({ queryKey: ['agent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agent-booking-detail'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hủy'),
  });

  const reminderMutation = useMutation({
    mutationFn: ({ id, payload }) => agentAPI.sendReminder(id, payload),
    onSuccess: () => {
      toast.success('Đã gửi nhắc trước chuyến đi');
      queryClient.invalidateQueries({ queryKey: ['agent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['agent-booking-detail'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi reminder'),
  });

  const bookingTickets = selectedBooking?.support_tickets || [];
  const bookingPayments = selectedBooking?.payments || [];
  const bookingReview = selectedBooking?.review;

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h2 className="h4 mb-1">Booking phụ trách</h2>
          <p className="mb-0 text-muted">Theo dõi booking được giao, cập nhật ghi chú, xác nhận hành khách và xử lý yêu cầu phát sinh.</p>
        </div>
        <select className="form-select" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
          <option value="completed">Hoàn thành</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Khách</th>
              <th>Tour</th>
              <th>Ngày đi</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <div className="fw-semibold">{booking.user?.name}</div>
                  <div className="small text-muted">{booking.user?.phone || booking.user?.email}</div>
                </td>
                <td>{booking.tour?.title}</td>
                <td>{formatDate(booking.departure_date)}</td>
                <td>{formatCurrency(booking.total_price)}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass(booking.payment_status)}`}>{paymentStatusLabel(booking.payment_status)}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#agentBookingDetailModal"
                    onClick={() => {
                      setSelectedBookingId(booking.id);
                      setInternalNote(booking.internal_note || '');
                      setSpecialRequirements((booking.special_requirements || []).join(', '));
                      setDepartureDate(booking.departure_date || '');
                      setConfirmationNote('');
                      setPassengerConfirmed(true);
                      setCancellationReason('');
                      setCancellationNote('');
                      setRefundAmount('');
                      setReminderMessage('');
                      setSendSms(false);
                    }}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-muted">
                  Chưa có booking nào được giao cho bạn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="agentBookingDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Chi tiết booking</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedBookingId || detailLoading || !selectedBooking ? (
                <div className="text-muted">Đang tải chi tiết booking...</div>
              ) : (
                <div className="d-grid gap-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Khách</div>
                        <div className="fw-semibold">{selectedBooking.user?.name || '--'}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Tour</div>
                        <div className="fw-semibold">{selectedBooking.tour?.title || '--'}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Ngày đi</div>
                        <div className="fw-semibold">{formatDate(selectedBooking.departure_date)}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Tổng tiền</div>
                        <div className="fw-semibold">{formatCurrency(selectedBooking.total_price)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Ngày khởi hành</label>
                        <DateInput value={departureDate} onChange={(value) => setDepartureDate(value)} className="form-control" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Ghi chú nội bộ</label>
                        <input className="form-control" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Yêu cầu đặc biệt</label>
                        <input
                          className="form-control"
                          value={specialRequirements}
                          onChange={(e) => setSpecialRequirements(e.target.value)}
                          placeholder="Ăn chay, ghế gần cửa sổ, hỗ trợ trẻ nhỏ..."
                        />
                      </div>
                      <div className="col-12 d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={!selectedBooking}
                          onClick={() =>
                            updateMutation.mutate({
                              id: selectedBooking.id,
                              data: {
                                internal_note: internalNote,
                                special_requirements: specialRequirements
                                  ? specialRequirements.split(',').map((item) => item.trim()).filter(Boolean)
                                  : [],
                                departure_date: departureDate || undefined,
                              },
                            })
                          }
                        >
                          Lưu ghi chú
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          disabled={!selectedBooking}
                          onClick={() =>
                            confirmPassengerMutation.mutate({
                              id: selectedBooking.id,
                              payload: {
                                passenger_confirmed: passengerConfirmed,
                                confirmation_note: confirmationNote || undefined,
                              },
                            })
                          }
                        >
                          Xác nhận hành khách
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-warning"
                          disabled={!selectedBooking}
                          onClick={() =>
                            reminderMutation.mutate({
                              id: selectedBooking.id,
                              payload: {
                                custom_message: reminderMessage || undefined,
                                send_sms: sendSms,
                              },
                            })
                          }
                        >
                          Gửi reminder
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Xác nhận hành khách</h4>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Ghi chú xác nhận</label>
                        <input
                          className="form-control"
                          value={confirmationNote}
                          onChange={(e) => setConfirmationNote(e.target.value)}
                          placeholder="Ví dụ: đã kiểm tra CCCD và số điện thoại"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Trạng thái xác nhận</label>
                        <select className="form-select" value={passengerConfirmed ? 'yes' : 'no'} onChange={(e) => setPassengerConfirmed(e.target.value === 'yes')}>
                          <option value="yes">Đã xác nhận</option>
                          <option value="no">Chưa xác nhận</option>
                        </select>
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-outline-success w-100"
                          disabled={!selectedBooking}
                          onClick={() =>
                            confirmPassengerMutation.mutate({
                              id: selectedBooking.id,
                              payload: {
                                passenger_confirmed: passengerConfirmed,
                                confirmation_note: confirmationNote || undefined,
                              },
                            })
                          }
                        >
                          Cập nhật xác nhận
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Yêu cầu hủy booking</h4>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Lý do</label>
                        <input className="form-control" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Số tiền hoàn</label>
                        <input className="form-control" type="number" min="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Đính kèm SMS</label>
                        <div className="form-check mt-2">
                          <input className="form-check-input" type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
                          <label className="form-check-label">Gửi SMS khi nhắc</label>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Ghi chú hủy</label>
                        <textarea className="form-control" rows="3" value={cancellationNote} onChange={(e) => setCancellationNote(e.target.value)} />
                      </div>
                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          disabled={!selectedBooking || !cancellationReason}
                          onClick={() =>
                            cancellationMutation.mutate({
                              id: selectedBooking.id,
                              payload: {
                                cancellation_reason: cancellationReason,
                                refund_amount: refundAmount || undefined,
                                cancellation_note: cancellationNote || undefined,
                              },
                            })
                          }
                        >
                          Gửi yêu cầu hủy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="rounded-4 border p-3 h-100">
                        <h4 className="h6 mb-3">Thanh toán</h4>
                        {bookingPayments.length ? (
                          <div className="d-grid gap-2">
                            {bookingPayments.map((payment) => (
                              <div key={payment.id} className="d-flex justify-content-between border rounded-3 px-3 py-2">
                                <span>{payment.method || '--'} - {payment.status}</span>
                                <span>{formatCurrency(payment.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted">Chưa có lịch sử thanh toán.</div>
                        )}
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="rounded-4 border p-3 h-100">
                        <h4 className="h6 mb-3">Ticket hỗ trợ liên quan</h4>
                        {bookingTickets.length ? (
                          <div className="d-grid gap-2">
                            {bookingTickets.map((ticket) => (
                              <div key={ticket.id} className="border rounded-3 px-3 py-2">
                                <div className="fw-semibold">{ticket.subject}</div>
                                <div className="small text-muted">{ticket.status}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted">Chưa có ticket hỗ trợ.</div>
                        )}
                      </div>
                    </div>
                    {bookingReview && (
                      <div className="col-12">
                        <div className="rounded-4 border p-3">
                          <h4 className="h6 mb-3">Đánh giá của khách</h4>
                          <div className="fw-semibold mb-1">{bookingReview.title}</div>
                          <div className="small text-muted mb-2">Rating: {bookingReview.rating}/5</div>
                          <p className="mb-0 text-muted">{bookingReview.comment}</p>
                        </div>
                      </div>
                    )}
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
    </div>
  );
}
