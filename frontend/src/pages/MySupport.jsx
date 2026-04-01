import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI, customerAPI } from '../services/api';
import { formatCurrency, formatDate, refundStatusLabel, statusBadgeClass, supportStatusLabel } from '../utils/formatters';

const supportSchema = Yup.object({
  booking_id: Yup.string().nullable(),
  subject: Yup.string().required('Vui lòng nhập chủ đề'),
  message: Yup.string().min(10, 'Vui lòng nhập tối thiểu 10 ký tự').required('Vui lòng nhập nội dung'),
});

export default function MySupport() {
  const queryClient = useQueryClient();

  const { data: supports = [], isLoading: loadingSupports } = useQuery({
    queryKey: ['customer-supports'],
    queryFn: async () => (await customerAPI.supports()).data?.data ?? [],
  });

  const { data: refunds = [], isLoading: loadingRefunds } = useQuery({
    queryKey: ['customer-refunds'],
    queryFn: async () => (await customerAPI.refundRequests()).data?.data ?? [],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['customer-bookings-for-support'],
    queryFn: async () => (await bookingAPI.list()).data?.data ?? [],
  });

  const supportMutation = useMutation({
    mutationFn: (payload) => customerAPI.createSupport(payload),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu hỗ trợ');
      queryClient.invalidateQueries({ queryKey: ['customer-supports'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ'),
  });

  return (
    <div className="container py-4 py-lg-5">
      <div className="mb-4">
        <h1 className="h3 mb-1">Hỗ trợ và khiếu nại</h1>
        <p className="mb-0 text-muted">Theo dõi yêu cầu hỗ trợ và các đề nghị hoàn tiền đã gửi.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h5 mb-3">Gửi yêu cầu hỗ trợ mới</h2>
            <Formik
              initialValues={{ booking_id: '', subject: '', message: '' }}
              validationSchema={supportSchema}
              onSubmit={(values, helpers) => {
                supportMutation.mutate(values, {
                  onSuccess: () => helpers.resetForm(),
                });
              }}
            >
              <Form noValidate>
                <div className="mb-3">
                  <label className="form-label">Booking liên quan</label>
                  <Field as="select" name="booking_id" className="form-select">
                    <option value="">Không gắn booking cụ thể</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.tour?.title} - {formatDate(booking.departure_date)}
                      </option>
                    ))}
                  </Field>
                </div>

                <div className="mb-3">
                  <label className="form-label">Chủ đề</label>
                  <Field name="subject" className="form-control" />
                  <div className="mt-1 small text-danger">
                    <ErrorMessage name="subject" />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Nội dung</label>
                  <Field as="textarea" rows="5" name="message" className="form-control" />
                  <div className="mt-1 small text-danger">
                    <ErrorMessage name="message" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={supportMutation.isPending}>
                  {supportMutation.isPending ? 'Đang gửi...' : 'Gửi hỗ trợ'}
                </button>
              </Form>
            </Formik>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="rounded-4 border bg-white p-4 shadow-sm mb-4">
            <h2 className="h5 mb-3">Yêu cầu hỗ trợ đã gửi</h2>
            {loadingSupports ? (
              <div className="alert alert-light border mb-0">Đang tải yêu cầu hỗ trợ...</div>
            ) : supports.length === 0 ? (
              <div className="text-muted">Bạn chưa gửi yêu cầu hỗ trợ nào.</div>
            ) : (
              <div className="d-grid gap-3">
                {supports.map((ticket) => (
                  <div key={ticket.id} className="rounded-3 border p-3">
                    <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                      <strong>{ticket.subject}</strong>
                      <span className={`badge ${statusBadgeClass(ticket.status)}`}>{supportStatusLabel(ticket.status)}</span>
                    </div>
                    <p className="mb-2">{ticket.message}</p>
                    {ticket.booking?.tour?.title && (
                      <div className="small text-muted mb-2">
                        Booking liên quan: {ticket.booking.tour.title}
                      </div>
                    )}
                    {ticket.handler?.name && (
                      <div className="small text-muted mb-2">
                        Người xử lý: {ticket.handler.name}
                        {ticket.handler.role_name_vi ? ` (${ticket.handler.role_name_vi})` : ''}
                        {ticket.handled_at ? ` • ${formatDate(ticket.handled_at)}` : ''}
                      </div>
                    )}
                    {ticket.reply && (
                      <div className="rounded-3 bg-light p-3 small">
                        <div className="fw-semibold mb-1">Phản hồi</div>
                        {ticket.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h5 mb-3">Yêu cầu hoàn tiền</h2>
            {loadingRefunds ? (
              <div className="alert alert-light border mb-0">Đang tải yêu cầu hoàn tiền...</div>
            ) : refunds.length === 0 ? (
              <div className="text-muted">Bạn chưa có yêu cầu hoàn tiền nào.</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Tour</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id}>
                        <td>{refund.booking?.tour?.title || 'Booking'}</td>
                        <td>{formatCurrency(refund.amount_requested)}</td>
                        <td>
                          <span className={`badge ${statusBadgeClass(refund.status)}`}>{refundStatusLabel(refund.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
