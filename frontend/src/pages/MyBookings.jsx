import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI } from '../services/api';
import {
  bookingStatusLabel,
  bookingPaymentBadgeClass,
  bookingPaymentLabel,
  formatCurrency,
  formatDate,
  statusBadgeClass,
} from '../utils/formatters';

const tabs = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];
const tabLabels = {
  all: 'Tất cả',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
};

const cancelSchema = Yup.object({
  reason: Yup.string().min(10, 'Vui lòng nhập tối thiểu 10 ký tự').required('Vui lòng nhập lý do hủy'),
  refund_to_bank_name: Yup.string().nullable().max(120),
  refund_to_account_number: Yup.string().nullable().max(80),
  refund_to_account_name: Yup.string().nullable().max(120),
});

function tierCardClass(index) {
  return ['bg-primary-subtle', 'bg-success-subtle', 'bg-warning-subtle', 'bg-danger-subtle'][index] || 'bg-light';
}

function bookingRemainingAmount(booking) {
  const total = Number(booking?.total_price || 0);
  const paid = (booking?.payments || [])
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const refunded = (booking?.payments || [])
    .filter((payment) => payment.status === 'refunded')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return Math.max(total - Math.max(paid - refunded, 0), 0);
}

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: async () => {
      const response = await bookingAPI.list(activeTab === 'all' ? {} : { status: activeTab });
      return response.data?.data ?? [];
    },
  });

  const { data: cancelPreviewData, isLoading: previewLoading } = useQuery({
    queryKey: ['booking-cancel-preview', selectedBooking?.id],
    queryFn: async () => (await bookingAPI.cancelPreview(selectedBooking.id)).data?.data ?? null,
    enabled: Boolean(selectedBooking?.id),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, payload }) => bookingAPI.cancel(id, payload),
    onSuccess: () => {
      toast.success('Đã ghi nhận yêu cầu hủy tour.');
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-refunds'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hủy tour');
    },
  });

  const preview = cancelPreviewData?.preview;
  const policy = cancelPreviewData?.policy;

  useEffect(() => {
    if (!selectedBooking) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedBooking(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedBooking]);

  const cancelPolicyModal = selectedBooking
    ? createPortal(
      <>
        <div
          className="modal fade show"
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
          style={{ display: 'block' }}
          onClick={() => setSelectedBooking(null)}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title fs-5">Chính sách hoàn tiền theo thời điểm hủy</h2>
                <button type="button" className="btn-close" onClick={() => setSelectedBooking(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                {!selectedBooking || previewLoading || !preview ? (
                  <div className="text-muted">Đang tải thông tin hủy tour...</div>
                ) : (
                  <>
                    <div className="mb-4 rounded-4 border p-4">
                      <div className="small text-uppercase text-muted mb-2">Booking đang chọn</div>
                      <div className="h5 mb-1">{selectedBooking.tour?.title}</div>
                      <div className="text-muted">
                        Ngày đi {formatDate(selectedBooking.departure_date)} • Còn {preview.days_before_departure} ngày trước khởi hành
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      {(policy?.tiers || []).map((tier, index) => (
                        <div key={tier.key} className="col-lg-3 col-md-6">
                          <div className={`rounded-4 border p-3 h-100 ${tierCardClass(index)}`}>
                            <div className="fw-semibold mb-2">{Math.round((tier.refund_rate || 0) * 100)}%</div>
                            <div className="fw-bold mb-2">{tier.label}</div>
                            <div className="small mb-2">{tier.refund_text}</div>
                            <div className="small text-muted">
                              {tier.processing_days?.[0] || 0}-{tier.processing_days?.[1] || 0} ngày làm việc
                            </div>
                            {tier.extra_note ? <div className="small mt-2 text-muted">{tier.extra_note}</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-4 border border-primary-subtle bg-primary-subtle p-4 mb-4">
                      <div className="fw-semibold mb-3">
                        Ví dụ tính hoàn tiền thực tế: {selectedBooking.tour?.title} — Tổng tiền {formatCurrency(preview.base_amount)}
                      </div>
                      <div className="d-grid gap-2">
                        <div className="d-flex justify-content-between">
                          <span>Tổng tiền đã thanh toán</span>
                          <strong>{formatCurrency(preview.base_amount)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Tỷ lệ hoàn</span>
                          <strong>{Math.round((preview.refund_rate || 0) * 100)}%</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Phí hủy tour</span>
                          <strong>{formatCurrency(preview.fee_amount)}</strong>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between text-danger">
                          <span>Số tiền hoàn dự kiến</span>
                          <strong>{formatCurrency(preview.refund_amount)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mb-4">
                      <div className="col-lg-12">
                        <div className="rounded-4 border p-4 h-100">
                          <h3 className="h6 mb-3">Quy trình xử lý</h3>
                          <div className="small d-grid gap-2">
                            <div>1. Khách gửi yêu cầu hủy từ trang My Bookings</div>
                            <div>2. Hệ thống tự tính phí hủy theo chính sách</div>
                            <div>3. Khách nhập thông tin nhận hoàn tiền</div>
                            <div>4. Kế toán duyệt và hoàn tiền theo đúng tỷ lệ</div>
                            <div>5. Hệ thống cập nhật trạng thái hoàn tiền</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Formik
                      enableReinitialize
                      initialValues={{
                        reason: '',
                        refund_to_bank_name: '',
                        refund_to_account_number: '',
                        refund_to_account_name: '',
                      }}
                      validationSchema={cancelSchema}
                      onSubmit={(values, helpers) => {
                        if ((preview?.refund_amount || 0) > 0) {
                          const missing = !values.refund_to_bank_name || !values.refund_to_account_number || !values.refund_to_account_name;
                          if (missing) {
                            toast.error('Vui lòng nhập đầy đủ ngân hàng, số tài khoản và chủ tài khoản để nhận hoàn tiền.');
                            return;
                          }
                        }

                        cancelMutation.mutate(
                          {
                            id: selectedBooking.id,
                            payload: values,
                          },
                          {
                            onSuccess: () => helpers.resetForm(),
                          }
                        );
                      }}
                    >
                      <Form noValidate>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Ngân hàng nhận hoàn</label>
                            <Field name="refund_to_bank_name" className="form-control" placeholder="VD: TPBank" />
                            <div className="mt-1 small text-danger">
                              <ErrorMessage name="refund_to_bank_name" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Số tài khoản nhận hoàn</label>
                            <Field name="refund_to_account_number" className="form-control" placeholder="0123456789" />
                            <div className="mt-1 small text-danger">
                              <ErrorMessage name="refund_to_account_number" />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Chủ tài khoản nhận hoàn</label>
                            <Field name="refund_to_account_name" className="form-control" placeholder="NGUYEN VAN A" />
                            <div className="mt-1 small text-danger">
                              <ErrorMessage name="refund_to_account_name" />
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label">Lý do hủy tour</label>
                            <Field as="textarea" rows="4" name="reason" className="form-control" />
                            <div className="mt-1 small text-danger">
                              <ErrorMessage name="reason" />
                            </div>
                          </div>
                        </div>

                        <div className="modal-footer px-0 pb-0 mt-4">
                          <button type="button" className="btn btn-light" onClick={() => setSelectedBooking(null)}>
                            Giữ booking
                          </button>
                          <button type="submit" className="btn btn-danger" disabled={cancelMutation.isPending}>
                            {cancelMutation.isPending ? 'Đang gửi...' : 'Xác nhận hủy tour'}
                          </button>
                        </div>
                      </Form>
                    </Formik>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" onClick={() => setSelectedBooking(null)} />
      </>,
      document.body
    )
    : null;

  return (
    <div className="container py-4 py-lg-5">
      <div className="mb-4 d-flex flex-column gap-3 flex-md-row justify-content-between align-items-md-center">
        <div>
          <h1 className="h3 mb-1">Lịch sử đặt tour</h1>
          <p className="mb-0 text-muted">Theo dõi booking, thanh toán, chứng từ và các yêu cầu hỗ trợ của bạn.</p>
        </div>
        <Link to="/tours" className="btn btn-outline-primary">
          Đặt thêm tour
        </Link>
      </div>

      <ul className="nav nav-pills mb-4 flex-wrap gap-2">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab}>
            <button type="button" className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab(tab)}>
              {tabLabels[tab]}
            </button>
          </li>
        ))}
      </ul>

      {isLoading && <div className="alert alert-light border">Đang tải đơn đặt tour...</div>}
      {isError && <div className="alert alert-warning">Không thể tải danh sách đơn đặt tour.</div>}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="rounded-4 border bg-white p-5 text-center shadow-sm">
          <h2 className="h4">Chưa có đơn trong mục này</h2>
          <p className="mb-0 text-muted">Các booking mới của bạn sẽ xuất hiện tại đây.</p>
        </div>
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div className="d-grid gap-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-4 border bg-white p-4 shadow-sm">
              <div className="row g-3 align-items-center">
                <div className="col-lg-5">
                  <h2 className="h5 mb-1">{booking.tour?.title || 'Booking tour'}</h2>
                  <div className="small text-muted mb-2">{booking.tour?.destination || '--'}</div>
                  <div className="small text-muted">Ngày đi: {formatDate(booking.departure_date)}</div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="small text-muted">Số khách</div>
                  <div>{booking.num_pax}</div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="small text-muted">Tổng tiền</div>
                  <div>{formatCurrency(booking.total_price)}</div>
                </div>
                  <div className="col-sm-4 col-lg-3">
                    <div className="d-flex flex-column gap-2 align-items-sm-start align-items-lg-end">
                      <span className={`badge ${statusBadgeClass(booking.status)}`}>{bookingStatusLabel(booking.status)}</span>
                      <span className={`badge ${bookingPaymentBadgeClass(booking)}`}>{bookingPaymentLabel(booking)}</span>
                    </div>
                  </div>
              </div>

              <div className="mt-3 d-flex flex-wrap gap-2">
                <Link to={`/my-bookings/${booking.id}`} className="btn btn-outline-primary btn-sm">
                  Xem chi tiết
                </Link>
                {bookingRemainingAmount(booking) > 0 && booking.status !== 'cancelled' && (
                  <Link to={`/payments/${booking.id}`} className="btn btn-primary btn-sm">
                    Thanh toán
                  </Link>
                )}
                {booking.status === 'pending' && !['partial', 'paid'].includes(booking.payment_status) && (
                  <Link to={`/my-bookings/${booking.id}/edit`} className="btn btn-outline-dark btn-sm">
                    Chỉnh sửa
                  </Link>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    Hủy tour
                  </button>
                )}
                {booking.status === 'completed' && booking.tour?.slug && (
                  <Link to={`/tours/${booking.tour.slug}#reviews`} className="btn btn-outline-success btn-sm">
                    Đánh giá chuyến đi
                  </Link>
                )}
                <Link to="/my-support" className="btn btn-outline-secondary btn-sm">
                  Cần hỗ trợ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelPolicyModal}
    </div>
  );
}
