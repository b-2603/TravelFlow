import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'travel_management_auth';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : null;
  const token = parsed?.token;

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (status === 403 && window.location.pathname !== '/unauthorized') {
      window.location.href = '/unauthorized';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (payload) => api.post('/auth/login', { login: payload.email, password: payload.password }),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const systemAPI = {
  paymentSettings: () => api.get('/settings/payment'),
};

export const userAPI = {
  profile: () => api.get('/profile'),
  updateProfile: (payload) => {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT');
      return api.post('/profile', payload);
    }

    return api.put('/profile', payload);
  },
  changePassword: (payload) => api.post('/profile/change-password', payload),
};

export const tourAPI = {
  list: (params) => api.get('/tours', { params }),
  detail: (slug) => api.get(`/tours/${slug}`),
  managerList: (params) => api.get('/manager/tours', { params }),
  managerMeta: () => api.get('/manager/meta'),
  managerDetail: (id) => api.get(`/manager/tours/${id}`),
  submitForApproval: (id) => api.post(`/manager/tours/${id}/submit`),
  togglePin: (id) => api.post(`/manager/tours/${id}/toggle-pin`),
  duplicate: (id) => api.post(`/manager/tours/${id}/duplicate`),
  create: (payload) => api.post('/tours', payload),
  update: (id, payload) => {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT');
      return api.post(`/tours/${id}`, payload);
    }

    return api.put(`/tours/${id}`, payload);
  },
  remove: (id) => api.delete(`/tours/${id}`),
  reviews: (id) => api.get(`/tours/${id}/reviews`),
};

export const bookingAPI = {
  list: (params) => api.get('/bookings', { params }),
  detail: (id) => api.get(`/bookings/${id}`),
  document: (id) => api.get(`/bookings/${id}/document`, { responseType: 'blob' }),
  cancelPreview: (id) => api.get(`/bookings/${id}/cancel-preview`),
  create: (payload) => api.post('/bookings', payload),
  update: (id, payload) => api.put(`/bookings/${id}`, payload),
  cancel: (id, payload) => api.post(`/bookings/${id}/cancel`, payload),
  adminList: (params) => api.get('/admin/bookings', { params }),
  confirm: (id) => api.post(`/admin/bookings/${id}/confirm`),
};

export const reviewAPI = {
  create: (payload) => api.post('/reviews', payload),
};

export const paymentAPI = {
  list: (params) => api.get('/payments', { params }),
  create: (payload) => api.post('/payments', payload),
  detail: (id) => api.get(`/payments/${id}`),
  confirm: (id, payload) => api.post(`/payments/${id}/confirm`, payload),
  customerConfirm: (id) => api.post(`/payments/${id}/customer-confirm`),
  refundRequests: (params) => api.get('/accountant/refund-requests', { params }),
  approveRefund: (id, payload) => api.post(`/accountant/refund-requests/${id}/approve`, payload),
  rejectRefund: (id, payload) => api.post(`/accountant/refund-requests/${id}/reject`, payload),
  markRefunded: (id, payload) => api.post(`/accountant/refund-requests/${id}/refunded`, payload),
  partnerLiabilities: () => api.get('/accountant/partner-liabilities'),
  financeReport: (params) => api.get('/accountant/reports', { params }),
  exportFinanceReport: (params) => api.get('/accountant/reports/export', { params, responseType: 'blob' }),
};

