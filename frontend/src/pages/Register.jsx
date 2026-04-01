import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const schema = Yup.object({
  name: Yup.string().required('Vui lòng nhập họ tên'),
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  phone: Yup.string().required('Vui lòng nhập số điện thoại'),
  password: Yup.string().min(8, 'Tối thiểu 8 ký tự').required('Vui lòng nhập mật khẩu'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

export default function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="row g-0 overflow-hidden rounded-4 bg-white shadow-sm">
            <div
              className="col-lg-5 d-none d-lg-flex p-5 text-white"
              style={{ background: 'linear-gradient(150deg, #0f5132, #1e7f54)' }}
            >
              <div className="align-self-end">
                <span className="badge bg-warning text-dark mb-3">Tài khoản mới</span>
                <h2 className="display-6 fw-semibold">Bắt đầu hành trình đặt tour</h2>
                <p className="mb-0 text-white-50">
                  Tạo tài khoản khách hàng để đặt tour, theo dõi đơn, lưu yêu thích và gửi hỗ trợ sau chuyến đi.
                </p>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card-body p-4 p-md-5">
                <h1 className="h3 mb-3">Đăng ký</h1>
                <p className="text-muted">Tạo tài khoản khách hàng để bắt đầu sử dụng đầy đủ các tính năng.</p>

                <Formik
                  initialValues={{
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    password_confirmation: '',
                  }}
                  validationSchema={schema}
                  onSubmit={async (values) => {
                    setSubmitting(true);
                    try {
                      await authAPI.register(values);
                      toast.success('Đăng ký thành công');
                      navigate('/login');
                    } catch (error) {
                      toast.error(error?.response?.data?.message || 'Đăng ký thất bại');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <Form noValidate>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Họ và tên</label>
                        <Field name="name" className="form-control" />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="name" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <Field name="email" type="email" className="form-control" />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="email" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Số điện thoại</label>
                        <Field name="phone" className="form-control" />
                        <div className="mt-1 small text-danger">
                          <ErrorMessage name="phone" />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Mật khẩu</label>
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

                    <button type="submit" className="btn btn-primary mt-4 w-100" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang tạo tài khoản...
                        </>
                      ) : (
                        'Đăng ký'
                      )}
                    </button>
                  </Form>
                </Formik>

                <div className="mt-4 d-flex flex-wrap gap-2 text-muted">
                  <span>Đã có tài khoản?</span>
                  <Link to="/login">Đăng nhập</Link>
                  <span>•</span>
                  <Link to="/forgot-password">Quên mật khẩu</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
