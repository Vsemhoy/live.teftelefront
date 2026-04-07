import axios from 'axios';

// Базовый URL — берём из env или дефолт
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.teftele.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 18000,
  withCredentials: true, // Важно: cookies (JWT) передаются автоматически
});

// ---- Request interceptor ----
// Ничего лишнего — токен едет в httpOnly cookie, axios не знает о нём
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ---- Response interceptor — тихий рефреш при 401 ----
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Сетевая ошибка (CORS, timeout, нет сети) — error.response будет undefined
    // НЕ пытаемся рефрешить, иначе бесконечный цикл
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config;

    // Рефрешим только при 401, не для auth-эндпоинтов и не повторно
    const isAuthEndpoint =
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/logout') ||
      originalRequest.url.includes('/auth/login');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
