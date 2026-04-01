import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../services/api';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', payment_status: '' });

  const { data: payload } = useQuery({
    queryKey: ['admin-bookings-page', filters],
    queryFn: async () => (await bookingAPI.adminList(filters)).data?.data ?? {},
  });

  const bookings = payload?.items || [];

  const confirmMutation = useMutation({
    mutationFn: (id) => bookingAPI.confirm(id),
    onSuccess: () => {
      toast.success('Duyệt booking thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-page'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể duyệt booking');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingAPI.cancel(id),
    onSuccess: () => {
      toast.success('Hủy booking thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-page'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể hủy booking');
    },
  });

  return (
    <div className="bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Quản lý booking</h2>
          <p className="text-muted mb-0">Lọc toàn bộ booking theo trạng thái và thanh toán.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <select className="form-select" value={filters.status} onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã hủy</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={filters.payment_status} onChange={(e) => setFilters((v) => ({ ...v, payment_status: e.target.value }))}>
            <option value="">Tất cả trạng thái thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="partial">Thanh toán một phần</option>
            <option value="paid">Đã thanh toán</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Khách hàng</th>
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
                <td>{booking.tour?.title || '--'}</td>
                <td>{booking.user?.name || '--'}</td>
                <td>{formatDate(booking.departure_date)}</td>
                <td>{formatCurrency(booking.total_price)}</td>
                <td><span className={`badge ${statusBadgeClass(booking.status)}`}>{booking.status}</span></td>
                <td><span className={`badge ${statusBadgeClass(booking.payment_status)}`}>{booking.payment_status}</span></td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    {booking.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={confirmMutation.isPending}
                        onClick={() => confirmMutation.mutate(booking.id)}
                      >
                        Duyệt
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(booking.id)}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
