import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { paymentAPI } from '../../services/api';
import { bookingPaymentLabel, formatCurrency, formatDate, paymentStatusLabel, statusBadgeClass } from '../../utils/formatters';

function infoCard({ label, value }) {
  return (
    <div className="rounded-3 border bg-light p-3 h-100">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value}</div>
    </div>
  );
}

export default function PaymentDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: payload, isLoading } = useQuery({
    queryKey: ['accountant-payment-detail-page', id],
    queryFn: async () => (await paymentAPI.detail(id)).data?.data ?? null,
    enabled: Boolean(id),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ paymentId, payload }) => paymentAPI.confirm(paymentId, payload),
    onSuccess: () => {
      toast.success('Đã xác nhận thanh toán.');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-report'] });
      queryClient.invalidateQueries({ queryKey: ['partner-liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-payment-detail-page', id] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể xác nhận thanh toán.'),
  });

  const payment = payload || null;

  if (isLoading) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="text-muted">Đang tải chi tiết thanh toán...</div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-4 border bg-white p-4 shadow-sm">
        <div className="alert alert-warning mb-0">Không tìm thấy thanh toán.</div>
      </div>
    );
  }

  const booking = payment.booking || {};
  const paymentLines = booking.payment_lines || [];

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between gap-3">
        <div>
          <div className="small text-muted mb-1">Kế toán / Tài chính</div>
          <h2 className="h4 mb-2">Chi tiết thanh toán</h2>
          <div className="text-muted">
            Giao dịch: {payment.transaction_id || payment.id} · Booking: {payment.booking_id}
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/accountant/payments" className="btn btn-outline-secondary">
            Quay lại danh sách
          </Link>
          <button
            type="button"
            className="btn btn-success"
            disabled={!['pending', 'submitted'].includes(payment.status) || confirmMutation.isPending}
            onClick={() =>
              confirmMutation.mutate({
                paymentId: payment.id,
                payload: {
                  amount: payment.amount,
                  bank_transaction_id: payment.bank_transaction_id || undefined,
                  paid_at: payment.paid_at || undefined,
                  accountant_note: payment.accountant_note || undefined,
                },
              })
            }
          >
            Xác nhận nhanh
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {infoCard({ label: 'Số tiền', value: formatCurrency(payment.amount || 0) })}
        {infoCard({ label: 'Phương thức', value: String(payment.method || '--').toUpperCase() })}
        {infoCard({ label: 'Phạm vi', value: bookingPaymentLabel(booking) })}
        {infoCard({ label: 'Trạng thái', value: paymentStatusLabel(payment.status) })}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Thông tin booking</h3>
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Tour</span>
                <strong>{booking.tour?.title || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Điểm đến</span>
                <strong>{booking.tour?.destination || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Khởi hành</span>
                <strong>{booking.departure_date || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Khách hàng</span>
                <strong>{booking.user?.name || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Email</span>
                <strong>{booking.user?.email || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Điện thoại</span>
                <strong>{booking.user?.phone || '--'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Đối soát</h3>
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Đã thu</span>
                <strong>{formatCurrency(booking.payment_summary?.paid_total || 0)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Đã hoàn</span>
                <strong>{formatCurrency(booking.payment_summary?.refunded_total || 0)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Net paid</span>
                <strong>{formatCurrency(booking.payment_summary?.net_paid || 0)}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Mã GD ngân hàng</span>
                <strong>{payment.bank_transaction_id || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Ghi chú khách</span>
                <strong>{payment.customer_note || '--'}</strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Ghi chú kế toán</span>
                <strong>{payment.accountant_note || '--'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="rounded-4 border p-3 h-100">
            <h3 className="h5 mb-3">Lịch sử thanh toán</h3>
            {paymentLines.length === 0 ? (
              <div className="text-muted">Chưa có giao dịch liên quan.</div>
            ) : (
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
                    {paymentLines.map((line) => (
                      <tr key={line.id}>
                        <td className="text-break">{line.transaction_id || line.id}</td>
                        <td>{formatCurrency(line.amount)}</td>
                        <td>
                          <span className={`badge ${statusBadgeClass(line.status)}`}>{paymentStatusLabel(line.status)}</span>
                        </td>
                        <td>{formatDate(line.paid_at)}</td>
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
            <h3 className="h5 mb-3">Nhận xét nghiệp vụ</h3>
            <div className="small text-muted mb-2">Tình trạng hiện tại</div>
            <div className={`badge ${statusBadgeClass(payment.status)} mb-3`}>{paymentStatusLabel(payment.status)}</div>
            <div className="text-muted">
              Trang này dùng để kiểm tra nhanh dữ liệu, so khớp booking và xác nhận các giao dịch còn chờ xử lý trước khi đóng sổ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
