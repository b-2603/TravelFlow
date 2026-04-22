import { FieldArray, Formik, Form, Field, ErrorMessage } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI, paymentAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import FormikDateInput from '../components/FormikDateInput';

const PAYMENT_METHOD_OPTIONS = [
  {
    label: 'MoMo',
    value: 'momo',
    description: 'Thanh toán nhanh bằng ví MoMo, phù hợp cho người dùng điện thoại.',
  },
  {
    label: 'VNPay',
    value: 'vnpay',
    description: 'Thanh toán qua app ngân hàng hoặc quet QR trên cổng VNPay.',
  },
];

const schema = Yup.object({
  note: Yup.string().max(1000),
  payment_method: Yup.string().required('Vui lòng chọn phương thức thanh toán'),
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

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const bookingState = location.state || {};
  const tour = bookingState.tour || null;
  const departureDate = bookingState.departureDate || '';
  const numPax = Number(bookingState.numPax || 1);
  const depositRate = 0.3;

  const initialPassengers = Array.from({ length: numPax }).map(() => ({
    name: '',
    dob: '',
    passport: '',
  }));

  const unitPrice = Number(tour?.price_per_person || 0);

  const createBooking = useMutation({
    mutationFn: async (values) => {
      const bookingResponse = await bookingAPI.create({
        tour_id: tour.id,
        departure_date: departureDate,
        num_pax: values.passengers.length,
        passengers: values.passengers,
        note: values.note,
      });

      const booking = bookingResponse.data?.data;
      const totalAmount = unitPrice * values.passengers.length;
      const paymentAmount = values.payment_scope === 'deposit'
        ? Math.round(totalAmount * depositRate)
        : totalAmount;

      await paymentAPI.create({
        booking_id: booking?.id,
        amount: paymentAmount,
        method: values.payment_method,
        payment_scope: values.payment_scope,
      });

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      if (booking?.id) {
        queryClient.invalidateQueries({ queryKey: ['booking-detail', booking.id] });
      }
      toast.success('Đặt tour thành công');
      navigate(`/my-bookings/${booking?.id || ''}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo đơn đặt tour');
    },
  });

  if (!tour || !departureDate) {
    return (
      <div className="container py-5">
        <div className="rounded-4 border bg-white p-5 text-center shadow-sm">
          <h1 className="h3 mb-3">Chưa chọn tour</h1>
          <p className="mb-4 text-muted">Hãy chọn tour và ngày khởi hành trước khi mở biểu mẫu đặt chỗ.</p>
          <Link to="/tours" className="btn btn-primary">
            Xem danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <Formik
        initialValues={{
          note: '',
          payment_method: 'momo',
          payment_scope: 'deposit',
          passengers: initialPassengers,
        }}
        enableReinitialize
        validationSchema={schema}
        onSubmit={(values) => createBooking.mutate(values)}
      >
        {({ values }) => {
          const totalAmount = unitPrice * values.passengers.length;
          const payableNow = values.payment_scope === 'deposit'
            ? Math.round(totalAmount * depositRate)
            : totalAmount;

          return (
            <Form className="row g-4">
              <div className="col-lg-8">
                <div className="mb-4 rounded-4 border bg-white p-4 shadow-sm">
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <h1 className="h3 mb-0">Biểu mẫu đặt tour</h1>
                    <span className="badge bg-light text-dark">{values.passengers.length} hành khách</span>
                  </div>

                  <FieldArray name="passengers">
                    {({ push, remove }) => (
                      <div className="d-grid gap-3">
                        {values.passengers.map((_, index) => (
                          <div className="rounded-3 border p-3" key={index}>
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                              <h2 className="h6 mb-0">Hành khách {index + 1}</h2>
                              {values.passengers.length > 1 && (
                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(index)}>
                                  Xóa
                                </button>
                              )}
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label">Họ và tên</label>
                                <Field name={`passengers.${index}.name`} className="form-control" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.name`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Ngày sinh</label>
                                <FormikDateInput name={`passengers.${index}.dob`} className="form-control" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.dob`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Hộ chiếu / CCCD</label>
                                <Field name={`passengers.${index}.passport`} className="form-control" />
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
                  <h2 className="h5 mb-3">Ghi chú và giấy tờ</h2>
                  <div className="mb-3">
                    <label className="form-label">Tải lên giấy tờ tùy thân</label>
                    <input type="file" className="form-control" />
                    <div className="mt-1 small text-muted">Hiện tại tệp chỉ được chọn ở giao diện, chưa lưu xuống hệ thống.</div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Ghi chú</label>
                    <Field as="textarea" rows="4" name="note" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="note" />
                    </div>
                  </div>
                </div>

                <div className="rounded-4 border bg-white p-4 shadow-sm">
                  <h2 className="h5 mb-3">Phương thức và hình thức thanh toán</h2>

                  <div className="mb-4">
                    <label className="form-label d-block">Phương thức thanh toán</label>
                    <div className="mb-2 small text-muted">Chọn cổng thanh toán online thông dụng để thao tác nhanh hơn.</div>
                    <div className="d-grid gap-2">
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <label key={method.value} className="rounded-3 border px-3 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <Field type="radio" name="payment_method" value={method.value} />
                            <span>{method.label}</span>
                          </div>
                          <div className="mt-1 small text-muted">{method.description}</div>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 small text-danger">
                      <ErrorMessage name="payment_method" />
                    </div>
                  </div>

                  <div>
                    <label className="form-label d-block">Hình thức thanh toán</label>
                    <div className="d-grid gap-2">
                      <label className="rounded-3 border px-3 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Field type="radio" name="payment_scope" value="deposit" />
                          <span>Đặt cọc 30%</span>
                        </div>
                        <div className="mt-1 small text-muted">Phù hợp khi bạn muốn giữ chỗ trước, phần còn lại thanh toán sau.</div>
                      </label>
                      <label className="rounded-3 border px-3 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Field type="radio" name="payment_scope" value="full" />
                          <span>Thanh toán toàn phần</span>
                        </div>
                        <div className="mt-1 small text-muted">Hoàn tất thanh toán ngay cho toàn bộ booking.</div>
                      </label>
                    </div>
                    <div className="mt-2 small text-danger">
                      <ErrorMessage name="payment_scope" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="sticky-top rounded-4 border bg-white p-4 shadow-sm tf-responsive-sticky" style={{ top: '96px' }}>
                  <h2 className="h5 mb-3">Tóm tắt đơn hàng</h2>
                  <div className="mb-3">
                    <div className="fw-semibold">{tour.title}</div>
                    <div className="small text-muted">{tour.destination}</div>
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
                    <span>Đơn giá</span>
                    <span>{formatCurrency(unitPrice)}</span>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Hình thức thanh toán</span>
                    <span>{values.payment_scope === 'deposit' ? 'Đặt cọc 30%' : 'Toàn phần'}</span>
                  </div>
                  <hr />
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Tổng cộng</span>
                    <strong>{formatCurrency(totalAmount)}</strong>
                  </div>
                  <div className="mb-3 d-flex justify-content-between text-primary">
                    <span>Thanh toán ngay</span>
                    <strong>{formatCurrency(payableNow)}</strong>
                  </div>
                  <div className="mb-3 rounded-3 bg-light p-3 small text-muted">
                    Chính sách hủy tự động:
                    <br />
                    - Trước 14 ngày: hoàn 100%
                    <br />
                    - Từ 7 đến 13 ngày: hoàn 50%
                    <br />
                    - Từ 3 đến 6 ngày: hoàn 20%
                    <br />
                    - Dưới 3 ngày: không hoàn
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={createBooking.isPending}>
                    {createBooking.isPending ? 'Đang gửi...' : 'Xác nhận đặt tour'}
                  </button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
