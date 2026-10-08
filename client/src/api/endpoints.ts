import api from './axios';
import { API_URL } from './config';

// Auth APIs
export const authApi = {
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (data: { email: string; code: string }) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data: { email: string; resetToken: string; password: string }) => api.post('/auth/reset-password', data),
  login: async (data: { email: string; password: string }) => {
    return api.post('/auth/login', data);
  },
  register: async (data: any) => {
    return api.post('/auth/register', data);
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    return { success: true, data: null };
  },
  getMe: async () => {
    return api.get('/auth/me');
  },
  updateProfile: async (data: any) => {
    return api.put('/auth/profile', data);
  },
  changePassword: async (data: any) => {
    return api.put('/auth/change-password', data);
  }
};

// Transaction APIs
export const transactionApi = {
  getAll: async (params?: any) => {
    return api.get('/transactions', { params });
  },
  getById: async (id: string) => {
    return api.get(`/transactions/${id}`);
  },
  create: async (data: any) => {
    return api.post('/transactions', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/transactions/${id}`, data);
  },
  delete: async (id: string, params?: any) => {
    return api.delete(`/transactions/${id}`, { params });
  },
  restore: async (id: string, params?: any) => {
    return api.post(`/transactions/${id}/restore`, {}, { params });
  }
};

// Category APIs
export const categoryApi = {
  getAll: async (params?: any) => {
    return api.get('/categories', { params });
  },
  create: async (data: any) => {
    return api.post('/categories', data);
  },
  update: async (id: string, data: any) => {
    return api.patch(`/categories/${id}`, data);
  },
  archive: async (id: string) => {
    return api.patch(`/categories/${id}/archive`);
  },
  restore: async (id: string) => {
    return api.patch(`/categories/${id}/restore`);
  },
  reorder: async (items: Array<{ id: string; sortOrder: number }>) => {
    return api.post('/categories/reorder', { items });
  },
  getBreakdown: async (params?: any) => {
    return api.get('/categories/breakdown', { params });
  }
};

// Sale APIs
export const saleApi = {
  getAll: async (params?: any) => {
    return api.get('/sales', { params });
  },
  getById: async (id: string) => {
    return api.get(`/sales/${id}`);
  },
  create: async (data: any) => {
    return api.post('/sales', data);
  },
  recordPayment: async (id: string, data: any) => {
    return api.post(`/sales/${id}/payments`, data);
  }
};

// Warranty APIs
export const warrantyApi = {
  getAll: async (params?: any) => {
    return api.get('/warranties', { params });
  },
  extend: async (id: string, data: any) => {
    return api.post(`/warranties/${id}/extend`, data);
  },
  claim: async (id: string, data: any) => {
    return api.post(`/warranties/${id}/claim`, data);
  }
};

// Customer APIs
export const customerApi = {
  getAll: async (params?: any) => {
    return api.get('/customers', { params });
  },
  getById: async (id: string) => {
    return api.get(`/customers/${id}`);
  },
  create: async (data: any) => {
    return api.post('/customers', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/customers/${id}`, data);
  },
  delete: async (id: string) => {
    return api.delete(`/customers/${id}`);
  }
};

// Group APIs
export const groupApi = {
  deleteGroup: (groupId: string) => api.delete(`/groups/${groupId}`),
  getMyGroups: async () => {
    return api.get('/groups');
  },
  createGroup: async (data: any) => {
    return api.post('/groups', data);
  },
  joinByCode: async (data: any) => {
    return api.post('/groups/join', data);
  },
  getDetail: async (groupId: string) => {
    return api.get(`/groups/${groupId}`);
  },
  updateSettings: async (groupId: string, data: any) => {
    return api.put(`/groups/${groupId}/settings`, data);
  },
  getActivity: async (groupId: string) => {
    return api.get(`/groups/${groupId}/activity`);
  },
  createInvite: async (groupId: string, data: any) => {
    return api.post(`/groups/${groupId}/invites`, data);
  },
  inviteByEmail: async (groupId: string, data: any) => {
    return api.post(`/groups/${groupId}/invite-email`, data);
  },
  getMembers: async (groupId: string) => {
    return api.get(`/groups/${groupId}/members`);
  },
  updateMemberRole: async (groupId: string, memberId: string, data: any) => {
    return api.put(`/groups/${groupId}/members/${memberId}/role`, data);
  },
  removeMember: async (groupId: string, memberId: string) => {
    return api.delete(`/groups/${groupId}/members/${memberId}`);
  },
  leaveGroup: async (groupId: string) => {
    return api.post(`/groups/${groupId}/leave`);
  }
};

// Leaderboard APIs
export const leaderboardApi = {
  getLeaderboard: async (groupId: string, params?: any) => {
    return api.get(`/leaderboard/${groupId}`, { params });
  }
};

// Report APIs
export const reportApi = {
  getOverview: async (params?: any) => {
    return api.get('/reports/overview', { params });
  },
  getDailyChart: async (params?: any) => {
    return api.get('/reports/daily-chart', { params });
  },
  getCategoryBreakdown: async (params?: any) => {
    return api.get('/reports/category-breakdown', { params });
  },
  getTopProducts: async (params?: any) => {
    return api.get('/reports/top-products', { params });
  },
  getInsights: async (params?: any) => {
    return api.get('/reports/insights', { params });
  },
  getExportUrl: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('moneyflow_token');
    return `${API_URL}/reports/export-csv?${query}&token=${token}`;
  }
};

// Budget & Debt APIs
export const budgetApi = {
  getAll: async (params?: any) => {
    return api.get('/budgets', { params });
  },
  setBudget: async (data: any) => {
    return api.post('/budgets', data);
  },
  deleteBudget: async (id: string) => {
    return api.delete(`/budgets/${id}`);
  }
};

export const debtApi = {
  update: (id: string, data: any) => api.patch(`/debts/${id}`, data),
  updatePayment: (id: string, paymentId: string, data: any) => api.patch(`/debts/${id}/payments/${paymentId}`, data),
  getAll: async (params?: any) => {
    return api.get('/debts', { params });
  },
  create: async (data: any) => {
    return api.post('/debts', data);
  },
  pay: async (id: string, data: any) => {
    return api.post(`/debts/${id}/pay`, data);
  },
  delete: async (id: string) => {
    return api.delete(`/debts/${id}`);
  }
};

// Notification APIs
export const notificationApi = {
  respondToInvite: (id: string, action: 'accept' | 'decline') => api.post(`/notifications/${id}/respond`, { action }),
  getAll: async () => {
    return api.get('/notifications');
  },
  markAsRead: async (id: string) => {
    return api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  }
};
