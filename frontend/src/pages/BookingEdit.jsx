import { FieldArray, Formik, Form, Field, ErrorMessage } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI, paymentAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import FormikDateInput from '../components/FormikDateInput';

const depositRate = 0.3;

const schema = Yup.object({
  note: Yup.string().max(1000),
  payment_scope: Yup.string().required('Vui lòng chọn hình thức thanh toán'),
  passengers: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().required('Vui lòng nhập họ tên'),
        dob: Yup.string().required('Vui lòng nhập ngày sinh'),
        passport: Yup.string().required('Vui lòng nhập CCCD hoặc hộ chiếu'),
      })
    )
    .min(1),
});

function newestPendingPaymentScope(payments) {
  const pending = (payments || [])
    .filter((item) => item.status === 'pending')
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return pending[0]?.payment_scope || null;
}

export default function BookingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: async () => {
      const response = await bookingAPI.detail(id);
      return response.data?.data ?? null;
    },
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      const updateResponse = await bookingAPI.update(id, {
        passengers: values.passengers,
        note: values.note,
      });

      const updatedBooking = updateResponse.data?.data;

      // Create a new pending payment for QR transfer (amount auto-calculated by backend).
      await paymentAPI.create({
        booking_id: updatedBooking?.id,
        method: 'bank',
        payment_scope: values.payment_scope,
      });

      return updatedBooking;
    },
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      if (updatedBooking?.id) {
        queryClient.invalidateQueries({ queryKey: ['booking-detail', updatedBooking.id] });
      }
      toast.success('Đã cập nhật booking');
      navigate(`/payments/${updatedBooking?.id || id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật booking');
    },
  });

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light border">Đang tải booking...</div>
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

  const tour = booking.tour || null;
  const departureDate = booking.departure_date || '';
  const initialPaymentScope = newestPendingPaymentScope(booking.payments) || 'deposit';

  return (
    <div className="container py-4 py-lg-5">
      <Formik
        initialValues={{
          note: booking.note || '',
          payment_scope: initialPaymentScope,
          passengers: booking.passengers?.length ? booking.passengers : [{ name: '', dob: '', passport: '' }],
        }}
        enableReinitialize
        validationSchema={schema}
        onSubmit={(values) => updateMutation.mutate(values)}
      >
        {({ values }) => {
          const unitPrice = Number(booking.total_price || 0) / Math.max(values.passengers.length, 1);
          const totalAmount = unitPrice * values.passengers.length;
          const payableNow = values.payment_scope === 'deposit'
            ? Math.round(totalAmount * depositRate)
            : Math.round(totalAmount);

          return (
            <Form className="row g-4">
              <div className="col-lg-8">
                <div className="mb-4 rounded-4 border bg-white p-4 shadow-sm">
                  <div className="mb-3 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <div>
                      <div className="small text-uppercase text-primary fw-semibold">Chỉnh sửa</div>
                      <h1 className="h3 mb-0">Thông tin đặt tour</h1>
                    </div>
                    <span className="badge bg-light text-dark">{values.passengers.length} hành khách</span>
                  </div>

                  <div className="rounded-4 border p-3 mb-3">
                    <div className="fw-semibold">{tour?.title || 'Tour'}</div>
                    <div className="small text-muted">{tour?.destination || '--'}</div>
                    <div className="small text-muted">Ngày đi: {formatDate(departureDate)}</div>
                  </div>

                  <FieldArray name="passengers">
                    {({ push, remove }) => (
                      <div className="d-grid gap-3">
                        {values.passengers.map((passenger, index) => (
                          <div key={index} className="rounded-4 border p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="fw-semibold">Hành khách {index + 1}</div>
                              {values.passengers.length > 1 ? (
                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(index)}>
                                  Xóa
                                </button>
                              ) : null}
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label">Họ và tên</label>
                                <Field name={`passengers.${index}.name`} className="form-control" placeholder="Nguyễn Văn A" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.name`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Ngày sinh</label>
                                <FormikDateInput name={`passengers.${index}.dob`} className="form-control" placeholder="dd/mm/yyyy" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.dob`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Hộ chiếu / CCCD</label>
                                <Field name={`passengers.${index}.passport`} className="form-control" placeholder="0123456789" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.passport`} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => push({ name: '', dob: '', passport: '' })}
                        >
                          Thêm hành khách
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div className="mb-4 rounded-4 border bg-white p-4 shadow-sm">
                  <h2 className="h5 mb-3">Ghi chú</h2>
                  <Field as="textarea" rows="4" name="note" className="form-control" />
                  <div className="mt-1 small text-danger">
                    <ErrorMessage name="note" />
                  </div>
                </div>

                <div className="rounded-4 border bg-white p-4 shadow-sm">
                  <h2 className="h5 mb-3">Hình thức thanh toán</h2>
                  <div className="d-grid gap-2">
                    <label className="rounded-3 border px-3 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Field type="radio" name="payment_scope" value="deposit" />
                        <span>Đặt cọc 30%</span>
                      </div>
                      <div className="mt-1 small text-muted">Bạn sẽ chuyển khoản trước một phần, phần còn lại thanh toán sau.</div>
                    </label>
                    <label className="rounded-3 border px-3 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Field type="radio" name="payment_scope" value="full" />
                        <span>Thanh toán toàn phần</span>
                      </div>
                      <div className="mt-1 small text-muted">Chuyển khoản toàn bộ số tiền của booking ngay bây giờ.</div>
                    </label>
                  </div>
                  <div className="mt-2 small text-danger">
                    <ErrorMessage name="payment_scope" />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="sticky-top rounded-4 border bg-white p-4 shadow-sm tf-responsive-sticky" style={{ top: '96px' }}>
                  <h2 className="h5 mb-3">Tóm tắt chỉnh sửa</h2>
                  <div className="mb-3">
                    <div className="fw-semibold">{tour?.title || '--'}</div>
                    <div className="small text-muted">{tour?.destination || '--'}</div>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Ngày đi</span>
                    <span>{formatDate(departureDate)}</span>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Số khách</span>
                    <span>{values.passengers.length}</span>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Tổng tiền</span>
                    <span className="fw-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="mb-3 d-flex justify-content-between">
                    <span>Thanh toán ngay</span>
                    <span className="fw-semibold text-danger">{formatCurrency(payableNow)}</span>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Đang lưu...' : 'Lưu và tạo QR thanh toán'}
                    </button>
                    <Link to={`/my-bookings/${booking.id}`} className="btn btn-light">
                      Quay lại chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

