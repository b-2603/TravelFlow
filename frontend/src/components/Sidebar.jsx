import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const menuItems = [
  { label: 'Tổng quan', to: '/admin/dashboard', roles: ['admin'] },
  { label: 'Người dùng', to: '/admin/users', roles: ['admin'] },
  { label: 'Duyệt tour', to: '/admin/tours', roles: ['admin'] },
  { label: 'Điều phối HDV', to: '/admin/guide-assignments', roles: ['admin'] },
  { label: 'Đơn đặt', to: '/admin/bookings', roles: ['admin'] },
  { label: 'Nhật ký', to: '/admin/logs', roles: ['admin'] },
  { label: 'Quản lý tour', to: '/manager/tours', roles: ['tour_manager', 'admin'] },
  { label: 'Thêm tour', to: '/manager/tours/create', roles: ['tour_manager', 'admin'] },
  { label: 'Bảng tư vấn', to: '/agent/dashboard', roles: ['agent'] },
  { label: 'Khách hàng', to: '/agent/customers', roles: ['agent'] },
  { label: 'Booking phụ trách', to: '/agent/bookings', roles: ['agent'] },
  { label: 'Tạo booking', to: '/agent/create-booking', roles: ['agent'] },
  { label: 'Phân công', to: '/guide/assignments', roles: ['guide'] },
  { label: 'Dịch vụ đối tác', to: '/partner/services', roles: ['partner'] },
  { label: 'Thanh toán', to: '/accountant/payments', roles: ['accountant'] },
  { label: 'Báo cáo', to: '/accountant/reports', roles: ['accountant'] },
];

export default function Sidebar({ collapsed = false }) {
  const { role } = useAuth();
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`bg-dark text-white flex-shrink-0 ${collapsed ? 'p-2' : 'p-3'}`} style={{ width: collapsed ? 84 : 260, minHeight: '100vh' }}>
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <span className={`fw-semibold ${collapsed ? 'd-none' : 'd-inline'}`}>Điều hướng</span>
        <span className="badge bg-primary">RBAC</span>
      </div>

      <div className="nav nav-pills flex-column gap-1">
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link text-start ${isActive ? 'active' : 'text-white-50'}`}>
            {collapsed ? item.label.charAt(0) : item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
