import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isAuthenticated: true });
    }
    return data;
  },
  logout: async () => {
    try { await api.post('/auth/logout'); } catch(e) {}
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    if (localStorage.getItem('token')) {
      try {
        const { data } = await api.get('/auth/me');
        set({ user: data.user, isAuthenticated: true });
      } catch (err) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  }
}));
