import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from './config';
import { singleFlight, tokenNeedsRefresh } from './session';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});
const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh-token', '/auth/forgot-password', '/auth/verify-reset-otp', '/auth/reset-password'];
const isPublicAuth = (url = '') => publicAuthPaths.some(path => url.split('?')[0].endsWith(path));
const expireSession = (token: string | null) => {
  if (localStorage.getItem('moneyflow_token') === token) useAuthStore.getState().logout();
};
const refreshSession = singleFlight(async () => {
  const previousToken = localStorage.getItem('moneyflow_token');
  try {
    const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true, timeout: 15000 });
    const newToken = res.data?.data?.accessToken;
    if (typeof newToken !== 'string' || !newToken) throw new Error('Không nhận được access token mới');
    // A late response must not restore a session after logout or replace a new login.
    if (localStorage.getItem('moneyflow_token') !== previousToken) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
    localStorage.setItem('moneyflow_token', newToken);
    useAuthStore.setState({ token: newToken });
    return newToken;
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0)) expireSession(previousToken);
    throw error;
  }
});

api.interceptors.request.use(async config => {
  let token = localStorage.getItem('moneyflow_token');
  if (token && !isPublicAuth(config.url) && !(config as any)._retry && tokenNeedsRefresh(token)) token = await refreshSession();
  if (token && !isPublicAuth(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !isPublicAuth(originalRequest.url)) {
      const header = String(originalRequest.headers?.Authorization || '');
      const requestToken = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (originalRequest._retry) {
        expireSession(requestToken);
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      }
      // All waiting requests are retried at most once, including concurrent ones.
      originalRequest._retry = true;
      try {
        const currentToken = localStorage.getItem('moneyflow_token');
        if (!currentToken) return Promise.reject(new Error('Vui lòng đăng nhập để tiếp tục.'));
        // Another request may already have refreshed the token that failed.
        const token = currentToken !== requestToken ? currentToken : await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        return Promise.reject(new Error(refreshError.response?.data?.message || refreshError.message || 'Không thể làm mới phiên. Vui lòng thử lại.'));
      }
    }
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default api;