export const customerAPI = {
  dashboard: () => api.get('/customer/dashboard'),
  favorites: () => api.get('/customer/favorites'),
  addFavorite: (tourId) => api.post(`/customer/favorites/${tourId}`),
  removeFavorite: (tourId) => api.delete(`/customer/favorites/${tourId}`),
  supports: () => api.get('/customer/supports'),
  createSupport: (payload) => api.post('/customer/supports', payload),
  refundRequests: () => api.get('/customer/refund-requests'),
  createRefundRequest: (payload) => api.post('/customer/refund-requests', payload),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  userDetail: (id) => api.get(`/admin/users/${id}`),
  createStaff: (payload) => api.post('/admin/users', payload),
  tours: (params) => api.get('/admin/tours', { params }),
  guideAssignments: () => api.get('/admin/guide-assignments'),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),
  resetPassword: (id, payload) => api.post(`/admin/users/${id}/reset-password`, payload),
  lockUser: (id) => api.post(`/admin/users/${id}/lock`),
  unlockUser: (id) => api.post(`/admin/users/${id}/unlock`),
  partners: (params) => api.get('/admin/partners', { params }),
  approvePartner: (id) => api.post(`/admin/partners/${id}/approve`),
  rejectPartner: (id) => api.post(`/admin/partners/${id}/reject`),
  supports: (params) => api.get('/admin/supports', { params }),
  replySupport: (id, payload) => api.post(`/admin/supports/${id}/reply`, payload),
  reviews: (params) => api.get('/admin/reviews', { params }),
  approveReview: (id) => api.post(`/admin/reviews/${id}/approve`),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  settings: () => api.get('/admin/settings'),
  updateSettings: (payload) => api.put('/admin/settings', payload),
  approveTour: (id) => api.post(`/admin/tours/${id}/approve`),
  rejectTour: (id, payload) => api.post(`/admin/tours/${id}/reject`, payload),
  assignGuide: (id, payload) => api.post(`/admin/tours/${id}/assign-guide`, payload),
  logs: (params) => api.get('/admin/logs', { params }),
};

export const accountantAPI = {
  dashboard: (params) => api.get('/accountant/dashboard', { params }),
  logs: (params) => api.get('/accountant/logs', { params }),
};

export const guideAPI = {
  dashboard: () => api.get('/guide/dashboard'),
  assignments: () => api.get('/guide/assignments'),
  showAssignment: (tourId, departureDate) =>
    api.get(departureDate ? `/guide/assignments/${tourId}/${departureDate}` : `/guide/assignments/${tourId}`),
  updateStatus: (id, payload) => api.post(`/guide/tours/${id}/update-status`, payload),
  takeAttendance: (tourId, departureDate, payload) =>
    api.post(`/guide/tours/${tourId}/attendance/${departureDate}`, payload),
  progressHistory: (tourId) => api.get(`/guide/tours/${tourId}/progress`),
  passengers: (tourId) => api.get(`/guide/tours/${tourId}/passengers`),
  partners: (tourId) => api.get(`/guide/tours/${tourId}/partners`),
  reportIncident: (tourId, payload) => api.post(`/guide/tours/${tourId}/report-incident`, payload),
  submitDayNote: (tourId, payload) => api.post(`/guide/tours/${tourId}/day-note`, payload),
  notifications: () => api.get('/guide/notifications'),
  stats: () => api.get('/guide/stats'),
};

export const partnerAPI = {
  dashboard: () => api.get('/partner/dashboard'),
  services: () => api.get('/partner/services'),
  updateProfile: (payload) => {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT');
      return api.post('/partner/profile', payload);
    }

    return api.put('/partner/profile', payload);
  },
  createService: (payload) => api.post('/partner/services', payload),
  updateService: (id, payload) => api.put(`/partner/services/${id}`, payload),
  toggleServiceStatus: (id) => api.post(`/partner/services/${id}/toggle-status`),
  deleteService: (id) => api.delete(`/partner/services/${id}`),
};

export const agentAPI = {
  dashboard: () => api.get('/agent/dashboard'),
  stats: (params) => api.get('/agent/stats', { params }),
  tours: (params) => api.get('/agent/tours', { params }),
  showTour: (id) => api.get(`/agent/tours/${id}`),
  customers: (params) => api.get('/agent/customers', { params }),
  showCustomer: (id) => api.get(`/agent/customers/${id}`),
  bookings: (params) => api.get('/agent/bookings', { params }),
  showBooking: (id) => api.get(`/agent/bookings/${id}`),
  createBooking: (payload) => api.post('/agent/bookings', payload),
  updateBooking: (id, payload) => api.put(`/agent/bookings/${id}`, payload),
  confirmPassengerInfo: (id, payload) => api.post(`/agent/bookings/${id}/confirm-passenger`, payload),
  processCancellation: (id, payload) => api.post(`/agent/bookings/${id}/cancel`, payload),
  sendReminder: (id, payload) => api.post(`/agent/bookings/${id}/send-reminder`, payload),
  supportTickets: (params) => api.get('/agent/support-tickets', { params }),
  replySupportTicket: (ticketId, payload) => api.post(`/agent/support-tickets/${ticketId}/reply`, payload),
  createCustomTour: (payload) => api.post('/agent/custom-tours', payload),
  personalStats: (params) => api.get('/agent/stats', { params }),
};
