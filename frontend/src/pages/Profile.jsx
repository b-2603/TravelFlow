import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const schema = Yup.object({
  name: Yup.string().required('Vui lòng nhập họ tên'),
  phone: Yup.string().nullable(),
  address: Yup.string().nullable(),
  avatar: Yup.string().url('Ảnh đại diện phải là một đường dẫn hợp lệ').nullable(),
});

const passwordSchema = Yup.object({
  current_password: Yup.string().required('Vui lòng nhập mật khẩu hiện tại'),
  password: Yup.string().min(8, 'Tối thiểu 8 ký tự').required('Vui lòng nhập mật khẩu mới'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

export default function Profile() {
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState(null);
  const { updateCurrentUser } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await userAPI.profile()).data?.data ?? null,
  });

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return profile?.avatar || 'https://i.pravatar.cc/240';
  }, [avatarFile, profile?.avatar]);

  const updateMutation = useMutation({
    mutationFn: (payload) => userAPI.updateProfile(payload),
    onSuccess: (response) => {
      const nextUser = response?.data?.data ?? null;

      if (nextUser) {
        updateCurrentUser(nextUser);
      }

      toast.success('Cập nhật hồ sơ thành công');
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload) => userAPI.changePassword(payload),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu');
    },
  });

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light border">Đang tải hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <div className="text-center">
              <img
                src={avatarPreview}
                alt={profile?.name || 'Hồ sơ'}
                className="mb-3 rounded-circle object-fit-cover"
                width="120"
                height="120"
              />
              <h1 className="h4 mb-1">{profile?.name}</h1>
              <div className="text-muted mb-2">@{profile?.username}</div>
              <span className="badge bg-light text-dark">{profile?.role_name_vi || profile?.role}</span>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h4 mb-3">Cập nhật hồ sơ cá nhân</h2>

            <Formik
              enableReinitialize
              initialValues={{
                name: profile?.name || '',
                phone: profile?.phone || '',
                address: profile?.address || '',
                avatar: profile?.avatar || '',
              }}
              validationSchema={schema}
              onSubmit={(values) => {
                const formData = new FormData();
                formData.append('name', values.name);
                formData.append('phone', values.phone || '');
                formData.append('address', values.address || '');
                formData.append('avatar', values.avatar || '');

                if (avatarFile) {
                  formData.append('avatar_file', avatarFile);
                }

                updateMutation.mutate(formData);
              }}
            >
              <Form noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ và tên</label>
                    <Field name="name" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="name" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <Field name="phone" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="phone" />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Địa chỉ</label>
                    <Field name="address" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="address" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tải ảnh từ máy</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="form-control"
                      onChange={(e) => setAvatarFile(e.currentTarget.files?.[0] || null)}
                    />
                    <div className="form-text">Có thể chọn file từ máy, hoặc nhập URL ở ô bên cạnh.</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Hoặc dán URL ảnh</label>
                    <Field name="avatar" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="avatar" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mt-4" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </Form>
            </Formik>
          </div>

          <div className="mt-4 rounded-4 border bg-white p-4 shadow-sm">
            <h2 className="h4 mb-3">Đổi mật khẩu</h2>

            <Formik
              initialValues={{
                current_password: '',
                password: '',
                password_confirmation: '',
              }}
              validationSchema={passwordSchema}
              onSubmit={(values, helpers) => {
                passwordMutation.mutate(values, {
                  onSuccess: () => helpers.resetForm(),
                });
              }}
            >
              <Form noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <Field name="current_password" type="password" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="current_password" />
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
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <Field name="password_confirmation" type="password" className="form-control" />
                    <div className="mt-1 small text-danger">
                      <ErrorMessage name="password_confirmation" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-outline-primary mt-4" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
