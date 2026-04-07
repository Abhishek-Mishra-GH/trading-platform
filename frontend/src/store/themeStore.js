import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Light mode only — clear any persisted dark class on load
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
}

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      // Toggle is preserved but we only support light mode now
      toggleTheme: () => set(() => {
        document.documentElement.classList.remove('dark');
        return { theme: 'light' };
      }),
      initTheme: () => {
        document.documentElement.classList.remove('dark');
      },
    }),
    { name: 'tradesphere-theme' }
  )
);
