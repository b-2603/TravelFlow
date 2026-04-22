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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '--';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateInput(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function maskDateInput(value) {
  if (!value) return '';

  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
}

export function parseDateInput(value) {
  if (!value) return '';

  const raw = String(value).trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);

  if (!match) return '';

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!day || !month || !year) return '';

  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }

  const isoDay = String(day).padStart(2, '0');
  const isoMonth = String(month).padStart(2, '0');

  return `${year}-${isoMonth}-${isoDay}`;
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
    submitted: 'bg-warning text-dark',
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
    pending: 'Chờ xác nhận chuyển khoản',
    submitted: 'Đã gửi thông báo chuyển khoản',
    partial: 'Đã thanh toán một phần',
    paid: 'Đã thanh toán đủ',
    success: 'Thành công',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
  };

  return map[status] || status || '--';
}

export function bookingPaymentMeta(booking) {
  const payments = booking?.payments || [];
  const status = booking?.payment_status;
  const successfulAmount = payments
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const refundedAmount = payments
    .filter((payment) => payment.status === 'refunded')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalAmount = Number(booking?.total_price || 0);
  const hasPending = payments.some((payment) => ['pending', 'submitted'].includes(payment.status));
  const netPaid = Math.max(successfulAmount - refundedAmount, 0);

  if (successfulAmount > 0 && refundedAmount >= successfulAmount) {
    return { label: 'Đã hoàn tiền', badge: 'refunded' };
  }

  if (totalAmount > 0 && netPaid >= totalAmount) {
    return { label: 'Đã thanh toán đủ', badge: 'paid' };
  }

  if (netPaid > 0) {
    return { label: 'Đã thanh toán một phần', badge: 'partial' };
  }

  if (hasPending) {
    return { label: 'Chờ xác nhận chuyển khoản', badge: 'pending' };
  }

  if (status === 'unpaid') {
    return { label: 'Chờ thanh toán', badge: 'pending' };
  }

  return { label: paymentStatusLabel(status), badge: status || 'secondary' };
}

export function bookingPaymentLabel(booking) {
  return bookingPaymentMeta(booking).label;
}

export function bookingPaymentBadgeClass(booking) {
  return statusBadgeClass(bookingPaymentMeta(booking).badge);
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
