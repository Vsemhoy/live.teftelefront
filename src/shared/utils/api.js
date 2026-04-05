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
let failedQueue = []; // Очередь запросов пока идёт рефреш

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если 401 и это не повторный запрос и не сам /auth/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Если уже рефрешим — ставим в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Рефреш токена — сервер обновит httpOnly cookie
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Рефреш не удался — разлогиниваем
        processQueue(refreshError);
        // Сигнал для useAuthStore о необходимости разлогина
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
