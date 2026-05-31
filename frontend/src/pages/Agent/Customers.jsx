import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { agentAPI } from '../../services/api';
import { bookingStatusLabel, formatDate, statusBadgeClass } from '../../utils/formatters';

export default function AgentCustomers() {
  const [keyword, setKeyword] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const { data: payload } = useQuery({
    queryKey: ['agent-customers', keyword],
    queryFn: async () => (await agentAPI.customers(keyword ? { q: keyword } : {})).data?.data ?? {},
  });

  const { data: detailPayload, isFetching: detailLoading } = useQuery({
    queryKey: ['agent-customer-detail', selectedCustomerId],
    queryFn: async () => (await agentAPI.showCustomer(selectedCustomerId)).data?.data ?? {},
    enabled: Boolean(selectedCustomerId),
  });

  const customers = payload?.items || [];
  const customer = detailPayload?.customer;
  const bookingStats = detailPayload?.booking_stats || {};
  const recentBookings = detailPayload?.recent_bookings || [];

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h2 className="h4 mb-1">Khách hàng</h2>
          <p className="mb-0 text-muted">Tra cứu khách, xem lịch sử booking gần đây và mở nhanh luồng tạo booking thay.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <input
            className="form-control"
            style={{ maxWidth: 320 }}
            placeholder="Tìm theo tên, email, SĐT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Link to="/agent/create-booking" state={{ customerId: selectedCustomerId || undefined }} className="btn btn-primary">
            Tạo booking
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customerItem) => (
              <tr key={customerItem.id}>
                <td>
                  <div className="fw-semibold">{customerItem.name}</div>
                  <div className="small text-muted">@{customerItem.username}</div>
                </td>
                <td>
                  <div>{customerItem.email}</div>
                  <div className="small text-muted">{customerItem.phone || '--'}</div>
                </td>
                <td>{formatDate(customerItem.created_at)}</td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      data-bs-toggle="modal"
                      data-bs-target="#customerDetailModal"
                      onClick={() => setSelectedCustomerId(customerItem.id)}
                    >
                      Chi tiết
                    </button>
                    <Link to="/agent/create-booking" state={{ customerId: customerItem.id }} className="btn btn-outline-primary btn-sm">
                      Tạo booking
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="4" className="py-4 text-center text-muted">
                  Chưa tìm thấy khách hàng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="customerDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Chi tiết khách hàng</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedCustomerId || detailLoading || !customer ? (
                <div className="text-muted">Đang tải chi tiết khách hàng...</div>
              ) : (
                <div className="d-grid gap-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Tổng booking</div>
                        <div className="fw-semibold">{bookingStats.total ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Đã xác nhận</div>
                        <div className="fw-semibold">{bookingStats.confirmed ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Hoàn thành</div>
                        <div className="fw-semibold">{bookingStats.completed ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="rounded-3 border bg-light p-3">
                        <div className="small text-muted">Đã hủy</div>
                        <div className="fw-semibold">{bookingStats.cancelled ?? 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Thông tin cơ bản</h4>
                    <div className="row g-2 small">
                      <div className="col-md-6">Họ tên: <strong>{customer.name}</strong></div>
                      <div className="col-md-6">Tên đăng nhập: <strong>@{customer.username || '--'}</strong></div>
                      <div className="col-md-6">Email: <strong>{customer.email}</strong></div>
                      <div className="col-md-6">Điện thoại: <strong>{customer.phone || '--'}</strong></div>
                      <div className="col-md-6">Trạng thái: <strong>{customer.status || '--'}</strong></div>
                      <div className="col-md-6">Ngày tạo: <strong>{formatDate(customer.created_at)}</strong></div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="h6 mb-0">Booking gần đây</h4>
                      <Link to="/agent/bookings" className="btn btn-outline-primary btn-sm">
                        Mở danh sách booking
                      </Link>
                    </div>
                    {recentBookings.length ? (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Tour</th>
                              <th>Ngày đi</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentBookings.map((booking) => (
                              <tr key={booking.id}>
                                <td>
                                  <div className="fw-semibold">{booking.tour?.title || '--'}</div>
                                  <div className="small text-muted">{booking.tour?.destination || '--'}</div>
                                </td>
                                <td>{formatDate(booking.departure_date)}</td>
                                <td>
                                  <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted">Khách hàng này chưa có booking nào.</div>
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
