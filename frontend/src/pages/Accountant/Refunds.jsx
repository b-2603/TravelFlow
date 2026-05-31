import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/api';
import { formatCurrency, formatDate, refundStatusLabel, statusBadgeClass } from '../../utils/formatters';

const refundFilters = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Đã hoàn tiền', value: 'refunded' },
  { label: 'Từ chối', value: 'rejected' },
];

export default function Refunds() {
  const queryClient = useQueryClient();
  const [refundStatus, setRefundStatus] = useState('');
  const [refundSearch, setRefundSearch] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundNote, setRefundNote] = useState('');
  const [refundCompleteForm, setRefundCompleteForm] = useState({
    amount: '',
    method: 'refund',
    bank_transaction_id: '',
    refund_to_bank_name: '',
    refund_to_account_number: '',
    refund_to_account_name: '',
  });

  const refundParams = useMemo(
    () => ({
      ...(refundStatus ? { status: refundStatus } : {}),
      ...(refundSearch ? { search: refundSearch } : {}),
    }),
    [refundStatus, refundSearch],
  );

  const { data: refundPayload, isLoading: refundsLoading } = useQuery({
    queryKey: ['accountant-refunds', refundParams],
    queryFn: async () => (await paymentAPI.refundRequests(refundParams)).data?.data ?? {},
  });

  const refunds = refundPayload?.items || [];
  const refundSummary = refundPayload?.summary || {};

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['accountant-refunds'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['accountant-report'] });
  };

  const approveRefundMutation = useMutation({
    mutationFn: ({ id, note }) => paymentAPI.approveRefund(id, { admin_note: note }),
    onSuccess: () => {
      toast.success('Đã duyệt yêu cầu hoàn tiền.');
      setSelectedRefund(null);
      setRefundNote('');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể duyệt yêu cầu hoàn tiền.');
    },
  });

  const rejectRefundMutation = useMutation({
    mutationFn: ({ id, note }) => paymentAPI.rejectRefund(id, { admin_note: note }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu hoàn tiền.');
      setSelectedRefund(null);
      setRefundNote('');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu hoàn tiền.');
    },
  });

  const markRefundedMutation = useMutation({
    mutationFn: ({ id, payload }) => paymentAPI.markRefunded(id, payload),
    onSuccess: () => {
      toast.success('Đã xác nhận hoàn tiền.');
      setSelectedRefund(null);
      setRefundNote('');
      setRefundCompleteForm({
        amount: '',
        method: 'refund',
        bank_transaction_id: '',
        refund_to_bank_name: '',
        refund_to_account_number: '',
        refund_to_account_name: '',
      });
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể xác nhận hoàn tiền.');
    },
  });

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between">
          <div>
            <h2 className="h4 mb-1">Hoàn tiền</h2>
            <p className="mb-0 text-muted">
              Danh sách yêu cầu hoàn tiền phát sinh khi khách hủy tour. Kế toán duyệt và xác nhận đã hoàn tiền để đồng bộ booking + payment.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap justify-content-start justify-content-lg-end">
            {refundFilters.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                className={`btn btn-sm ${refundStatus === filter.value ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setRefundStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Tổng tiền yêu cầu</div>
              <div className="fs-5 fw-semibold">{formatCurrency(refundSummary.total_requested_amount || 0)}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Đang chờ duyệt</div>
              <div className="fs-5 fw-semibold">{refundSummary.pending_count ?? 0}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Đã duyệt</div>
              <div className="fs-5 fw-semibold">{refundSummary.approved_count ?? 0}</div>
            </div>
          </div>
          <div className="col-md-6 col-xl-3">
            <div className="rounded-4 border bg-light-subtle p-3 h-100">
              <div className="small text-muted mb-2">Đã hoàn tiền</div>
              <div className="fs-5 fw-semibold">{refundSummary.refunded_count ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-6">
            <input
              className="form-control"
              value={refundSearch}
              onChange={(e) => setRefundSearch(e.target.value)}
              placeholder="Tìm theo lý do, ghi chú kế toán hoặc ghi chú xử lý..."
            />
          </div>
          <div className="col-lg-6 text-lg-end small text-muted align-self-center">
            Trung bình yêu cầu: {formatCurrency(refundSummary.average_requested_amount || 0)}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Tour</th>
                <th>Số tiền yêu cầu</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {refundsLoading ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-muted">
                    Đang tải yêu cầu hoàn tiền...
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-muted">
                    Chưa có yêu cầu hoàn tiền nào.
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>
                      <div className="fw-semibold">{refund.booking?.user?.name || '--'}</div>
                      <div className="small text-muted text-break">{refund.booking?.user?.email || refund.booking?.user?.phone || '--'}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{refund.booking?.tour?.title || '--'}</div>
                      <div className="small text-muted">{refund.booking?.departure_date || '--'}</div>
                    </td>
                    <td>{formatCurrency(refund.amount_requested)}</td>
                    <td style={{ minWidth: 240 }}>
                      <div className="fw-semibold text-break">{refund.reason || '--'}</div>
                      <div className="small text-muted">{refund.resolution_note || refund.preferred_resolution || '--'}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(refund.status)}`}>{refundStatusLabel(refund.status)}</span>
                    </td>
                    <td>{formatDate(refund.created_at)}</td>
                    <td>
                      {['pending', 'approved'].includes(refund.status) ? (
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#refundRequestModal"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setRefundNote(refund.admin_note || '');
                            setRefundCompleteForm({
                              amount: String(refund.amount_requested || ''),
                              method: 'refund',
                              bank_transaction_id: '',
                              refund_to_bank_name: refund.refund_to?.bank_name || '',
                              refund_to_account_number: refund.refund_to?.account_number || '',
                              refund_to_account_name: refund.refund_to?.account_name || '',
                            });
                          }}
                        >
                          Xử lý
                        </button>
                      ) : (
                        <span className="small text-muted">{refund.admin_note || 'Đã có kết quả xử lý'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="modal fade" id="refundRequestModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Xử lý yêu cầu hoàn tiền</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="small text-muted mb-3">
                {selectedRefund?.booking?.user?.name || '--'} | {selectedRefund?.booking?.tour?.title || '--'}
              </div>
              <div className="rounded-3 border bg-light-subtle p-3 mb-3 small">
                <div className="d-flex justify-content-between">
                  <span>Booking</span>
                  <span className="fw-semibold">{selectedRefund?.booking?.id || '--'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Mã yêu cầu</span>
                  <span className="fw-semibold">{selectedRefund?.id || '--'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Ngày đi</span>
                  <span className="fw-semibold">{selectedRefund?.booking?.departure_date || '--'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Tổng tiền</span>
                  <span className="fw-semibold">{formatCurrency(selectedRefund?.booking?.total_price || 0)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Đã thu (net)</span>
                  <span className="fw-semibold">{formatCurrency(selectedRefund?.booking?.payment_summary?.net_paid || 0)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Đã hoàn</span>
                  <span className="fw-semibold">{formatCurrency(selectedRefund?.booking?.payment_summary?.refunded_total || 0)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Trạng thái thanh toán</span>
                  <span className="fw-semibold">{selectedRefund?.booking?.payment_status || '--'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Liên hệ</span>
                  <span className="fw-semibold">
                    {selectedRefund?.booking?.user?.phone || selectedRefund?.booking?.user?.email || '--'}
                  </span>
                </div>
              </div>

              <div className="rounded-3 bg-light p-3 mb-3">
                <div className="small text-muted">Số tiền hoàn theo chính sách</div>
                <div className="fw-semibold">{formatCurrency(selectedRefund?.amount_requested)}</div>
              </div>

              <div className="row g-2 mb-3 small">
                <div className="col-6">
                  <div className="text-muted">Tỷ lệ hoàn</div>
                  <div className="fw-semibold">{Math.round((selectedRefund?.refund_rate || 0) * 100)}%</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Phí hủy</div>
                  <div className="fw-semibold">{formatCurrency(selectedRefund?.fee_amount || 0)}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Còn trước ngày đi</div>
                  <div className="fw-semibold">{selectedRefund?.days_before_departure ?? '--'} ngày</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Thời gian xử lý</div>
                  <div className="fw-semibold">
                    {selectedRefund?.processing_days?.[0] ?? 0}-{selectedRefund?.processing_days?.[1] ?? 0} ngày làm việc
                  </div>
                </div>
              </div>

              {(selectedRefund?.booking?.payment_lines || []).length > 0 ? (
                <div className="mb-3">
                  <label className="form-label">Giao dịch đã ghi nhận</label>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Số tiền</th>
                          <th>Trạng thái</th>
                          <th>Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRefund.booking.payment_lines.map((line) => (
                          <tr key={line.id}>
                            <td className="text-break">{line.transaction_id || line.id}</td>
                            <td>{formatCurrency(line.amount)}</td>
                            <td>{line.status}</td>
                            <td>{formatDate(line.paid_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className="mb-3">
                <label className="form-label">Lý do khách hàng gửi</label>
                <div className="form-control bg-light" style={{ minHeight: 96 }}>
                  {selectedRefund?.reason || '--'}
                </div>
              </div>

              {selectedRefund?.status === 'approved' ? (
                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <label className="form-label">Số tiền hoàn thực tế</label>
                    <input
                      className="form-control"
                      value={refundCompleteForm.amount}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, amount: e.target.value }))}
                      placeholder="2000000"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Hình thức hoàn</label>
                    <select
                      className="form-select"
                      value={refundCompleteForm.method}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, method: e.target.value }))}
                    >
                      <option value="refund">Hoàn tiền</option>
                      <option value="bank">Chuyển khoản</option>
                      <option value="cash">Tiền mặt</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ngân hàng nhận hoàn</label>
                    <input
                      className="form-control"
                      value={refundCompleteForm.refund_to_bank_name}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, refund_to_bank_name: e.target.value }))}
                      placeholder="VD: TPBank"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Số tài khoản nhận hoàn</label>
                    <input
                      className="form-control"
                      value={refundCompleteForm.refund_to_account_number}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, refund_to_account_number: e.target.value }))}
                      placeholder="0123456789"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Chủ tài khoản nhận hoàn</label>
                    <input
                      className="form-control"
                      value={refundCompleteForm.refund_to_account_name}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, refund_to_account_name: e.target.value }))}
                      placeholder="NGUYEN VAN A"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mã GD hoàn (nếu có)</label>
                    <input
                      className="form-control"
                      value={refundCompleteForm.bank_transaction_id}
                      onChange={(e) => setRefundCompleteForm((v) => ({ ...v, bank_transaction_id: e.target.value }))}
                      placeholder="BANK-TRANSACTION-ID"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="form-label">Ghi chú kế toán</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Nhập ghi chú xử lý, quyết định hoặc điều kiện hoàn tiền..."
                />
              </div>
              <div className="mt-3 small text-muted">
                {selectedRefund?.policy_snapshot ? 'Đã lưu snapshot chính sách tại thời điểm gửi yêu cầu.' : 'Không có snapshot chính sách.'}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                data-bs-dismiss="modal"
                disabled={!selectedRefund || rejectRefundMutation.isPending}
                onClick={() => selectedRefund && rejectRefundMutation.mutate({ id: selectedRefund.id, note: refundNote })}
              >
                Từ chối
              </button>
              {selectedRefund?.status === 'approved' ? (
                <button
                  type="button"
                  className="btn btn-success"
                  data-bs-dismiss="modal"
                  disabled={!selectedRefund || markRefundedMutation.isPending}
                  onClick={() => {
                    if (!selectedRefund) return;
                    markRefundedMutation.mutate({
                      id: selectedRefund.id,
                      payload: {
                        admin_note: refundNote || undefined,
                        amount: refundCompleteForm.amount ? Number(refundCompleteForm.amount) : undefined,
                        method: refundCompleteForm.method || undefined,
                        bank_transaction_id: refundCompleteForm.bank_transaction_id || undefined,
                        refund_to_bank_name: refundCompleteForm.refund_to_bank_name || undefined,
                        refund_to_account_number: refundCompleteForm.refund_to_account_number || undefined,
                        refund_to_account_name: refundCompleteForm.refund_to_account_name || undefined,
                      },
                    });
                  }}
                >
                  Xác nhận đã hoàn tiền
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  data-bs-dismiss="modal"
                  disabled={!selectedRefund || approveRefundMutation.isPending}
                  onClick={() => selectedRefund && approveRefundMutation.mutate({ id: selectedRefund.id, note: refundNote })}
                >
                  Duyệt hoàn tiền
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
