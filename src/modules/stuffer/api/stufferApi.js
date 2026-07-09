import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import api from '@/shared/utils/api';

const unwrap = (response) => response.data?.content ?? response.data ?? [];

export const useLocations = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['stf_locations'],
    queryFn: () => api.get('/stuffer/locations').then(unwrap),
    enabled: Boolean(user),
    staleTime: 10 * 60 * 1000,
  });
};

export const useSaveLocation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => (
      data.id
        ? api.put(`/stuffer/locations/${data.id}`, data).then(unwrap)
        : api.post('/stuffer/locations', data).then(unwrap)
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stf_locations'] }),
  });
};

export const useDeleteLocation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/stuffer/locations/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stf_locations'] }),
  });
};

export const useReorderLocations = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (items) => api.post('/stuffer/locations/reorder', { items }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stf_locations'] }),
  });
};

export const useThings = (params = {}) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['stf_things', params],
    queryFn: () => api.get('/stuffer/things', { params }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  });
};

export const useThing = (id) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['stf_thing', id],
    queryFn: () => api.get(`/stuffer/things/${id}`).then(unwrap),
    enabled: Boolean(user) && Boolean(id),
    staleTime: 30 * 1000,
  });
};

export const useSaveThing = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => (
      data.id
        ? api.put(`/stuffer/things/${data.id}`, data).then(unwrap)
        : api.post('/stuffer/things', data).then(unwrap)
    ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['stf_things'] });
      qc.invalidateQueries({ queryKey: ['exp_things'] });
      if (variables.id) {
        qc.invalidateQueries({ queryKey: ['stf_thing', variables.id] });
      }
    },
  });
};

export const useDeleteThing = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/stuffer/things/${id}`).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stf_things'] });
      qc.invalidateQueries({ queryKey: ['exp_things'] });
    },
  });
};

export const useOpenThing = () => (
  useMutation({
    mutationFn: (id) => api.post(`/stuffer/things/${id}/open`).then(unwrap),
  })
);

export const useRegister = (params = {}) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['stf_register', params],
    queryFn: () => api.get('/stuffer/register', { params }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};

export const useSaveRegister = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/stuffer/register', data).then(unwrap),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['stf_things'] });
      qc.invalidateQueries({ queryKey: ['stf_thing', variables.thing_id] });
      qc.invalidateQueries({ queryKey: ['stf_register'] });
    },
  });
};

export const useDeleteRegister = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/stuffer/register/${id}`).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stf_things'] });
      qc.invalidateQueries({ queryKey: ['stf_register'] });
    },
  });
};

export const useExpenses = (thing_id) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['stf_expenses', thing_id],
    queryFn: () => api.get('/stuffer/expenses', { params: { thing_id } }).then(unwrap),
    enabled: Boolean(user) && Boolean(thing_id),
    staleTime: 60 * 1000,
  });
};

export const useSaveExpense = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/stuffer/expenses', data).then(unwrap),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['stf_expenses', variables.thing_id] });
    },
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/stuffer/expenses/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stf_expenses'] }),
  });
};
