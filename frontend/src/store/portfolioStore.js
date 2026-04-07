import { create } from 'zustand';
import api from '../api/client';

export const usePortfolioStore = create((set) => ({
  portfolio: null,
  loading: false,
  fetchPortfolio: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/portfolio');
      set({ portfolio: data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  }
}));
