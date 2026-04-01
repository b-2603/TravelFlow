import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const schema = Yup.object({
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  token: Yup.string().required('Vui lòng nhập mã đặt lại mật khẩu'),
  password: Yup.string().min(8, 'Tối thiểu 8 ký tự').required('Vui lòng nhập mật khẩu mới'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="rounded-4 border bg-white p-4 p-md-5 shadow-sm">
            <h1 className="h3 mb-3">Đặt lại mật khẩu</h1>
            <p className="text-muted">Nhập email, mã đặt lại mật khẩu và mật khẩu mới để kích hoạt lại tài khoản.</p>

            <Formik
              initialValues={{
                email: params.get('email') || '',
                token: params.get('token') || '',
                password: '',
                password_confirmation: '',
              }}
              validationSchema={schema}
              onSubmit={async (values) => {
                try {
                  const response = await authAPI.resetPassword(values);
                  toast.success(response.data?.message || 'Đặt lại mật khẩu thành công');
                  navigate('/login');
                } catch (error) {
                  toast.error(error?.response?.data?.message || 'Không thể đặt lại mật khẩu');
                }
              }}
            >
              <Form noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <Field name="email" type="email" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="email" />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Mã đặt lại mật khẩu</label>
                    <Field name="token" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="token" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Mật khẩu mới</label>
                    <Field name="password" type="password" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="password" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Xác nhận mật khẩu</label>
                    <Field name="password_confirmation" type="password" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="password_confirmation" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mt-4">
                  Lưu mật khẩu mới
                </button>
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
