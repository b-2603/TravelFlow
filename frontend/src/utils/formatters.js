export function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value) {
  if (!value) return '--';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function statusBadgeClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    confirmed: 'bg-primary',
    cancelled: 'bg-danger',
    completed: 'bg-success',
    paid: 'bg-success',
    unpaid: 'bg-secondary',
    partial: 'bg-info text-dark',
    open: 'bg-warning text-dark',
    answered: 'bg-primary',
    closed: 'bg-secondary',
    approved: 'bg-success',
    rejected: 'bg-danger',
    refunded: 'bg-success',
    draft: 'bg-secondary',
    paused: 'bg-warning text-dark',
  };

  return map[status] || 'bg-secondary';
}

export function bookingStatusLabel(status) {
  const map = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
  };

  return map[status] || status || '--';
}

export function paymentStatusLabel(status) {
  const map = {
    unpaid: 'Chưa thanh toán',
    partial: 'Đã đặt cọc',
    paid: 'Đã thanh toán',
    pending: 'Đang xử lý',
    success: 'Thành công',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
  };

  return map[status] || status || '--';
}

export function supportStatusLabel(status) {
  const map = {
    open: 'Đang chờ xử lý',
    answered: 'Đã phản hồi',
    closed: 'Đã đóng',
  };

  return map[status] || status || '--';
}

export function refundStatusLabel(status) {
  const map = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    refunded: 'Đã hoàn tiền',
  };

  return map[status] || status || '--';
}

export function resolutionLabel(value) {
  const map = {
    cash_refund: 'Hoàn tiền mặt',
    reschedule: 'Dời ngày khởi hành',
    change_tour: 'Đổi tour tương đương',
    voucher: 'Nhận voucher bảo lưu',
  };

  return map[value] || value || '--';
}
