import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { getWorkspacePath } from '../utils/workspace';

const schema = Yup.object({
  email: Yup.string().required('Vui lòng nhập email hoặc tên đăng nhập'),
  password: Yup.string().required('Vui lòng nhập mật khẩu'),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center">
        <div className="col-lg-10">
          <div className="row g-0 overflow-hidden rounded-4 bg-white shadow-sm">
            <div
              className="col-lg-5 d-none d-lg-flex p-5 text-white"
              style={{ background: 'linear-gradient(140deg, #0b3c5d, #1b6a8f)' }}
            >
              <div className="align-self-end">
                <span className="badge bg-warning text-dark mb-3">Truy cập an toàn</span>
                <h2 className="display-6 fw-semibold">Cổng đăng nhập cho khách hàng và nhân sự</h2>
                <p className="mb-0 text-white-50">
                  Hệ thống sẽ tự chuyển đúng khu vực làm việc theo vai trò của bạn sau khi đăng nhập.
                </p>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card-body p-4 p-md-5">
                <h1 className="h3 mb-3">Đăng nhập</h1>
                <p className="text-muted">
                  Bạn có thể đăng nhập bằng email hoặc tên đăng nhập được cấp trong hệ thống.
                </p>

                <Formik
                  initialValues={{ email: '', password: '', remember: true }}
                  validationSchema={schema}
                  onSubmit={async (values) => {
                    setSubmitting(true);
                    try {
                      const result = await login(values.email, values.password);
                      const role = result?.user?.role ?? 'customer';
                      toast.success('Đăng nhập thành công');
                      navigate(location.state?.from?.pathname || getWorkspacePath(role), { replace: true });
                    } catch (error) {
                      toast.error(error?.response?.data?.message || 'Đăng nhập thất bại');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <Form noValidate>
                    <div className="mb-3">
                      <label className="form-label">Email hoặc tên đăng nhập</label>
                      <Field
                        name="email"
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: quan_tri hoặc quantri@travel.local"
                      />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="email" />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Mật khẩu</label>
                      <Field name="password" type="password" className="form-control" />
                      <div className="mt-1 small text-danger">
                        <ErrorMessage name="password" />
                      </div>
                    </div>

                    <div className="form-check mb-4">
                      <Field name="remember" type="checkbox" className="form-check-input" id="remember" />
                      <label className="form-check-label" htmlFor="remember">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang đăng nhập...
                        </>
                      ) : (
                        'Đăng nhập'
                      )}
                    </button>
                  </Form>
                </Formik>

                <p className="mb-0 mt-4 text-muted">
                  Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
                <p className="mb-0 mt-2 text-muted">
                  Quên mật khẩu? <Link to="/forgot-password">Đặt lại tại đây</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
