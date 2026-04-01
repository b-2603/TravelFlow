import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

const roles = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'tour_manager', label: 'Quản lý tour' },
  { value: 'agent', label: 'Nhân viên tư vấn' },
  { value: 'accountant', label: 'Kế toán / Tài chính' },
  { value: 'guide', label: 'Hướng dẫn viên' },
  { value: 'partner', label: 'Đối tác dịch vụ' },
  { value: 'customer', label: 'Khách hàng' },
];

const staffRoles = roles.filter((item) => ['admin', 'tour_manager', 'agent', 'accountant', 'guide'].includes(item.value));

function roleLabel(role, roleNameVi) {
  return roleNameVi || roles.find((item) => item.value === role)?.label || role;
}

function statusClass(status) {
  if (status === 'active') return 'bg-success';
  if (status === 'locked') return 'bg-danger';
  return 'bg-secondary';
}

function statusLabel(status) {
  if (status === 'active') return 'Hoạt động';
  if (status === 'locked') return 'Đã khóa';
  return status || '--';
}

const emptyStaffForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  avatar: '',
  role: 'agent',
};

const emptyResetForm = {
  password: '',
  password_confirmation: '',
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffAvatarFile, setStaffAvatarFile] = useState(null);
  const [resetForm, setResetForm] = useState(emptyResetForm);

  const { data: payload, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => (await adminAPI.users(filters)).data?.data ?? {},
  });

  const { data: detailPayload, isFetching: detailLoading } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: async () => (await adminAPI.userDetail(selectedUserId)).data?.data ?? {},
    enabled: Boolean(selectedUserId),
  });

  const users = payload?.items || [];
  const detailUser = detailPayload?.user;
  const recentLogs = detailPayload?.recent_logs || [];
  const userStats = detailPayload?.stats || {};

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật người dùng.');
      setEditingUser(null);
      refreshUsers();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật người dùng.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => (nextStatus === 'locked' ? adminAPI.lockUser(id) : adminAPI.unlockUser(id)),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài khoản.');
      refreshUsers();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.');
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: (payload) => adminAPI.createStaff(payload),
    onSuccess: () => {
      toast.success('Đã tạo tài khoản nhân sự.');
      setStaffForm(emptyStaffForm);
      setStaffAvatarFile(null);
      refreshUsers();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể tạo tài khoản nhân sự.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, payload }) => adminAPI.resetPassword(id, payload),
    onSuccess: () => {
      toast.success('Đã đặt lại mật khẩu.');
      setResetForm(emptyResetForm);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu.');
    },
  });

  return (
    <div className="rounded-4 border bg-white p-4 shadow-sm">
      <div className="mb-4 d-flex flex-column gap-3 flex-lg-row justify-content-between">
        <div>
          <h2 className="h4 mb-1">Quản lý người dùng và phân quyền</h2>
          <p className="mb-0 text-muted">
            Lọc tài khoản, cập nhật vai trò, khóa mở tài khoản, tạo nhân sự nội bộ và đặt lại mật khẩu.
          </p>
        </div>
        <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createStaffModal">
          Tạo nhân sự
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <select className="form-select" value={filters.role} onChange={(e) => setFilters((v) => ({ ...v, role: e.target.value }))}>
            <option value="">Tất cả vai trò</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filters.status} onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Tìm theo tên, tên đăng nhập hoặc email"
            value={filters.search}
            onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value }))}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Liên hệ</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-muted">
                  Chưa có người dùng phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={user.avatar || 'https://i.pravatar.cc/60'}
                        alt={user.name}
                        width="44"
                        height="44"
                        className="rounded-circle object-fit-cover"
                      />
                      <div>
                        <div className="fw-semibold">{user.name}</div>
                        <div className="small text-muted">@{user.username || 'chua_dat'}</div>
                        <div className="small text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark">{roleLabel(user.role, user.role_name_vi)}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusClass(user.status)}`}>{statusLabel(user.status)}</span>
                  </td>
                  <td className="small">
                    <div>{user.phone || '--'}</div>
                    <div className="text-muted">{user.address || '--'}</div>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#userDetailModal"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#editUserModal"
                        onClick={() => setEditingUser(user)}
                      >
                        Đổi vai trò
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${user.status === 'locked' ? 'btn-outline-success' : 'btn-outline-danger'}`}
                        onClick={() => statusMutation.mutate({ id: user.id, nextStatus: user.status === 'locked' ? 'active' : 'locked' })}
                      >
                        {user.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="modal fade" id="editUserModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Cập nhật tài khoản</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Người dùng</label>
                <div className="rounded-3 bg-light p-3">
                  <div className="fw-semibold">{editingUser?.name || 'Chưa chọn'}</div>
                  <div className="small text-muted">@{editingUser?.username || 'chua_dat'}</div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Vai trò</label>
                <select
                  className="form-select"
                  value={editingUser?.role || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, role: e.target.value }))}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Địa chỉ</label>
                <input
                  className="form-control"
                  value={editingUser?.address || ''}
                  onChange={(e) => setEditingUser((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!editingUser}
                onClick={() => editingUser && updateMutation.mutate({ id: editingUser.id, data: { role: editingUser.role, address: editingUser.address } })}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="createStaffModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Tạo tài khoản nhân sự</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Họ tên</label>
                  <input className="form-control" value={staffForm.name} onChange={(e) => setStaffForm((v) => ({ ...v, name: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tên đăng nhập</label>
                  <input className="form-control" value={staffForm.username} onChange={(e) => setStaffForm((v) => ({ ...v, username: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={staffForm.email} onChange={(e) => setStaffForm((v) => ({ ...v, email: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vai trò</label>
                  <select className="form-select" value={staffForm.role} onChange={(e) => setStaffForm((v) => ({ ...v, role: e.target.value }))}>
                    {staffRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mật khẩu khởi tạo</label>
                  <input className="form-control" type="password" value={staffForm.password} onChange={(e) => setStaffForm((v) => ({ ...v, password: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-control" value={staffForm.phone} onChange={(e) => setStaffForm((v) => ({ ...v, phone: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tải avatar từ máy</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setStaffAvatarFile(e.currentTarget.files?.[0] || null)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Địa chỉ</label>
                  <input className="form-control" value={staffForm.address} onChange={(e) => setStaffForm((v) => ({ ...v, address: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Hoặc dán URL avatar</label>
                  <input className="form-control" value={staffForm.avatar} onChange={(e) => setStaffForm((v) => ({ ...v, avatar: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                disabled={!staffForm.name || !staffForm.username || !staffForm.email || !staffForm.password}
                onClick={() => {
                  const payload = new FormData();
                  Object.entries(staffForm).forEach(([key, value]) => payload.append(key, value ?? ''));
                  if (staffAvatarFile) payload.append('avatar_file', staffAvatarFile);
                  createStaffMutation.mutate(payload);
                }}
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="userDetailModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title fs-5">Chi tiết người dùng</h3>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {detailLoading || !detailUser ? (
                <div className="text-muted">Đang tải chi tiết người dùng...</div>
              ) : (
                <div className="d-grid gap-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="rounded-4 border bg-light-subtle p-3">
                        <div className="small text-muted mb-2">Booking</div>
                        <div className="fs-5 fw-semibold">{userStats.bookings_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="rounded-4 border bg-light-subtle p-3">
                        <div className="small text-muted mb-2">Thanh toán</div>
                        <div className="fs-5 fw-semibold">{userStats.payments_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="rounded-4 border bg-light-subtle p-3">
                        <div className="small text-muted mb-2">Đánh giá</div>
                        <div className="fs-5 fw-semibold">{userStats.reviews_count ?? 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Thông tin cơ bản</h4>
                    <div className="row g-2 small">
                      <div className="col-md-6">Họ tên: <strong>{detailUser.name}</strong></div>
                      <div className="col-md-6">Vai trò: <strong>{roleLabel(detailUser.role, detailUser.role_name_vi)}</strong></div>
                      <div className="col-md-6">Tên đăng nhập: <strong>@{detailUser.username || 'chua_dat'}</strong></div>
                      <div className="col-md-6">Email: <strong>{detailUser.email}</strong></div>
                      <div className="col-md-6">Điện thoại: <strong>{detailUser.phone || '--'}</strong></div>
                      <div className="col-md-6">Địa chỉ: <strong>{detailUser.address || '--'}</strong></div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Đặt lại mật khẩu</h4>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Mật khẩu mới</label>
                        <input
                          type="password"
                          className="form-control"
                          value={resetForm.password}
                          onChange={(e) => setResetForm((v) => ({ ...v, password: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Xác nhận mật khẩu</label>
                        <input
                          type="password"
                          className="form-control"
                          value={resetForm.password_confirmation}
                          onChange={(e) => setResetForm((v) => ({ ...v, password_confirmation: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          disabled={!selectedUserId || !resetForm.password || resetForm.password !== resetForm.password_confirmation}
                          onClick={() => resetPasswordMutation.mutate({ id: selectedUserId, payload: resetForm })}
                        >
                          Đặt lại mật khẩu
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border p-3">
                    <h4 className="h6 mb-3">Lịch sử hoạt động gần đây</h4>
                    {recentLogs.length ? (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Thời gian</th>
                              <th>Hành động</th>
                              <th>Phân hệ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentLogs.map((log) => (
                              <tr key={log.id}>
                                <td>{formatDate(log.created_at)}</td>
                                <td>{log.action}</td>
                                <td>{log.module}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted">Chưa có log hoạt động gần đây.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
