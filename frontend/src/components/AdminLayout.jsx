import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel, getWorkspacePath } from '../utils/workspace';

function titleFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || 'dashboard';
  const labels = {
    dashboard: 'Tổng quan',
    users: 'Người dùng',
    tours: 'Tour',
    reviews: 'Đánh giá',
    bookings: 'Đơn đặt',
    logs: 'Nhật ký',
    create: 'Tạo tour',
    edit: 'Chỉnh sửa tour',
    assignments: 'Phân công',
    services: 'Dịch vụ',
    payments: 'Thanh toán',
    reports: 'Báo cáo',
    customers: 'Khách hàng',
    'create-booking': 'Tạo booking',
    'support-tickets': 'Ticket hỗ trợ',
    'custom-tours': 'Custom tour',
  };

  return labels[last] || last.replace('-', ' ');
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, user } = useAuth();
  const title = titleFromPath(location.pathname);
  const workspacePath = getWorkspacePath(role);
  const avatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a5c86&color=fff`;

  return (
    <div className="d-flex min-vh-100 bg-light tf-admin-shell">
      <Sidebar collapsed={collapsed} />

      <div className="flex-grow-1 min-w-0">
        <header className="tf-admin-header border-bottom px-3 px-md-4 py-3">
          <div className="tf-admin-header-body d-flex flex-column flex-xl-row justify-content-between gap-3">
            <div className="tf-admin-header-copy">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-1">
                  <li className="breadcrumb-item">
                    <Link to={workspacePath}>Khu vực làm việc</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {title}
                  </li>
                </ol>
              </nav>
              <h1 className="h4 mb-1">{title}</h1>
              <div className="small text-muted">{getRoleLabel(role)}</div>
            </div>

            <div className="tf-admin-header-side d-flex flex-column align-items-xl-end gap-2">
              <div className="tf-role-card tf-role-card-compact">
                <div className="tf-role-avatar">
                  <img src={avatar} alt={user?.name || 'Tài khoản'} />
                  <span className="tf-role-online" />
                </div>
                <div className="tf-role-copy">
                  <div className="tf-role-name">{user?.name || 'Tài khoản'}</div>
                  <div className="tf-role-meta">
                    <span>{getRoleLabel(role)}</span>
                    <span>•</span>
                    <span>Đang hoạt động</span>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-xl-end gap-2">
                <Link to="/" className="btn btn-outline-primary btn-sm">
                  Trang chính
                </Link>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCollapsed((value) => !value)}>
                  {collapsed ? 'Mở rộng' : 'Thu gọn'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
