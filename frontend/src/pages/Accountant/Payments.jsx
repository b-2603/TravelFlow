import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/api';
import {
  formatCurrency,
  formatDate,
  paymentStatusLabel,
  statusBadgeClass,
} from '../../utils/formatters';

export default function Payments() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [method, setMethod] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ bank_transaction_id: '', paid_at: '', amount: '', accountant_note: '' });

  const paymentParams = useMemo(
    () => ({
      ...(month ? { month } : {}),
      ...(paymentStatus ? { status: paymentStatus } : {}),
      ...(method ? { method } : {}),
      ...(bookingId ? { booking_id: bookingId } : {}),
      ...(transactionId ? { transaction_id: transactionId } : {}),
    }),
    [month, paymentStatus, method, bookingId, transactionId],
  );

  const { data: paymentsPayload, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', paymentParams],
    queryFn: async () => (await paymentAPI.list(paymentParams)).data?.data ?? {},
  });

  const payments = paymentsPayload?.items || [];
  const paymentSummary = paymentsPayload?.summary || {};

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['accountant-report'] });
    queryClient.invalidateQueries({ queryKey: ['partner-liabilities'] });
  };

  const confirmMutation = useMutation({
    mutationFn: ({ id, payload }) => paymentAPI.confirm(id, payload),
    onSuccess: () => {
      toast.success('Đã xác nhận thanh toán.');
      setConfirmPayment(null);
      setConfirmForm({ bank_transaction_id: '', paid_at: '', amount: '', accountant_note: '' });
      refreshData();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán.');
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
                <option value="submitted">Khách đã báo chuyển</option>
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
            <div className="col-sm-auto">
              <label className="form-label">Booking</label>
              <input className="form-control" value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="ID booking" />
            </div>
            <div className="col-sm-auto">
              <label className="form-label">Mã tham chiếu</label>
              <input className="form-control" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="PAY-..." />
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
                        {['pending', 'submitted'].includes(payment.status) && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#paymentConfirmModal"
                            onClick={() => {
                              setConfirmPayment(payment);
                              setConfirmForm({
                                bank_transaction_id: '',
                                paid_at: '',
                                amount: String(payment.amount || ''),
                                accountant_note: '',
                              });
                            }}
                          >
                            Xác nhận
                          </button>
                        )}
                        {payment.status === 'success' ? <span className="small text-muted">--</span> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="modal fade" id="paymentConfirmModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Xác nhận thanh toán chuyển khoản</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="small text-muted mb-3">Giao dịch: {confirmPayment?.id || '--'} • Booking: {confirmPayment?.booking_id || '--'}</div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Số tiền xác nhận</label>
                  <input
                    className="form-control"
                    value={confirmForm.amount}
                    onChange={(e) => setConfirmForm((v) => ({ ...v, amount: e.target.value }))}
                    placeholder="2000000"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Mã GD ngân hàng (nếu có)</label>
                  <input
                    className="form-control"
                    value={confirmForm.bank_transaction_id}
                    onChange={(e) => setConfirmForm((v) => ({ ...v, bank_transaction_id: e.target.value }))}
                    placeholder="BANK-TRANSACTION-ID"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Thời gian nhận tiền (nếu có)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={confirmForm.paid_at}
                    onChange={(e) => setConfirmForm((v) => ({ ...v, paid_at: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Ghi chú kế toán</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={confirmForm.accountant_note}
                    onChange={(e) => setConfirmForm((v) => ({ ...v, accountant_note: e.target.value }))}
                    placeholder="Ví dụ: đối soát theo sao kê ngày..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-success"
                data-bs-dismiss="modal"
                disabled={!confirmPayment || confirmMutation.isPending}
                onClick={() => {
                  if (!confirmPayment) return;
                  confirmMutation.mutate({
                    id: confirmPayment.id,
                    payload: {
                      amount: confirmForm.amount ? Number(confirmForm.amount) : undefined,
                      bank_transaction_id: confirmForm.bank_transaction_id || undefined,
                      paid_at: confirmForm.paid_at || undefined,
                      accountant_note: confirmForm.accountant_note || undefined,
                    },
                  });
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
