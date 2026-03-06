import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { User } from '@/types';
import { api, onTokenRefreshed, onForceLogout } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (has: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const isBrowser = typeof window !== 'undefined';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function setLocalToken(key: 'accessToken' | 'refreshToken', value: string) {
  if (!isBrowser) return;
  localStorage.setItem(key, value);
}

function removeLocalToken(key: 'accessToken' | 'refreshToken') {
  if (!isBrowser) return;
  localStorage.removeItem(key);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (has) => set({ _hasHydrated: has }),

      setTokens: (accessToken, refreshToken) => {
        setLocalToken('accessToken', accessToken);
        setLocalToken('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setLocalToken('accessToken', data.accessToken);
        setLocalToken('refreshToken', data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        setLocalToken('accessToken', data.accessToken);
        setLocalToken('refreshToken', data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
        }
        removeLocalToken('accessToken');
        removeLocalToken('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : noopStorage)),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

onTokenRefreshed((accessToken, refreshToken) => {
  useAuthStore.getState().setTokens(accessToken, refreshToken);
});

onForceLogout(() => {
  removeLocalToken('accessToken');
  removeLocalToken('refreshToken');
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
});
