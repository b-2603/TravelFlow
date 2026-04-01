import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function TourApproval() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [selectedTour, setSelectedTour] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: payload } = useQuery({
    queryKey: ['tour-approval', status],
    queryFn: async () => (await adminAPI.tours({ status })).data?.data ?? {},
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveTour(id),
    onSuccess: () => {
      toast.success('Đã duyệt tour.');
      queryClient.invalidateQueries({ queryKey: ['tour-approval'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể duyệt tour.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminAPI.rejectTour(id, { reason }),
    onSuccess: () => {
      toast.success('Đã từ chối tour.');
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['tour-approval'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể từ chối tour.');
    },
  });

  const tours = payload?.items || [];

  return (
    <div className="bg-white border rounded-4 p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Duyệt tour</h2>
          <p className="text-muted mb-0">
            Màn này chỉ dùng để duyệt hoặc từ chối tour mới. Việc phân công hướng dẫn viên được thực hiện riêng ở mục Điều phối HDV khi có booking phát sinh.
          </p>
        </div>
        <select className="form-select" style={{ width: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      <div className="row g-4">
        {tours.map((tour) => (
          <div className="col-xl-6" key={tour.id}>
            <div className="card border-0 shadow-sm h-100 overflow-hidden">
              <img
                src={tour.images?.[0] || 'https://picsum.photos/seed/tour-approval/1200/800'}
                alt={tour.title}
                className="card-img-top"
                style={{ height: 220, objectFit: 'cover' }}
              />
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="badge bg-light text-dark">{tour.status}</span>
                  <span className="small text-muted">{formatDate(tour.created_at)}</span>
                </div>
                <h3 className="h5">{tour.title}</h3>
                <p className="small text-muted mb-2">Người tạo: {tour.creator?.name || 'Không rõ'}</p>
                <p className="small text-muted mb-3">Điểm đến: {tour.destination || '--'}</p>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#tourApprovalModal"
                    onClick={() => setSelectedTour(tour)}
                  >
                    Xem
                  </button>
                  {status === 'pending' && (
                    <>
                      <button type="button" className="btn btn-success btn-sm" onClick={() => approveMutation.mutate(tour.id)}>
                        Duyệt
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#rejectTourModal"
                        onClick={() => setSelectedTour(tour)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="modal fade" id="tourApprovalModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">{selectedTour?.title || 'Xem trước tour'}</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {!selectedTour ? (
                <div className="text-muted">Chưa chọn tour.</div>
              ) : (
                <div className="d-grid gap-3">
                  <p className="text-muted mb-0">{selectedTour.description}</p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="rounded-3 border p-3">
                        <div className="small text-muted">Danh mục</div>
                        <div className="fw-semibold">{selectedTour.category || '--'}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="rounded-3 border p-3">
                        <div className="small text-muted">Giá từ</div>
                        <div className="fw-semibold">{selectedTour.price_per_person?.toLocaleString?.('vi-VN') || selectedTour.price_per_person} đ</div>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-info mb-0">
                    Phân công hướng dẫn viên sẽ thực hiện ở mục <strong>Điều phối HDV</strong> sau khi có khách đặt tour.
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

      <div className="modal fade" id="rejectTourModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Từ chối tour</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Lý do</label>
              <textarea className="form-control" rows="4" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                disabled={!selectedTour || !rejectReason}
                onClick={() => selectedTour && rejectMutation.mutate({ id: selectedTour.id, reason: rejectReason })}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
