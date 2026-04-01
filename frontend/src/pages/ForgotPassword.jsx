import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const schema = Yup.object({
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
});

export default function ForgotPassword() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 p-md-5 shadow-sm">
            <h1 className="h3 mb-3">Quên mật khẩu</h1>
            <p className="text-muted">
              Nhập email đã đăng ký. Hệ thống sẽ tạo yêu cầu đặt lại mật khẩu và trả thông báo xác nhận.
            </p>

            <Formik
              initialValues={{ email: '' }}
              validationSchema={schema}
              onSubmit={async (values, helpers) => {
                try {
                  const response = await authAPI.forgotPassword(values);
                  toast.success(response.data?.message || 'Đã ghi nhận yêu cầu đặt lại mật khẩu');
                  helpers.resetForm();
                } catch (error) {
                  toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu');
                }
              }}
            >
              <Form noValidate>
                <label className="form-label">Email</label>
                <Field name="email" type="email" className="form-control" />
                <div className="mt-1 small text-danger">
                  <ErrorMessage name="email" />
                </div>

                <button type="submit" className="btn btn-primary mt-4">
                  Gửi yêu cầu
                </button>
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
