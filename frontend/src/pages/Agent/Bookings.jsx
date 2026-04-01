import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function AgentBookings() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [internalNote, setInternalNote] = useState('');

  const { data: payload } = useQuery({
    queryKey: ['agent-bookings', status],
    queryFn: async () => (await agentAPI.bookings(status ? { status } : {})).data?.data ?? {},
  });

  const bookings = payload?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentAPI.updateBooking(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật ghi chú nội bộ');
      setSelectedBooking(null);
      setInternalNote('');
      queryClient.invalidateQueries({ queryKey: ['agent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật booking'),
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h2 className="h4 mb-1">Booking phụ trách</h2>
          <p className="mb-0 text-muted">Theo dõi các booking bạn đang xử lý và cập nhật ghi chú nội bộ cho từng khách.</p>
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
              <th>Ghi chú nội bộ</th>
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
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#agentBookingModal"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setInternalNote(booking.internal_note || '');
                    }}
                  >
                    {booking.internal_note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                  </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Chưa có booking nào được giao cho bạn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="agentBookingModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Ghi chú nội bộ booking</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="mb-3 small text-muted">
                {selectedBooking?.user?.name} • {selectedBooking?.tour?.title}
              </div>
              <textarea
                className="form-control"
                rows="5"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Ví dụ: khách ăn chay, cần hỗ trợ trẻ nhỏ, ưu tiên giờ bay..."
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!selectedBooking}
                onClick={() => selectedBooking && updateMutation.mutate({ id: selectedBooking.id, data: { internal_note: internalNote } })}
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
