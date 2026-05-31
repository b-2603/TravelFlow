import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { formatDate, statusBadgeClass } from '../../utils/formatters';

function ratingLabel(rating) {
  const value = Number(rating || 0);
  return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
}

function statusLabel(status) {
  const map = {
    approved: 'Đã duyệt',
    pending: 'Chờ duyệt',
    rejected: 'Từ chối',
  };

  return map[status] || status || '--';
}

export default function ReviewModeration() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', rating: '', search: '', tour: '' });
  const [selectedReview, setSelectedReview] = useState(null);

  const { data: payload, isLoading } = useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: async () => (await adminAPI.reviews(filters)).data?.data ?? {},
  });

  const reviews = payload?.items || [];
  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((item) => item.status === 'approved').length;
    const average = total ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total : 0;

    return {
      total,
      approved,
      average: average.toFixed(1),
    };
  }, [reviews]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveReview(id),
    onSuccess: () => {
      toast.success('Đã duyệt review.');
      refresh();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể duyệt review.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => {
      toast.success('Đã xóa review.');
      refresh();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa review.');
    },
  });

  return (
    <div className="bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">Duyệt review</h2>
          <p className="mb-0 text-muted">
            Quản lý đánh giá của khách: xem nội dung, duyệt lại những bài cần kiểm soát hoặc xóa bài không phù hợp.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <div className="rounded-3 border bg-light px-3 py-2">
            <div className="small text-muted">Tổng review</div>
            <div className="fw-semibold">{stats.total}</div>
          </div>
          <div className="rounded-3 border bg-light px-3 py-2">
            <div className="small text-muted">Đã duyệt</div>
            <div className="fw-semibold">{stats.approved}</div>
          </div>
          <div className="rounded-3 border bg-light px-3 py-2">
            <div className="small text-muted">Điểm TB</div>
            <div className="fw-semibold">{stats.average}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <select className="form-select" value={filters.status} onChange={(e) => setFilters((value) => ({ ...value, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={filters.rating} onChange={(e) => setFilters((value) => ({ ...value, rating: e.target.value }))}>
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} sao
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Tìm theo tiêu đề, nội dung hoặc khách hàng"
            value={filters.search}
            onChange={(e) => setFilters((value) => ({ ...value, search: e.target.value }))}
          />
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Tìm theo tour hoặc điểm đến"
            value={filters.tour}
            onChange={(e) => setFilters((value) => ({ ...value, tour: e.target.value }))}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Tour</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Đang tải danh sách review...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Không có review phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="fw-semibold">{review.user?.name || '--'}</div>
                    <div className="small text-muted">{review.user?.avatar ? 'Có ảnh đại diện' : 'Chưa có ảnh đại diện'}</div>
                  </td>
                  <td>
                    <div className="fw-semibold">{review.tour?.title || '--'}</div>
                    <div className="small text-muted">{review.tour?.destination || '--'}</div>
                  </td>
                  <td className="fw-semibold text-warning">{ratingLabel(review.rating)}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(review.status)}`}>{statusLabel(review.status)}</span>
                  </td>
                  <td>{formatDate(review.created_at)}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#reviewDetailModal"
                        onClick={() => setSelectedReview(review)}
                      >
                        Xem
                      </button>
                      {review.status !== 'approved' && (
                        <button type="button" className="btn btn-success btn-sm" onClick={() => approveMutation.mutate(review.id)}>
                          Duyệt
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          if (window.confirm('Xóa review này khỏi hệ thống?')) {
                            deleteMutation.mutate(review.id);
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="reviewDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">{selectedReview?.title || 'Chi tiết review'}</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedReview ? (
                <div className="text-muted">Chưa chọn review.</div>
              ) : (
                <div className="d-grid gap-3">
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className={`badge ${statusBadgeClass(selectedReview.status)}`}>{statusLabel(selectedReview.status)}</span>
                    <span className="badge bg-light text-dark">{selectedReview.tour?.title || '--'}</span>
                    <span className="badge bg-light text-dark">{selectedReview.tour?.destination || '--'}</span>
                  </div>
                  <div className="rounded-4 border p-3">
                    <div className="small text-muted mb-1">Khách hàng</div>
                    <div className="fw-semibold">{selectedReview.user?.name || '--'}</div>
                    <div className="small text-muted">{selectedReview.user?.email || '--'}</div>
                  </div>
                  <div className="rounded-4 border p-3">
                    <div className="small text-muted mb-1">Bài viết</div>
                    <h4 className="h5 mb-2">{selectedReview.title}</h4>
                    <p className="mb-0 text-muted">{selectedReview.comment}</p>
                  </div>
                  <div className="rounded-4 border p-3">
                    <div className="small text-muted mb-1">Hình ảnh đính kèm</div>
                    {selectedReview.images?.length ? (
                      <div className="d-flex flex-wrap gap-2">
                        {selectedReview.images.map((image, index) => (
                          <a key={`${selectedReview.id}-${index}`} href={image} target="_blank" rel="noreferrer">
                            <img
                              src={image}
                              alt={`${selectedReview.title} ${index + 1}`}
                              className="rounded-3 border"
                              style={{ width: 96, height: 96, objectFit: 'cover' }}
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted">Không có hình ảnh đính kèm.</div>
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
