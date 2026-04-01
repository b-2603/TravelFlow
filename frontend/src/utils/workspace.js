export function getWorkspacePath(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'tour_manager') return '/manager/tours';
  if (role === 'agent') return '/agent/dashboard';
  if (role === 'guide') return '/guide/assignments';
  if (role === 'partner') return '/partner/services';
  if (role === 'accountant') return '/accountant/payments';
  if (role === 'customer') return '/my-bookings';
  return '/';
}

export function isInternalRole(role) {
  return ['admin', 'tour_manager', 'agent', 'guide', 'partner', 'accountant'].includes(role);
}

export function getRoleLabel(role) {
  const labels = {
    admin: 'Quản trị viên',
    tour_manager: 'Quản lý tour',
    agent: 'Nhân viên tư vấn',
    guide: 'Hướng dẫn viên',
    partner: 'Đối tác dịch vụ',
    accountant: 'Kế toán / Tài chính',
    customer: 'Khách hàng',
  };

  return labels[role] || 'Người dùng';
}
