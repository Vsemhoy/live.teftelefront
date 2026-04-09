import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/utils/api';
import dayjs from 'dayjs';
import { useAuthStore } from '@/modules/auth/authStore';

// ---- Query Keys ----
export const eventorKeys = {
  all: ['eventor'],
  events: (params) => ['eventor', 'events', params],
  event: (id) => ['eventor', 'event', id],
  sections: () => ['eventor', 'sections'],
  types: () => ['eventor', 'types'],
  tags: () => ['eventor', 'tags'],
  search: (params) => ['eventor', 'search', params],
};

// ---- Hooks ----

/**
 * Загрузка событий за диапазон дат + секцию.
 * Запрос не выполняется пока юзер не залогинен.
 */
export const useEvents = ({ start, end, section }) => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: eventorKeys.events({ start, end, section }),
    queryFn: async () => {
      const res = await api.post('/eventor/getmyevents', {
        start,
        end,
        sections: [section],
      });
      return res.data.content;
    },
    enabled: Boolean(start && end && user),
  });
};

/**
 * Одно событие по id (для полного просмотра/редактирования)
 */
export const useEvent = (id) => {
  return useQuery({
    queryKey: eventorKeys.event(id),
    queryFn: async () => {
      const res = await api.post(`/eventor/getmyevent/${id}`, {});
      return res.data.content;
    },
    enabled: Boolean(id),
  });
};

/**
 * Секции пользователя
 */
export const useSections = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: eventorKeys.sections(),
    queryFn: async () => {
      const res = await api.post('/eventor/getmysections', {});
      return res.data.content;
    },
    enabled: Boolean(user),
  });
};

/**
 * Типы событий (системные + пользовательские)
 */
export const useEventTypes = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: eventorKeys.types(),
    queryFn: async () => {
      const res = await api.post('/eventor/getmytypes', {});
      return res.data.content;
    },
    enabled: Boolean(user),
    staleTime: 30 * 60 * 1000,
  });
};

/**
 * Полнотекстовый поиск
 */
export const useEventSearch = ({ q, sections, types, dateFrom, dateTo, page = 1 }) => {
  return useQuery({
    queryKey: eventorKeys.search({ q, sections, types, dateFrom, dateTo, page }),
    queryFn: async () => {
      const res = await api.post('/eventor/search', {
        q,
        sections,
        types,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        per_page: 20,
      });
      return res.data;
    },
    // Не запускаем если запрос пустой
    enabled: Boolean(q && q.trim().length >= 2),
  });
};

/**
 * Сохранение события (create или update)
 */
export const useSaveEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        const res = await api.post(`/eventor/updateevent/${data.id}`, data);
        return res.data.content;
      } else {
        const res = await api.post('/eventor/saveevent', data);
        return res.data.content;
      }
    },
    onSuccess: (savedEvent) => {
      // Инвалидируем кэш событий за соответствующий месяц
      const month = dayjs(savedEvent.setdate).format('YYYY-MM');
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === 'eventor' && q.queryKey[1] === 'events',
      });
      // Обновляем кэш конкретного события если оно уже было загружено
      qc.setQueryData(eventorKeys.event(savedEvent.id), savedEvent);
    },
  });
};

/**
 * Удаление события
 */
export const useDeleteEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/eventor/deleteevent/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === 'eventor' && q.queryKey[1] === 'events',
      });
      qc.removeQueries({ queryKey: eventorKeys.event(deletedId) });
    },
  });
};

/**
 * Сохранение секции
 */
export const useSaveSection = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        const res = await api.post(`/eventor/updatesection/${data.id}`, data);
        return res.data.content;
      } else {
        const res = await api.post('/eventor/savesection', data);
        return res.data.content;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.sections() });
    },
  });
};

/**
 * Удаление секции
 */
export const useDeleteSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/eventor/deletesection/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.sections() });
    },
  });
};

/**
 * Архивация секции (когда удалить нельзя — есть связанные события)
 */
export const useArchiveSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_archived }) => {
      const res = await api.post(`/eventor/updatesection/${id}`, { is_archived });
      return res.data.content;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.sections() });
    },
  });
};

/**
 * Сохранение порядка секций
 * POST /eventor/reordersections  { sections: [{ id, sort_order }] }
 */
export const useReorderSections = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections) => {
      await api.post('/eventor/reordersections', { sections });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.sections() });
    },
  });
};

/**
 * Теги пользователя (свои + системные)
 */
export const useTags = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: eventorKeys.tags(),
    queryFn: async () => {
      const res = await api.post('/eventor/getmytags', {});
      return res.data.content;
    },
    enabled: Boolean(user),
    staleTime: 15 * 60 * 1000, // теги меняются редко
  });
};

/**
 * Создать тег
 */
export const useSaveTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/eventor/savetag', data);
      return res.data.content;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.tags() });
    },
  });
};

/**
 * Удалить тег
 */
export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/eventor/deletetag/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventorKeys.tags() });
    },
  });
};
