import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { bookingAPI, paymentAPI, systemAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

function buildVietQrUrl({ bankCode, accountNumber, accountName, amount, addInfo }) {
  if (!bankCode || !accountNumber) return '';

  const base = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png`;
  const params = new URLSearchParams();
  if (amount) params.set('amount', String(amount));
  if (addInfo) params.set('addInfo', addInfo);
  if (accountName) params.set('accountName', accountName);

  return `${base}?${params.toString()}`;
}

function buildQrImageUrl(text) {
  if (!text) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(text)}`;
}

export default function PaymentCheckout() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const attemptedSettingsRefreshRef = useRef(false);
  const wasPaidRef = useRef(false);

  const {
    data: booking,
    isLoading,
    isError,
    refetch: refetchBooking,
  } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: async () => {
      const response = await bookingAPI.detail(id);
      return response.data?.data ?? null;
    },
    enabled: Boolean(id),
  });

  const {
    data: paymentSettings,
    refetch: refetchPaymentSettings,
    isFetching: isFetchingPaymentSettings,
  } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const response = await systemAPI.paymentSettings();
      return response.data?.data ?? {};
    },
  });

  useEffect(() => {
    if (attemptedSettingsRefreshRef.current) return;
    if (!paymentSettings) return;

    // If the user opened this page before bank settings were configured, React Query may hold cached nulls.
    // Force one refresh so QR can appear without requiring manual reload.
    const missing = !paymentSettings.bank_code || !paymentSettings.bank_account_number;
    if (missing && !isFetchingPaymentSettings) {
      attemptedSettingsRefreshRef.current = true;
      refetchPaymentSettings();
    }
  }, [isFetchingPaymentSettings, paymentSettings, refetchPaymentSettings]);

  const paymentSummary = useMemo(() => {
    const payments = booking?.payments || [];
    const pendingPayments = payments
      .filter((item) => ['pending', 'submitted'].includes(item.status))
      .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
    const paidAmount = payments
      .filter((item) => item.status === 'success')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const refundedAmount = payments
      .filter((item) => item.status === 'refunded')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalAmount = Number(booking?.total_price || 0);
    const netPaid = Math.max(paidAmount - refundedAmount, 0);
    const remaining = Math.max(totalAmount - netPaid, 0);
    const activePayment = pendingPayments[0] || null;
    const dueAmount = activePayment ? Number(activePayment.amount || 0) : remaining;

    return { paidAmount: netPaid, totalAmount, remaining, pendingPayments, activePayment, dueAmount, refundedAmount };
  }, [booking]);

  const createPendingPaymentMutation = useMutation({
    mutationFn: (payload) => paymentAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo yêu cầu thanh toán mới.');
    },
  });

  const customerNotifyMutation = useMutation({
    mutationFn: (paymentId) => paymentAPI.customerConfirm(paymentId),
    onSuccess: (response) => {
      toast.success(response?.data?.message || 'Đã ghi nhận thông báo chuyển khoản.');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể gửi thông báo chuyển khoản lúc này.');
    },
  });

  useEffect(() => {
    if (!booking || paymentSummary.remaining <= 0 || paymentSummary.activePayment || createPendingPaymentMutation.isPending || createPendingPaymentMutation.isSuccess) {
      return;
    }

    createPendingPaymentMutation.mutate({
      booking_id: booking.id,
      method: 'bank',
      payment_scope: 'full',
      amount: paymentSummary.remaining,
    });
  }, [booking, createPendingPaymentMutation, paymentSummary.activePayment, paymentSummary.remaining]);

  const shouldAutoRefresh = Boolean(paymentSummary.activePayment?.id) && paymentSummary.remaining > 0;
  const isPaid = paymentSummary.remaining <= 0;

  useEffect(() => {
    if (!booking) return;
    if (wasPaidRef.current) return;

    if (isPaid) {
      wasPaidRef.current = true;
      toast.success('Thanh toán thành công. Booking đã được cập nhật.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    }
  }, [booking, isPaid, queryClient]);

  useEffect(() => {
    if (!shouldAutoRefresh) return;

    const timer = setInterval(() => {
      refetchBooking();
    }, 5000);

    return () => clearInterval(timer);
  }, [refetchBooking, shouldAutoRefresh]);

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light border">Đang tải trang thanh toán...</div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Không thể tải thông tin thanh toán.</div>
      </div>
    );
  }

  const transferNotePrefix = paymentSettings?.payment_note_prefix || 'BOOKING';
  const transferNote = `${transferNotePrefix} ${paymentSummary.activePayment?.transaction_id || booking.id}`;
  const qrUrl = buildVietQrUrl({
    bankCode: paymentSettings?.bank_code,
    accountNumber: paymentSettings?.bank_account_number,
    accountName: paymentSettings?.bank_account_name,
    amount: Math.round(paymentSummary.dueAmount),
    addInfo: transferNote,
  });
  const paymentTitle = 'Thanh toán chuyển khoản';
  const paymentBadge = 'QR';

  return (
    <div className="container py-4 py-lg-5">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="rounded-4 border bg-white p-4 shadow-sm mb-4">
            <div className="mb-3">
              <div className="small text-uppercase text-primary fw-semibold">Xác nhận thông tin</div>
              <h1 className="h4 mb-1">Thanh toán booking</h1>
              <div className="text-muted small">Mã booking: {booking.id}</div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="small text-muted">Khách hàng</div>
                <div className="fw-semibold">{booking.user?.name || '--'}</div>
                <div className="small text-muted">{booking.user?.phone || booking.user?.email || '--'}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted">Chuyến đi</div>
                <div className="fw-semibold">{booking.tour?.title || '--'}</div>
                <div className="small text-muted">{booking.tour?.destination || '--'}</div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Ngày đi</div>
                <div>{formatDate(booking.departure_date)}</div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Số khách</div>
                <div>{booking.num_pax}</div>
              </div>
              <div className="col-md-4">
                <div className="small text-muted">Tổng tiền</div>
                <div>{formatCurrency(paymentSummary.totalAmount)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-primary mb-3">Danh sách hành khách</h2>
            <div className="d-grid gap-2">
              {(booking.passengers || []).map((passenger, index) => (
                <div key={`${passenger.passport}-${index}`} className="rounded-3 border p-3">
                  <div className="fw-semibold">{passenger.name}</div>
                  <div className="small text-muted">Ngày sinh: {formatDate(passenger.dob)}</div>
                  <div className="small text-muted">CCCD / Hộ chiếu: {passenger.passport}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">{paymentTitle}</h2>
              <span className="badge bg-primary-subtle text-primary">{paymentBadge}</span>
            </div>

            <div className="mb-3 d-flex justify-content-between">
              <span>Đã thanh toán</span>
              <strong>{formatCurrency(paymentSummary.paidAmount)}</strong>
            </div>
            <div className="mb-4 d-flex justify-content-between">
              <span>Còn lại của booking</span>
              <strong className="text-danger">{formatCurrency(paymentSummary.remaining)}</strong>
            </div>

            {isPaid ? (
              <div className="alert alert-success">Booking này đã được thanh toán đủ. Cảm ơn bạn!</div>
            ) : createPendingPaymentMutation.isPending && !paymentSummary.activePayment ? (
              <div className="alert alert-light border">Đang tạo yêu cầu thanh toán và mã QR...</div>
            ) : !paymentSettings?.bank_code || !paymentSettings?.bank_account_number ? (
              <div className="alert alert-warning d-flex flex-column gap-2">
                <div>Chưa cấu hình ngân hàng để tạo QR. Vui lòng liên hệ bộ phận hỗ trợ.</div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm align-self-start"
                  onClick={() => refetchPaymentSettings()}
                  disabled={isFetchingPaymentSettings}
                >
                  {isFetchingPaymentSettings ? 'Đang tải lại...' : 'Tải lại QR'}
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-3 border bg-light p-3 mb-3 small">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Phiếu thanh toán</span>
                    <span className="fw-semibold">{paymentSummary.activePayment?.transaction_id || 'Đang cập nhật'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Số tiền trên mã QR</span>
                    <span className="fw-semibold text-danger">{formatCurrency(paymentSummary.dueAmount)}</span>
                  </div>
                </div>

                <div className="text-center mb-3">
                  <img src={qrUrl} alt="QR thanh toán" className="img-fluid rounded-3 border" style={{ maxWidth: 260 }} />
                  <div className="small text-muted mt-2">
                    Quét mã QR để điền sẵn số tiền và nội dung chuyển khoản
                  </div>
                </div>

                <div className="rounded-3 border p-3 small">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Ngân hàng</span>
                    <span className="fw-semibold">{paymentSettings.bank_name || '--'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Số tài khoản</span>
                    <span className="fw-semibold">{paymentSettings.bank_account_number || '--'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Chủ tài khoản</span>
                    <span className="fw-semibold">{paymentSettings.bank_account_name || '--'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Chi nhánh</span>
                    <span className="fw-semibold">{paymentSettings.bank_branch || '--'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Nội dung</span>
                    <span className="fw-semibold">{transferNote}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-3 border bg-light p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 small">
                    <span className="fw-semibold">Đang chờ cập nhật giao dịch</span>
                    {shouldAutoRefresh ? <span className="text-muted">Tự cập nhật 5 giây/lần</span> : null}
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" style={{ width: '100%' }} />
                  </div>
                  <div className="small text-muted mt-2">
                    {shouldAutoRefresh
                      ? 'Hệ thống sẽ tự động cập nhật trạng thái sau khi nhận được giao dịch chuyển khoản (có thể mất 1–2 phút).'
                      : 'Vui lòng chuyển khoản đúng số tiền và đúng nội dung để hệ thống tự đối soát giao dịch.'}
                  </div>
                </div>

                <div className="d-grid gap-2 mt-3">
                  {paymentSummary.activePayment?.status === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={customerNotifyMutation.isPending}
                      onClick={() => customerNotifyMutation.mutate(paymentSummary.activePayment.id)}
                    >
                      {customerNotifyMutation.isPending ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                    </button>
                  )}
                  {paymentSummary.activePayment?.status === 'submitted' && (
                    <div className="small text-muted">
                      Đã ghi nhận bạn đã chuyển khoản. Vui lòng chờ hệ thống đối soát hoặc kế toán xác nhận.
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="d-grid gap-2 mt-4">
              <Link to={`/my-bookings/${booking.id}`} className="btn btn-outline-primary">
                Quay lại chi tiết booking
              </Link>
              <Link to="/my-bookings" className="btn btn-light">
                Về danh sách booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
