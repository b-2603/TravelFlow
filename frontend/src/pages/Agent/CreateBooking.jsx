import { FieldArray, Formik, Form, Field, ErrorMessage } from 'formik';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { agentAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import FormikDateInput from '../../components/FormikDateInput';

const schema = Yup.object({
  customer_id: Yup.string().required('Vui lòng chọn khách hàng'),
  tour_id: Yup.string().required('Vui lòng chọn tour'),
  departure_date: Yup.string().required('Vui lòng chọn ngày khởi hành'),
  internal_note: Yup.string().nullable(),
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

export default function AgentCreateBooking() {
  const location = useLocation();
  const preselectedCustomerId = location.state?.customerId || '';

  const { data: customersPayload } = useQuery({
    queryKey: ['agent-customers-for-create'],
    queryFn: async () => (await agentAPI.customers()).data?.data ?? {},
  });

  const { data: toursPayload } = useQuery({
    queryKey: ['agent-tours-for-create'],
    queryFn: async () => (await agentAPI.tours()).data?.data ?? {},
  });

  const customers = customersPayload?.items || [];
  const tours = toursPayload?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload) => agentAPI.createBooking(payload),
    onSuccess: () => {
      toast.success('Đã tạo booking thay khách thành công');
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể tạo booking'),
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <h2 className="h4 mb-3">Tạo booking thay khách</h2>
      <p className="text-muted">Dùng khi khách đặt qua điện thoại, tại quầy hoặc cần nhân viên nhập hộ thông tin đoàn.</p>

      <Formik
        initialValues={{
          customer_id: preselectedCustomerId,
          tour_id: '',
          departure_date: '',
          note: '',
          internal_note: '',
          special_requirements: '',
          passengers: [{ name: '', dob: '', passport: '' }],
        }}
        validationSchema={schema}
        onSubmit={(values) => {
          const selectedTour = tours.find((item) => item.id === values.tour_id);
          createMutation.mutate({
            ...values,
            num_pax: values.passengers.length,
            special_requirements: values.special_requirements
              ? values.special_requirements.split(',').map((item) => item.trim()).filter(Boolean)
              : [],
            departure_date: values.departure_date || selectedTour?.departures?.[0]?.date,
          });
        }}
      >
        {({ values, setFieldValue }) => {
          const selectedTour = tours.find((item) => item.id === values.tour_id);
          const selectedCustomer = customers.find((item) => item.id === values.customer_id);

          return (
            <Form noValidate>
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Khách hàng</label>
                      <Field as="select" name="customer_id" className="form-select">
                        <option value="">Chọn khách hàng</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone || customer.email}
                          </option>
                        ))}
                      </Field>
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="customer_id" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Tour</label>
                      <Field
                        as="select"
                        name="tour_id"
                        className="form-select"
                        onChange={(e) => {
                          const value = e.target.value;
                          setFieldValue('tour_id', value);
                          const chosenTour = tours.find((item) => item.id === value);
                          setFieldValue('departure_date', chosenTour?.departures?.[0]?.date || '');
                        }}
                      >
                        <option value="">Chọn tour</option>
                        {tours.map((tour) => (
                          <option key={tour.id} value={tour.id}>
                            {tour.title}
                          </option>
                        ))}
                      </Field>
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="tour_id" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Ngày khởi hành</label>
                      <Field as="select" name="departure_date" className="form-select">
                        <option value="">Chọn ngày khởi hành</option>
                        {(selectedTour?.departures || []).map((departure) => (
                          <option key={departure.date} value={departure.date}>
                            {formatDate(departure.date)} - {departure.available_slots} chỗ
                          </option>
                        ))}
                      </Field>
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="departure_date" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Ghi chú nội bộ</label>
                      <Field name="internal_note" className="form-control" />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Ghi chú cho booking</label>
                      <Field as="textarea" rows="3" name="note" className="form-control" />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Yêu cầu đặc biệt</label>
                      <Field name="special_requirements" className="form-control" placeholder="Ăn chay, ghế gần cửa sổ, hỗ trợ trẻ nhỏ..." />
                      <div className="mt-1 small text-muted">Nhập nhiều yêu cầu bằng dấu phẩy.</div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <FieldArray name="passengers">
                    {({ push, remove }) => (
                      <div className="d-grid gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h3 className="h5 mb-0">Danh sách hành khách</h3>
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => push({ name: '', dob: '', passport: '' })}>
                            Thêm hành khách
                          </button>
                        </div>

                        {values.passengers.map((_, index) => (
                          <div key={index} className="rounded-3 border p-3">
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                              <strong>Hành khách {index + 1}</strong>
                              {values.passengers.length > 1 && (
                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(index)}>
                                  Xóa
                                </button>
                              )}
                            </div>
                            <div className="row g-3">
                              <div className="col-md-4">
                                <Field name={`passengers.${index}.name`} className="form-control" placeholder="Họ tên" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.name`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <FormikDateInput name={`passengers.${index}.dob`} className="form-control" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.dob`} />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <Field name={`passengers.${index}.passport`} className="form-control" placeholder="CCCD / Hộ chiếu" />
                                <div className="mt-1 small text-danger">
                                  <ErrorMessage name={`passengers.${index}.passport`} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div className="col-lg-4">
                  <div className="sticky-top rounded-4 border bg-light p-4 tf-responsive-sticky" style={{ top: '96px' }}>
                    <h3 className="h5 mb-3">Tóm tắt</h3>
                    <div className="mb-2 small text-muted">Khách hàng</div>
                    <div className="mb-3">{selectedCustomer?.name || '--'}</div>
                    <div className="mb-2 small text-muted">Tour</div>
                    <div className="mb-3">{selectedTour?.title || '--'}</div>
                    <div className="mb-2 small text-muted">Tổng tiền dự kiến</div>
                    <div className="mb-4 fw-semibold text-primary">
                      {formatCurrency((selectedTour?.price_per_person || 0) * values.passengers.length)}
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Đang tạo...' : 'Tạo booking'}
                    </button>
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
