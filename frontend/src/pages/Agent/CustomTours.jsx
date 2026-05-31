import { Field, ErrorMessage, Form, Formik } from 'formik';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { agentAPI } from '../../services/api';
import FormikDateInput from '../../components/FormikDateInput';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useState } from 'react';

const schema = Yup.object({
  customer_id: Yup.string().required('Vui lòng chọn khách hàng'),
  title: Yup.string().required('Vui lòng nhập tên tour'),
  destination: Yup.string().required('Vui lòng nhập điểm đến'),
  duration: Yup.number().min(1).required('Vui lòng nhập số ngày'),
  estimated_price: Yup.number().min(0).required('Vui lòng nhập giá dự kiến'),
  num_pax: Yup.number().min(1).required('Vui lòng nhập số khách'),
});

export default function AgentCustomTours() {
  const [result, setResult] = useState(null);

  const { data: customersPayload } = useQuery({
    queryKey: ['agent-customers-for-custom-tour'],
    queryFn: async () => (await agentAPI.customers()).data?.data ?? {},
  });

  const customers = customersPayload?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload) => agentAPI.createCustomTour(payload),
    onSuccess: (response) => {
      toast.success('Đã tạo custom tour');
      setResult(response?.data?.data || null);
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể tạo custom tour'),
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="h4 mb-1">Custom tour</h2>
        <p className="mb-0 text-muted">Tạo tour theo yêu cầu riêng của khách, có thể kèm booking draft để chuyển cho tour manager / admin duyệt tiếp.</p>
      </div>

      <Formik
        initialValues={{
          customer_id: '',
          title: '',
          destination: '',
          duration: 3,
          estimated_price: 0,
          num_pax: 1,
          preferred_date: '',
          description: '',
          note: '',
          special_requests_text: '',
          special_requests: [''],
        }}
        validationSchema={schema}
        onSubmit={(values) =>
          createMutation.mutate({
            ...values,
            special_requests: values.special_requests_text
              ? values.special_requests_text.split(',').map((item) => item.trim()).filter(Boolean)
              : [],
          })
        }
      >
        {({ values }) => {
          const selectedCustomer = customers.find((item) => item.id === values.customer_id);

          return (
            <Form>
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
                      <label className="form-label">Tên tour</label>
                      <Field name="title" className="form-control" />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="title" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Điểm đến</label>
                      <Field name="destination" className="form-control" />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="destination" />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Số ngày</label>
                      <Field name="duration" type="number" className="form-control" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Số khách</label>
                      <Field name="num_pax" type="number" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Giá dự kiến</label>
                      <Field name="estimated_price" type="number" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ngày mong muốn</label>
                      <FormikDateInput name="preferred_date" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Mô tả yêu cầu</label>
                      <Field as="textarea" name="description" rows="4" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Ghi chú cho nhân sự</label>
                      <Field as="textarea" name="note" rows="3" className="form-control" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Yêu cầu đặc biệt</label>
                      <Field
                        name="special_requests_text"
                        className="form-control"
                        placeholder="Ăn chay, khách lớn tuổi, ưu tiên ít di chuyển..."
                      />
                      <div className="form-text">Nhập nhiều yêu cầu bằng dấu phẩy.</div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="sticky-top rounded-4 border bg-light p-4 tf-responsive-sticky" style={{ top: '96px' }}>
                    <h3 className="h5 mb-3">Tóm tắt</h3>
                    <div className="mb-2 small text-muted">Khách hàng</div>
                    <div className="mb-3">{selectedCustomer?.name || '--'}</div>
                    <div className="mb-2 small text-muted">Tour</div>
                    <div className="mb-3">{values.title || '--'}</div>
                    <div className="mb-2 small text-muted">Ngày mong muốn</div>
                    <div className="mb-3">{formatDate(values.preferred_date)}</div>
                    <div className="mb-2 small text-muted">Giá dự kiến</div>
                    <div className="mb-4 fw-semibold text-primary">{formatCurrency(values.estimated_price * values.num_pax || 0)}</div>
                    <button type="submit" className="btn btn-primary w-100" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Đang tạo...' : 'Tạo custom tour'}
                    </button>
                  </div>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>

      {result && (
        <div className="mt-4 rounded-4 border p-4 bg-light-subtle">
          <h3 className="h6 mb-3">Kết quả tạo gần nhất</h3>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="rounded-3 border bg-white p-3">
                <div className="small text-muted">Tour</div>
                <div className="fw-semibold">{result.tour?.title || '--'}</div>
                <div className="small text-muted">{result.tour?.destination || '--'}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="rounded-3 border bg-white p-3">
                <div className="small text-muted">Booking draft</div>
                <div className="fw-semibold">{result.booking ? 'Đã tạo booking draft' : 'Chưa tạo booking'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
