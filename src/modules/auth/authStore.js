import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/shared/utils/api';

const KNOWN_BROWSER_KEY = 'teftele-known-browser';

const readKnownBrowser = () => {
  try {
    return localStorage.getItem(KNOWN_BROWSER_KEY) === '1';
  } catch {
    return false;
  }
};

const writeKnownBrowser = (value) => {
  try {
    if (value) {
      localStorage.setItem(KNOWN_BROWSER_KEY, '1');
    } else {
      localStorage.removeItem(KNOWN_BROWSER_KEY);
    }
  } catch {
    // Local storage can be unavailable in strict browser modes.
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isChecked: false,
      isKnownBrowser: readKnownBrowser(),

      setKnownBrowser: (value) => {
        writeKnownBrowser(value);
        set({ isKnownBrowser: value });
      },

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user } = res.data;
        get().setKnownBrowser(true);
        set({ user, isChecked: true });
        return user;
      },

      demoLogin: async () => {
        const res = await api.post('/auth/demo');
        const { user } = res.data;
        set({ user, isChecked: true });
        return user;
      },

      isDemo: () => Boolean(get().user?.is_demo),

      checkAuth: async () => {
        try {
          const res = await api.post('/auth/me');
          set({ user: res.data.user, isChecked: true });
        } catch {
          set({ user: null, isChecked: true });
        }
      },

      logout: async () => {
        get().setKnownBrowser(false);
        set({ user: null, isChecked: true });

        try {
          await api.post('/auth/logout');
        } catch {
          // Local cleanup should still happen when the server is unavailable.
        }
      },

      forceLogout: () => {
        set({ user: null, isChecked: true });
      },
    }),
    {
      name: 'teftele-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

window.addEventListener('auth:logout', () => {
  useAuthStore.getState().forceLogout();
});
