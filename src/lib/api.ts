import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  withCredentials: false,
});

const isBrowser = typeof window !== 'undefined';

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
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/refresh`,
          { refreshToken }
        );
        setStoredTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        clearStoredTokens();
        if (isBrowser) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
