import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { tourAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

function statCard({ label, value, tone = 'primary' }) {
  return (
    <div className="rounded-3 border bg-light p-3 h-100">
      <div className="small text-muted">{label}</div>
      <div className={`fs-4 fw-semibold text-${tone}`}>{value}</div>
    </div>
  );
}

function statusLabel(status) {
  const map = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
  };
  return map[status] || status;
}

export default function TourDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: payload, isLoading } = useQuery({
    queryKey: ['manager-tour-detail', id],
    queryFn: async () => (await tourAPI.managerDetail(id)).data?.data ?? null,
    enabled: Boolean(id),
  });

  const submitMutation = useMutation({
    mutationFn: (tourId) => tourAPI.submitForApproval(tourId),
    onSuccess: () => {
      toast.success('Đã gửi tour chờ duyệt');
      queryClient.invalidateQueries({ queryKey: ['manager-tour-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['manager-tours'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi tour chờ duyệt'),
  });

  const pinMutation = useMutation({
    mutationFn: (tourId) => tourAPI.togglePin(tourId),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái ghim tour');
      queryClient.invalidateQueries({ queryKey: ['manager-tour-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['manager-tours'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái ghim'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (tourId) => tourAPI.duplicate(tourId),
    onSuccess: () => {
      toast.success('Đã nhân bản tour');
      queryClient.invalidateQueries({ queryKey: ['manager-tour-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['manager-tours'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể nhân bản tour'),
  });

  const tour = payload?.tour || null;
  const stats = payload?.stats || {};
  const recentBookings = payload?.recent_bookings || [];
  const recentReviews = payload?.recent_reviews || [];
  const completionRatio = useMemo(() => {
    const booked = Number(stats.booked_pax || 0);
    const slots = Number(stats.available_slots || 0);
    const total = booked + slots;
    return total > 0 ? Math.round((booked / total) * 100) : 0;
  }, [stats.booked_pax, stats.available_slots]);

  if (isLoading) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="text-muted">Đang tải chi tiết tour...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="alert alert-warning mb-0">Không tìm thấy tour.</div>
      </div>
    );
  }

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <div className="small text-muted mb-1">Quản lý tour</div>
          <h2 className="h4 mb-2">{tour.title}</h2>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="badge bg-light text-dark border">{statusLabel(tour.status)}</span>
            <span className="small text-muted">{tour.destination}</span>
            <span className="small text-muted">|</span>
            <span className="small text-muted">{tour.duration_days} ngày</span>
            <span className="small text-muted">|</span>
            <span className="small text-muted">{tour.category}</span>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-start">
          <Link to="/manager/tours" className="btn btn-outline-secondary">
            Quay lại danh sách
          </Link>
          <Link to={`/manager/tours/${tour.id}/edit`} className="btn btn-outline-primary">
            Chỉnh sửa
          </Link>
          <button type="button" className="btn btn-outline-info" onClick={() => duplicateMutation.mutate(tour.id)}>
            Nhân bản
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => pinMutation.mutate(tour.id)}>
            {tour.pinned ? 'Bỏ ghim' : 'Ghim tour'}
          </button>
          {tour.status === 'draft' && (
            <button type="button" className="btn btn-primary" onClick={() => submitMutation.mutate(tour.id)}>
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {statCard({ label: 'Đơn đặt', value: stats.bookings_total ?? 0 })}
        {statCard({ label: 'Đang chờ', value: stats.bookings_pending ?? 0, tone: 'warning' })}
        {statCard({ label: 'Đã xác nhận', value: stats.bookings_confirmed ?? 0, tone: 'success' })}
        {statCard({ label: 'Điểm đánh giá', value: (stats.average_rating ?? 0).toString(), tone: 'warning' })}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Tổng quan vận hành</h3>
            <div className="row g-3">
              {[
                { label: 'Số khách đã đặt', value: stats.booked_pax ?? 0 },
                { label: 'Chỗ còn lại', value: stats.available_slots ?? 0 },
                { label: 'Tỉ lệ lấp đầy', value: `${completionRatio}%` },
                { label: 'Đánh giá', value: `${stats.review_count ?? 0} bài` },
              ].map((item) => (
                <div className="col-md-6" key={item.label}>
                  {statCard(item)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Thông tin cơ bản</h3>
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Giá gốc</span>
                <strong>{formatCurrency(tour.price_per_person)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Giá hiệu lực</span>
                <strong>{formatCurrency(tour.effective_price || tour.price_per_person)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Khởi tạo</span>
                <strong>{formatDate(tour.created_at)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Cập nhật</span>
                <strong>{formatDate(tour.updated_at)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Điểm tập trung</span>
                <strong className="text-end">{tour.meeting_point || '--'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Ngày khởi hành</h3>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Chỗ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(tour.departures || []).map((departure) => (
                    <tr key={departure.date}>
                      <td>{departure.date ? formatDate(departure.date) : '--'}</td>
                      <td>{departure.available_slots ?? 0}</td>
                      <td>{departure.status === 'active' ? 'Đang mở' : 'Tạm dừng'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Đối tác liên kết</h3>
            {(tour.linked_partners || []).length === 0 ? (
              <div className="text-muted">Chưa liên kết đối tác.</div>
            ) : (
              <div className="d-grid gap-2">
                {(tour.linked_partners || []).map((partner) => (
                  <div key={partner.id} className="rounded-3 bg-light p-3">
                    <div className="fw-semibold">{partner.company_name}</div>
                    <div className="small text-muted">{partner.service_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Đơn đặt gần đây</h3>
            {recentBookings.length === 0 ? (
              <div className="text-muted">Chưa có booking nào.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Khách</th>
                      <th>Ngày đi</th>
                      <th>Khách</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.booking_code || booking.id}</td>
                        <td>{booking.user?.name || '--'}</td>
                        <td>{booking.departure_date ? formatDate(booking.departure_date) : '--'}</td>
                        <td>{booking.num_pax}</td>
                        <td>{booking.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-5">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Đánh giá gần đây</h3>
            {recentReviews.length === 0 ? (
              <div className="text-muted">Chưa có đánh giá.</div>
            ) : (
              <div className="d-grid gap-3">
                {recentReviews.map((review) => (
                  <div key={review.id} className="rounded-3 bg-light p-3">
                    <div className="d-flex justify-content-between gap-2 mb-2">
                      <strong>{review.title || 'Bài đánh giá'}</strong>
                      <span className="badge bg-warning text-dark">{review.rating}★</span>
                    </div>
                    <div className="small text-muted mb-2">{review.user?.name || '--'}</div>
                    <div>{review.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
