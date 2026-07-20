import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import api from '@/shared/utils/api';

const unwrap = (response) => response.data?.content ?? response.data ?? null;

const invalidateTimer = (queryClient, payload = {}) => {
  queryClient.invalidateQueries({ queryKey: ['timer_active'] });
  queryClient.invalidateQueries({ queryKey: ['timer_entries'] });
  queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
  queryClient.invalidateQueries({ queryKey: ['tsk_logs'] });
  if (payload?.task?.id) queryClient.invalidateQueries({ queryKey: ['tsk_task', payload.task.id] });
};

export const useActiveTimer = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['timer_active'],
    queryFn: () => api.get('/timer/active').then(unwrap),
    enabled: Boolean(user),
    refetchInterval: 30 * 1000,
  });
};

export const useTimerEntries = (params = {}) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['timer_entries', params],
    queryFn: () => api.get('/timer/entries', { params }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 20 * 1000,
  });
};

export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.post('/timer/start', payload).then(unwrap),
    onSuccess: (timer) => invalidateTimer(queryClient, { task: timer?.source }),
  });
};

export const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload = {}) => api.post('/timer/stop', payload).then(unwrap),
    onSuccess: (payload) => invalidateTimer(queryClient, payload),
  });
};

export const useSaveTimerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry) => {
      if (entry.id) return api.put(`/timer/entries/${entry.id}`, entry).then(unwrap);
      return api.post('/timer/entries', entry).then(unwrap);
    },
    onSuccess: (payload) => invalidateTimer(queryClient, payload),
  });
};

export const useDeleteTimerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry) => api.delete(`/timer/entries/${entry.id}`).then(unwrap),
    onSuccess: (payload) => invalidateTimer(queryClient, payload),
  });
};
