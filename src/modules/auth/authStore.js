import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/shared/utils/api';

/**
 * Стор авторизации.
 * JWT живёт в httpOnly cookie на сервере — здесь храним только публичные данные юзера.
 * persist сохраняет профиль в localStorage — чтобы UI не мигал при перезагрузке.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,        // { id, name, email, avatar }
      isChecked: false,  // Прошли ли первичную проверку /auth/me при старте

      // ---- Actions ----

      /**
       * Логин — сервер устанавливает httpOnly cookies (access + refresh)
       */
      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user } = res.data;
        set({ user, isChecked: true });
        return user;
      },

      /**
       * Проверка сессии при старте приложения — тихая, без редиректов.
       * Используем прямой fetch без interceptor'а чтобы 401 не запускал цикл рефреша.
       */
      checkAuth: async () => {
        try {
          const res = await api.post('/auth/me');
          set({ user: res.data.user, isChecked: true });
        } catch (err) {
          // 401 = просто не залогинен, это нормально
          // Не вызываем logout — он попытается POST /auth/logout что снова даст 401
          set({ user: null, isChecked: true });
        }
      },

      /**
       * Выход — сервер инвалидирует refresh token и чистит cookies
       */
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Если запрос не прошёл — всё равно чистим локально
        }
        set({ user: null });
      },
    }),
    {
      name: 'teftele-auth',
      // Сохраняем только профиль юзера, не isChecked
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ---- Слушаем событие от api.js когда refresh провалился ----
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout();
});
