import { create } from 'zustand';
import { User } from '../types';
import { useGroupStore } from './groupStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token?: string) => void;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('moneyflow_user') || 'null'),
  token: localStorage.getItem('moneyflow_token') || null,
  isAuthenticated: !!localStorage.getItem('moneyflow_token'),

  setAuth: (user: User, token?: string) => {
    localStorage.setItem('moneyflow_user', JSON.stringify(user));
    if (token) localStorage.setItem('moneyflow_token', token);
    set({ user, token: token || null, isAuthenticated: true });
  },

  updateUser: (updatedUser: User) => {
    localStorage.setItem('moneyflow_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  logout: () => {
    useGroupStore.getState().setActiveGroup(null);
    useGroupStore.getState().setGroups([]);
    localStorage.removeItem('moneyflow_user');
    localStorage.removeItem('moneyflow_token');
    localStorage.removeItem('moneyflow_active_group');
    localStorage.removeItem('moneyflow_active_group_name');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
