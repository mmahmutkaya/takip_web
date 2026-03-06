import axios from 'axios';

const API_PREFIX = '/api/v1';

function resolveApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3001/api/v1';
  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;

  // Backend uses a global `api/v1` prefix; append it if env is missing the prefix.
  if (normalized.endsWith(API_PREFIX)) {
    return normalized;
  }

  return `${normalized}${API_PREFIX}`;
}

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 15000,
});

const isBrowser = typeof window !== 'undefined';

type TokenUpdateFn = (accessToken: string, refreshToken: string) => void;
type LogoutFn = () => void;

let _tokenUpdateCallback: TokenUpdateFn | null = null;
let _forceLogoutCallback: LogoutFn | null = null;

export function onTokenRefreshed(cb: TokenUpdateFn) {
  _tokenUpdateCallback = cb;
}

export function onForceLogout(cb: LogoutFn) {
  _forceLogoutCallback = cb;
}

function getStoredToken(key: 'accessToken' | 'refreshToken') {
  if (!isBrowser) return null;
  return localStorage.getItem(key);
}

function setStoredTokens(accessToken: string, refreshToken: string) {
  if (!isBrowser) return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearStoredTokens() {
  if (!isBrowser) return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');
}

api.interceptors.request.use((config) => {
  const token = getStoredToken('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        setStoredTokens(data.accessToken, data.refreshToken);
        _tokenUpdateCallback?.(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        clearStoredTokens();
        _forceLogoutCallback?.();
        if (isBrowser) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
