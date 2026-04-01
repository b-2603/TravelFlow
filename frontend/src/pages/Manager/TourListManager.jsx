import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { tourAPI } from '../../services/api';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/formatters';

function statusLabel(status) {
  const map = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
  };

  return map[status] || status;
}

export default function TourListManager() {
  const queryClient = useQueryClient();

  const { data: payload } = useQuery({
    queryKey: ['manager-tours'],
    queryFn: async () => (await tourAPI.managerList()).data?.data ?? {},
  });

  const tours = payload?.items || [];
  const summary = payload?.summary || {};

  const submitMutation = useMutation({
    mutationFn: (id) => tourAPI.submitForApproval(id),
    onSuccess: () => {
      toast.success('Đã gửi tour chờ duyệt');
      queryClient.invalidateQueries({ queryKey: ['manager-tours'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi tour chờ duyệt'),
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between align-items-lg-center">
        <div>
          <h2 className="h4 mb-1">Tour của bạn</h2>
          <p className="mb-0 text-muted">Theo dõi trạng thái, khuyến mãi, đối tác liên kết và tỉ lệ lấp đầy của các tour đã tạo.</p>
        </div>
        <Link to="/manager/tours/create" className="btn btn-primary">
          Thêm tour mới
        </Link>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Tổng tour', value: summary.total_tours ?? 0 },
          { label: 'Bản nháp', value: summary.draft_tours ?? 0 },
          { label: 'Chờ duyệt', value: summary.pending_tours ?? 0 },
          { label: 'Đã duyệt', value: summary.approved_tours ?? 0 },
          { label: 'Booking', value: summary.total_bookings ?? 0 },
          { label: 'Doanh thu ước tính', value: formatCurrency(summary.estimated_revenue ?? 0) },
        ].map((item) => (
          <div className="col-md-4 col-xl-2" key={item.label}>
            <div className="h-100 rounded-3 border bg-light p-3">
              <div className="small text-muted">{item.label}</div>
              <div className="fw-semibold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Trạng thái</th>
              <th>Giá hiệu lực</th>
              <th>Đối tác</th>
              <th>Lấp đầy</th>
              <th>Ngày tạo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tours.map((tour) => (
              <tr key={tour.id}>
                <td>
                  <div className="fw-semibold">{tour.title}</div>
                  <div className="small text-muted">{tour.destination}</div>
                  {tour.reject_reason && <div className="small text-danger mt-1">Lý do từ chối: {tour.reject_reason}</div>}
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass(tour.status === 'approved' ? 'completed' : tour.status)}`}>
                    {statusLabel(tour.status)}
                  </span>
                </td>
                <td>
                  <div>{formatCurrency(tour.effective_price || tour.price_per_person)}</div>
                  {tour.promotion_type !== 'none' && (
                    <div className="small text-muted">
                      {tour.promotion_type === 'percent' ? `Giảm ${tour.promotion_value}%` : `Giảm ${formatCurrency(tour.promotion_value)}`}
                    </div>
                  )}
                </td>
                <td>{tour.linked_partners?.length || 0}</td>
                <td>{tour.summary?.fill_rate || 0}%</td>
                <td>{formatDate(tour.created_at)}</td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <Link to={`/manager/tours/${tour.id}/edit`} className="btn btn-outline-primary btn-sm">
                      Sửa
                    </Link>
                    {tour.status === 'draft' && (
                      <button type="button" className="btn btn-outline-success btn-sm" onClick={() => submitMutation.mutate(tour.id)}>
                        Gửi duyệt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tours.length === 0 && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-muted">
                  Bạn chưa tạo tour nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
