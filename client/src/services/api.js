import axios from 'axios';

const TOKEN_KEY = 'jeova:token';

/**
 * Guarda o token da sessao no navegador. A senha NUNCA e armazenada:
 * em caso de perda, o usuario pede uma nova senha provisoria a um admin.
 */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),

  set: (token) => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export function extrairErro(error, fallback = 'Ocorreu um erro. Tente novamente.') {
  return error?.response?.data?.error || error?.message || fallback;
}

export default api;
