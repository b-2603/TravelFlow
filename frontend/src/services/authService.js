import { authAPI } from './api';

const authService = {
  login: async (email, password) => {
    const response = await authAPI.login({ email, password });
    return response.data?.data;
  },
  register: async (payload) => {
    const response = await authAPI.register(payload);
    return response.data?.data;
  },
  me: async () => {
    const response = await authAPI.me();
    return response.data?.data;
  },
  logout: async () => {
    const response = await authAPI.logout();
    return response.data;
  },
};

export default authService;
