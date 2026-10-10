import axios from 'axios';
import { API_URL } from './config';

// Wake a sleeping host with a read-only request before sending credentials.
// Never retry login/register mutations: a lost response may already have succeeded.
export async function waitForBackend() {
  const deadline = Date.now() + (import.meta.env.DEV ? 5000 : 90000);
  while (Date.now() < deadline) {
    try {
      const response = await axios.get(`${API_URL}/health`, {
        timeout: Math.min(10000, deadline - Date.now()),
        withCredentials: false
      });
      if (response.data?.app === 'MoneyFlow API' && response.data?.status === 'healthy') return;
      throw new Error('Máy chủ chưa sẵn sàng.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('Quá nhiều yêu cầu. Vui lòng chờ một lát rồi thử lại.');
      }
      if (Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(import.meta.env.DEV
    ? 'Không kết nối được backend. Chạy npm run dev tại thư mục Money và kiểm tra kết nối MongoDB trong terminal.'
    : 'Máy chủ chưa sẵn sàng hoặc không thể kết nối. Vui lòng thử lại sau ít phút.');
}
