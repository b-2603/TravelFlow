import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI, customerAPI } from '../services/api';
import {
  bookingStatusLabel,
  bookingPaymentBadgeClass,
  bookingPaymentLabel,
  formatCurrency,
  formatDate,
  paymentStatusLabel,
  refundStatusLabel,
  statusBadgeClass,
  supportStatusLabel,
} from '../utils/formatters';

const supportSchema = Yup.object({
  subject: Yup.string().required('Vui lòng nhập chủ đề'),
  message: Yup.string().min(10, 'Vui lòng nhập tối thiểu 10 ký tự').required('Vui lòng nhập nội dung'),
});

const refundSchema = Yup.object({
  reason: Yup.string().min(10, 'Vui lòng nhập tối thiểu 10 ký tự').required('Vui lòng nhập lý do hoàn tiền'),
});

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function BookingDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: async () => {
      const response = await bookingAPI.detail(id);
      return response.data?.data ?? null;
    },
    enabled: Boolean(id),
  });

  const supportMutation = useMutation({
    mutationFn: (payload) => customerAPI.createSupport(payload),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu hỗ trợ');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-supports'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ'),
  });

  const refundMutation = useMutation({
    mutationFn: (payload) => customerAPI.createRefundRequest(payload),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu hoàn tiền');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-refunds'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hoàn tiền'),
  });

  const documentMutation = useMutation({
    mutationFn: () => bookingAPI.document(id),
    onSuccess: (response) => {
      downloadBlob(response.data, `booking-${id}.pdf`);
      toast.success('Đã tải hóa đơn / chứng từ PDF');
    },
    onError: () => toast.error('Không thể tải hóa đơn / chứng từ'),
  });

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light border">Đang tải chi tiết booking...</div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Không thể tải booking này.</div>
      </div>
    );
  }

  const latestRefund = booking.refund_requests?.[0];
  const pendingPayments = (booking.payments || []).filter((payment) => ['pending', 'submitted'].includes(payment.status));
  const paidAmount = (booking.payments || [])
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const refundedAmount = (booking.payments || [])
    .filter((payment) => payment.status === 'refunded')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const netPaidAmount = Math.max(paidAmount - refundedAmount, 0);
  const remainingAmount = Math.max(Number(booking.total_price || 0) - netPaidAmount, 0);

  return (
    <div className="container py-4 py-lg-5">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="rounded-4 border bg-white p-4 shadow-sm mb-4">
            <div className="mb-4 d-flex flex-wrap justify-content-between gap-3">
              <div>
                <h1 className="h3 mb-1">{booking.tour?.title || 'Chi tiết booking'}</h1>
                <p className="mb-0 text-muted">{booking.tour?.destination || '--'}</p>
              </div>
              <div className="d-flex flex-column gap-2 align-items-start align-items-md-end">
                <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                <span className={`badge ${bookingPaymentBadgeClass(booking)}`}>{bookingPaymentLabel(booking)}</span>
              </div>
            </div>

            <div className="row g-3 mb-4">
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
                <div>{formatCurrency(booking.total_price)}</div>
              </div>
            </div>

            <h2 className="h5 mb-3">Danh sách hành khách</h2>
            <div className="d-grid gap-3">
              {(booking.passengers || []).map((passenger, index) => (
                <div key={`${passenger.passport}-${index}`} className="rounded-3 border p-3">
                  <div className="fw-semibold">{passenger.name}</div>
                  <div className="small text-muted">Ngày sinh: {formatDate(passenger.dob)}</div>
                  <div className="small text-muted">Hộ chiếu / CCCD: {passenger.passport}</div>
                </div>
              ))}
            </div>
          </div>

          {booking.status === 'completed' && booking.tour?.slug && (
            <div className="rounded-4 border bg-white p-4 shadow-sm mb-4">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
                <div>
                  <h2 className="h5 mb-1">Đánh giá chuyến đi</h2>
                  <p className="mb-0 text-muted">
                    {booking.review
                      ? 'Bạn đã gửi đánh giá cho booking này. Có thể xem lại ở trang chi tiết tour.'
                      : 'Booking đã hoàn thành. Bạn có thể mở trang tour để viết đánh giá ngay.'}
                  </p>
                </div>
                <Link to={`/tours/${booking.tour.slug}#reviews`} className="btn btn-outline-success">
                  {booking.review ? 'Xem đánh giá' : 'Viết đánh giá'}
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <div className="row g-4">
              <div className="col-lg-6">
                <h2 className="h5 mb-3">Gửi hỗ trợ cho booking này</h2>
                <Formik
                  initialValues={{ subject: '', message: '' }}
                  validationSchema={supportSchema}
                  onSubmit={(values, helpers) => {
                    supportMutation.mutate(
                      { ...values, booking_id: booking.id },
                      { onSuccess: () => helpers.resetForm() }
                    );
                  }}
                >
                  <Form noValidate>
                    <div className="mb-3">
                      <label className="form-label">Chủ đề</label>
                      <Field name="subject" className="form-control" />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="subject" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nội dung</label>
                      <Field as="textarea" rows="4" name="message" className="form-control" />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="message" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-outline-primary" disabled={supportMutation.isPending}>
                      {supportMutation.isPending ? 'Đang gửi...' : 'Gửi hỗ trợ'}
                    </button>
                  </Form>
                </Formik>
              </div>

              <div className="col-lg-6">
                <h2 className="h5 mb-3">Yêu cầu hoàn tiền</h2>
                {latestRefund ? (
                  <div className="rounded-3 border p-3">
                    <div className="mb-2 d-flex justify-content-between gap-2">
                      <span className="text-muted">Trạng thái</span>
                      <span className={`badge ${statusBadgeClass(latestRefund.status)}`}>{refundStatusLabel(latestRefund.status)}</span>
                    </div>
                    <div className="mb-2 small text-muted">Số tiền yêu cầu: {formatCurrency(latestRefund.amount_requested)}</div>
                    <p className="mb-2">{latestRefund.reason}</p>
                    {latestRefund.admin_note && <div className="small text-muted">Ghi chú: {latestRefund.admin_note}</div>}
                  </div>
                ) : (
                  <Formik
                    initialValues={{ reason: '' }}
                    validationSchema={refundSchema}
                    onSubmit={(values, helpers) => {
                      refundMutation.mutate(
                        { booking_id: booking.id, reason: values.reason, amount_requested: booking.total_price },
                        { onSuccess: () => helpers.resetForm() }
                      );
                    }}
                  >
                    <Form noValidate>
                      <div className="mb-3">
                        <label className="form-label">Lý do hoàn tiền</label>
                        <Field as="textarea" rows="4" name="reason" className="form-control" />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="reason" />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-outline-danger" disabled={refundMutation.isPending}>
                        {refundMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu hoàn tiền'}
                      </button>
                    </Form>
                  </Formik>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h5 mb-3">Thanh toán và chứng từ</h2>
            <div className="mb-3 d-flex justify-content-between">
              <span>Tổng tiền</span>
              <strong>{formatCurrency(booking.total_price)}</strong>
            </div>
            <div className="mb-3 d-flex justify-content-between">
              <span>Đã thanh toán</span>
              <strong>{formatCurrency(paidAmount)}</strong>
            </div>
            <div className="mb-4 d-flex justify-content-between">
              <span>Còn lại</span>
              <strong className="text-danger">{formatCurrency(remainingAmount)}</strong>
            </div>
            <div className="mb-4 d-flex justify-content-between">
              <span>Trạng thái thanh toán</span>
              <span className={`badge ${bookingPaymentBadgeClass(booking)}`}>{bookingPaymentLabel(booking)}</span>
            </div>

            {booking.payments?.length > 0 ? (
              <div className="mb-4 d-grid gap-2">
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="rounded-3 border p-3 small">
                    <div className="fw-semibold">{formatCurrency(payment.amount)}</div>
                    <div className="text-muted">
                      {payment.method} • {paymentStatusLabel(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-light border">Chưa có giao dịch thanh toán nào.</div>
            )}

            {pendingPayments.length > 0 && (
              <div className="alert alert-warning py-2">
                Đã có {pendingPayments.length} giao dịch đang chờ đối soát. Trạng thái chỉ chuyển sang đã thanh toán sau khi hệ thống xác nhận nhận tiền.
              </div>
            )}

            <div className="d-grid gap-2">
              {remainingAmount > 0 && (
                <Link to={`/payments/${booking.id}`} className="btn btn-primary">
                  Mở mã QR thanh toán
                </Link>
              )}
              <button type="button" className="btn btn-primary" disabled={documentMutation.isPending} onClick={() => documentMutation.mutate()}>
                {documentMutation.isPending ? 'Đang tải...' : 'Tải hóa đơn / chứng từ PDF'}
              </button>
              <Link to="/my-bookings" className="btn btn-outline-primary">
                Quay lại đơn của tôi
              </Link>
              <Link to="/my-support" className="btn btn-outline-secondary">
                Xem tất cả hỗ trợ
              </Link>
            </div>

            {booking.support_tickets?.length > 0 && (
              <div className="mt-4">
                <h3 className="h6 mb-3">Hỗ trợ gần nhất</h3>
                <div className="d-grid gap-2">
                  {booking.support_tickets.slice(0, 2).map((ticket) => (
                    <div key={ticket.id} className="rounded-3 border p-3 small">
                      <div className="d-flex justify-content-between gap-2 mb-2">
                        <span className="fw-semibold">{ticket.subject}</span>
                        <span className={`badge ${statusBadgeClass(ticket.status)}`}>{supportStatusLabel(ticket.status)}</span>
                      </div>
                      {ticket.handler?.name && (
                        <div className="text-muted">
                          Người xử lý: {ticket.handler.name}
                          {ticket.handled_at ? ` • ${formatDate(ticket.handled_at)}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
