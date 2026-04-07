import { create } from 'zustand';
import api from '../api/client';

export const useWalletStore = create((set) => ({
  wallet: null,
  loading: false,
  fetchWallet: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/wallet');
      set({ wallet: data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  }
}));
