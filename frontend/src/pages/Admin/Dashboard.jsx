import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI, bookingAPI, tourAPI } from '../../services/api';
import { formatCurrency, formatDate, supportStatusLabel } from '../../utils/formatters';
import SystemSettingsEditor from './SystemSettingsEditor';

function MiniBar({ label, value, max }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;

  return (
    <div>
      <div className="d-flex justify-content-between small text-muted mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="progress" style={{ height: 10 }}>
        <div className="progress-bar bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('answered');

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminAPI.dashboard()).data?.data ?? {},
  });

  const { data: bookingsPayload } = useQuery({
    queryKey: ['admin-bookings-dashboard'],
    queryFn: async () => (await bookingAPI.adminList()).data?.data ?? {},
  });

  const { data: toursPayload } = useQuery({
    queryKey: ['dashboard-tours'],
    queryFn: async () => (await tourAPI.list()).data?.data ?? {},
  });

  const { data: partnersPayload } = useQuery({
    queryKey: ['admin-partners', 'pending'],
    queryFn: async () => (await adminAPI.partners({ status: 'pending' })).data?.data ?? {},
  });

  const { data: supportPayload } = useQuery({
    queryKey: ['admin-supports', 'open'],
    queryFn: async () => (await adminAPI.supports({ status: 'open' })).data?.data ?? {},
  });

  const approvePartnerMutation = useMutation({
    mutationFn: (id) => adminAPI.approvePartner(id),
    onSuccess: () => {
      toast.success('Đã duyệt đối tác.');
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const rejectPartnerMutation = useMutation({
    mutationFn: (id) => adminAPI.rejectPartner(id),
    onSuccess: () => {
      toast.success('Đã từ chối đối tác.');
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const replySupportMutation = useMutation({
    mutationFn: ({ id, payload }) => adminAPI.replySupport(id, payload),
    onSuccess: () => {
      toast.success('Đã phản hồi ticket hỗ trợ.');
      setSelectedTicket(null);
      setReply('');
      setReplyStatus('answered');
      queryClient.invalidateQueries({ queryKey: ['admin-supports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const bookings = bookingsPayload?.items || [];
  const tours = toursPayload?.items || [];
  const pendingPartners = partnersPayload?.items || [];
  const openSupports = supportPayload?.items || [];
  const latestBookings = bookings.slice(0, 5);
  const upcomingTours = tours.slice(0, 5);

  const bookingStatusCounts = stats?.booking_status || { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
  const maxStatus = Math.max(...Object.values(bookingStatusCounts), 1);
  const monthlyRevenue = stats?.monthly_revenue || [];
  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.value), 1);

  return (
    <div className="d-grid gap-4">
      <div className="row g-3">
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(stats?.total_revenue), tone: 'primary' },
          { label: 'Booking hôm nay', value: stats?.bookings_today ?? 0, tone: 'warning' },
          { label: 'Tour đang hoạt động', value: stats?.tours_active ?? 0, tone: 'success' },
          { label: 'Người dùng mới / 30 ngày', value: stats?.users_new_30_days ?? 0, tone: 'info' },
          { label: 'Review / 30 ngày', value: stats?.reviews_30_days ?? 0, tone: 'primary' },
          { label: 'Tổng review', value: stats?.reviews_total ?? 0, tone: 'secondary' },
          { label: 'Điểm review TB', value: stats?.avg_review_rating ?? 0, tone: 'warning' },
          { label: 'Đối tác chờ duyệt', value: stats?.pending_partners ?? 0, tone: 'secondary' },
          { label: 'Ticket đang mở', value: stats?.open_support_tickets ?? 0, tone: 'danger' },
          { label: 'Tài khoản bị khóa', value: stats?.locked_users ?? 0, tone: 'dark' },
        ].map((item) => (
          <div className="col-md-6 col-xl-3" key={item.label}>
            <div className={`card border-0 shadow-sm bg-${item.tone}-subtle h-100`}>
              <div className="card-body">
                <div className="small text-uppercase text-muted mb-2">{item.label}</div>
                <div className="display-6 fw-semibold">{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="bg-white border rounded-4 p-4 shadow-sm h-100">
            <h2 className="h5 mb-4">Xu hướng doanh thu 6 tháng gần nhất</h2>
            <div className="d-grid gap-3">
              {monthlyRevenue.map((item) => (
                <MiniBar key={item.label} label={item.label} value={item.value} max={maxRevenue} />
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="bg-white border rounded-4 p-4 shadow-sm h-100">
            <h2 className="h5 mb-4">Phân bố trạng thái booking</h2>
            <div className="d-grid gap-3">
              {Object.entries(bookingStatusCounts).map(([label, value]) => (
                <MiniBar key={label} label={label} value={value} max={maxStatus} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="bg-white border rounded-4 p-4 shadow-sm">
            <h2 className="h5 mb-3">Booking mới nhất</h2>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Khách hàng</th>
                    <th>Ngày đi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {latestBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.tour?.title || '--'}</td>
                      <td>{booking.user?.name || '--'}</td>
                      <td>{formatDate(booking.departure_date)}</td>
                      <td>{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="bg-white border rounded-4 p-4 shadow-sm">
            <h2 className="h5 mb-3">Tour sắp khởi hành</h2>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Điểm đến</th>
                    <th>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingTours.map((tour) => (
                    <tr key={tour.id}>
                      <td>{tour.title}</td>
                      <td>{tour.destination}</td>
                      <td>{formatCurrency(tour.price_per_person)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-6">
          <div className="bg-white border rounded-4 p-4 shadow-sm h-100">
            <h2 className="h5 mb-3">Đối tác chờ duyệt</h2>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Công ty</th>
                    <th>Loại dịch vụ</th>
                    <th>Liên hệ</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPartners.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">
                        Không có đối tác chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    pendingPartners.map((partner) => (
                      <tr key={partner.id}>
                        <td>{partner.company_name}</td>
                        <td>{partner.service_type}</td>
                        <td>{partner.contact_info?.contact_name || partner.user?.name || '--'}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button type="button" className="btn btn-success btn-sm" onClick={() => approvePartnerMutation.mutate(partner.id)}>
                              Duyệt
                            </button>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => rejectPartnerMutation.mutate(partner.id)}>
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="bg-white border rounded-4 p-4 shadow-sm h-100">
            <h2 className="h5 mb-3">Khiếu nại và hỗ trợ đang mở</h2>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Chủ đề</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {openSupports.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-muted">
                        Không có ticket mở.
                      </td>
                    </tr>
                  ) : (
                    openSupports.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.user?.name || '--'}</td>
                        <td>{ticket.subject}</td>
                        <td>{supportStatusLabel(ticket.status)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#replySupportModal"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setReply(ticket.reply || '');
                              setReplyStatus(ticket.status === 'closed' ? 'closed' : 'answered');
                            }}
                          >
                            Phản hồi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SystemSettingsEditor />

      <div className="modal fade" id="replySupportModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Phản hồi hỗ trợ</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="small text-muted mb-3">
                {selectedTicket?.user?.name || '--'} | {selectedTicket?.booking?.tour?.title || 'Không gắn tour'}
              </div>
              <div className="mb-3">
                <label className="form-label">Nội dung khách gửi</label>
                <div className="form-control bg-light" style={{ minHeight: 100 }}>
                  {selectedTicket?.message || '--'}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                  <option value="answered">Đã phản hồi</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>
              <div>
                <label className="form-label">Phản hồi</label>
                <textarea className="form-control" rows="4" value={reply} onChange={(e) => setReply(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!selectedTicket || !reply}
                onClick={() => selectedTicket && replySupportMutation.mutate({ id: selectedTicket.id, payload: { reply, status: replyStatus } })}
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
