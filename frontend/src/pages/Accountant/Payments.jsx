import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/api';
import {
  formatCurrency,
  formatDate,
  paymentStatusLabel,
  refundStatusLabel,
  statusBadgeClass,
} from '../../utils/formatters';

const refundFilters = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'rejected' },
];

export default function Payments() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [method, setMethod] = useState('');
  const [refundStatus, setRefundStatus] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundNote, setRefundNote] = useState('');

  const paymentParams = useMemo(
    () => ({
      ...(month ? { month } : {}),
      ...(paymentStatus ? { status: paymentStatus } : {}),
      ...(method ? { method } : {}),
    }),
    [month, paymentStatus, method],
  );

  const refundParams = useMemo(
    () => ({
      ...(refundStatus ? { status: refundStatus } : {}),
    }),
    [refundStatus],
  );

  const { data: paymentsPayload, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', paymentParams],
    queryFn: async () => (await paymentAPI.list(paymentParams)).data?.data ?? {},
  });

  const { data: refundPayload, isLoading: refundsLoading } = useQuery({
    queryKey: ['accountant-refunds', refundParams],
    queryFn: async () => (await paymentAPI.refundRequests(refundParams)).data?.data ?? {},
  });

  const payments = paymentsPayload?.items || [];
  const paymentSummary = paymentsPayload?.summary || {};
  const refunds = refundPayload?.items || [];

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['accountant-refunds'] });
    queryClient.invalidateQueries({ queryKey: ['accountant-report'] });
    queryClient.invalidateQueries({ queryKey: ['partner-liabilities'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id) => paymentAPI.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận thanh toán.');
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán.');
    },
  });

  const refundMutation = useMutation({
    mutationFn: (id) => paymentAPI.refund(id),
    onSuccess: () => {
      toast.success('Đã hoàn tiền giao dịch.');
      setSelectedPayment(null);
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể hoàn tiền.');
    },
  });

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

  const summaryCards = [
    { label: 'Tổng tiền ghi nhận', value: formatCurrency(paymentSummary.total_amount || 0) },
    { label: 'Thu thành công', value: formatCurrency(paymentSummary.successful_amount || 0) },
    { label: 'Đã hoàn tiền', value: formatCurrency(paymentSummary.refunded_amount || 0) },
    { label: 'Giao dịch chờ xử lý', value: paymentSummary.pending_count ?? 0 },
  ];

  return (
    <div className="d-grid gap-4">
      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-xl-row justify-content-between">
          <div>
            <h2 className="h4 mb-1">Quản lý thu và giao dịch</h2>
            <p className="mb-0 text-muted">
              Theo dõi thanh toán của khách, xác nhận thủ công các giao dịch chuyển khoản và xử lý hoàn tiền.
            </p>
          </div>
          <div className="row g-2 align-items-end">
            <div className="col-sm-auto">
              <label className="form-label">Tháng</label>
              <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="col-sm-auto">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="pending">Đang xử lý</option>
                <option value="success">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>
            <div className="col-sm-auto">
              <label className="form-label">Phương thức</label>
              <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="cash">Tiền mặt</option>
                <option value="bank">Chuyển khoản</option>
                <option value="momo">MoMo</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {summaryCards.map((item) => (
            <div className="col-md-6 col-xl-3" key={item.label}>
              <div className="rounded-4 border bg-light-subtle p-3 h-100">
                <div className="small text-muted mb-2">{item.label}</div>
                <div className="fs-5 fw-semibold">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Booking</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Phạm vi</th>
                <th>Trạng thái</th>
                <th>Ngày ghi nhận</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paymentsLoading ? (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-muted">
                    Đang tải dữ liệu giao dịch...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-muted">
                    Không có giao dịch phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-break">{payment.id}</td>
                    <td className="text-break">{payment.booking_id}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td className="text-uppercase">{payment.method}</td>
                    <td>{payment.payment_scope === 'deposit' ? 'Đặt cọc' : 'Toàn phần'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(payment.status)}`}>
                        {paymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td>{formatDate(payment.paid_at || payment.created_at)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {payment.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(payment.id)}
                          >
                            Xác nhận
                          </button>
                        )}
                        {payment.status === 'success' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#paymentRefundModal"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            Hoàn tiền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between">
          <div>
            <h3 className="h5 mb-1">Yêu cầu hoàn tiền từ khách hàng</h3>
            <p className="mb-0 text-muted">
              Kiểm tra lý do hủy, số tiền đề nghị hoàn và phản hồi để đồng bộ với booking, payment.
            </p>
          </div>
          <div className="d-flex gap-2">
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
                    <td>{refund.booking?.user?.name || '--'}</td>
                    <td>{refund.booking?.tour?.title || '--'}</td>
                    <td>{formatCurrency(refund.amount_requested)}</td>
                    <td style={{ minWidth: 220 }}>{refund.reason || '--'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(refund.status)}`}>
                        {refundStatusLabel(refund.status)}
                      </span>
                    </td>
                    <td>{formatDate(refund.created_at)}</td>
                    <td>
                      {refund.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#refundRequestModal"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setRefundNote(refund.admin_note || '');
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

      <div className="modal fade" id="paymentRefundModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Xác nhận hoàn tiền giao dịch</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="mb-2">
                Giao dịch: <strong>{selectedPayment?.id}</strong>
              </p>
              <p className="mb-0">
                Số tiền hoàn: <strong>{formatCurrency(selectedPayment?.amount)}</strong>
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                disabled={!selectedPayment || refundMutation.isPending}
                onClick={() => selectedPayment && refundMutation.mutate(selectedPayment.id)}
              >
                Hoàn tiền
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <div className="rounded-3 bg-light p-3 mb-3">
                <div className="small text-muted">Số tiền đề nghị hoàn</div>
                <div className="fw-semibold">{formatCurrency(selectedRefund?.amount_requested)}</div>
              </div>
              <div className="mb-3">
                <label className="form-label">Lý do khách hàng gửi</label>
                <div className="form-control bg-light" style={{ minHeight: 96 }}>
                  {selectedRefund?.reason || '--'}
                </div>
              </div>
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
              <button
                type="button"
                className="btn btn-success"
                data-bs-dismiss="modal"
                disabled={!selectedRefund || approveRefundMutation.isPending}
                onClick={() => selectedRefund && approveRefundMutation.mutate({ id: selectedRefund.id, note: refundNote })}
              >
                Duyệt hoàn tiền
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
