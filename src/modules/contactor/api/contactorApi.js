import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import { useExpertStore } from '@/shared/expertStore';
import api from '@/shared/utils/api';
import { useContactorStore } from '../store/contactorStore';

const unwrap = (response) => response.data?.content ?? response.data ?? [];

const withExpert = (params, expertMode) => ({
  ...params,
  ...(expertMode ? { include_expert: 1 } : {}),
});

const invalidateContactor = (qc) => {
  qc.invalidateQueries({ queryKey: ['ctr_contacts'] });
  qc.invalidateQueries({ queryKey: ['ctr_contact'] });
  qc.invalidateQueries({ queryKey: ['ctr_logs'] });
  qc.invalidateQueries({ queryKey: ['ctr_relations'] });
};

export const useContacts = (params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);
  const groupFilter = useContactorStore((state) => state.groupFilter);
  const searchQuery = useContactorStore((state) => state.searchQuery);
  const sortField = useContactorStore((state) => state.sortField);
  const sortDir = useContactorStore((state) => state.sortDir);

  const queryParams = withExpert({
    group: params.group ?? groupFilter,
    q: params.q ?? searchQuery,
    sort: params.sort ?? sortField,
    dir: params.dir ?? sortDir,
    ...(params.pinned ? { pinned: 1 } : {}),
  }, expertMode);

  return useQuery({
    queryKey: ['ctr_contacts', queryParams],
    queryFn: () => api.get('/contactor/contacts', { params: queryParams }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};

export const usePinnedContacts = () => {
  const query = useContacts({ pinned: true, sort: 'sort_order', dir: 'asc', group: 'all', q: '' });
  return query.data ?? [];
};

export const useContact = (id) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['ctr_contact', id],
    queryFn: () => api.get(`/contactor/contacts/${id}`).then(unwrap),
    enabled: Boolean(user) && Boolean(id),
    staleTime: 30 * 1000,
  });
};

export const useContactLogs = (contactId, params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);
  const queryParams = withExpert({
    limit: params.limit ?? 500,
    ...(contactId ? { contact_id: contactId } : {}),
    ...(params.kind && params.kind !== 'all' ? { kind: params.kind } : {}),
  }, expertMode);

  return useQuery({
    queryKey: ['ctr_logs', queryParams],
    queryFn: () => api.get('/contactor/logs', { params: queryParams }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 15 * 1000,
  });
};

export const useContactRelations = (contactId) => {
  const user = useAuthStore((state) => state.user);
  const queryParams = contactId ? { contact_id: contactId } : {};

  return useQuery({
    queryKey: ['ctr_relations', queryParams],
    queryFn: () => api.get('/contactor/relations', { params: queryParams }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  });
};

export const useContactGraph = () => {
  const contactsQuery = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const relationsQuery = useContactRelations();

  return {
    contacts: contactsQuery.data ?? [],
    relations: relationsQuery.data ?? [],
    isLoading: contactsQuery.isLoading || relationsQuery.isLoading,
  };
};

export const useSaveContact = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => (
      data.id
        ? api.put(`/contactor/contacts/${data.id}`, data).then(unwrap)
        : api.post('/contactor/contacts', data).then(unwrap)
    ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['ctr_contacts'] });
      qc.invalidateQueries({ queryKey: ['ctr_relations'] });
      if (variables.id) {
        qc.invalidateQueries({ queryKey: ['ctr_contact', variables.id] });
      }
    },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/contactor/contacts/${id}`).then(unwrap),
    onSuccess: () => invalidateContactor(qc),
  });
};

export const useSaveLog = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => (
      data.id
        ? api.put(`/contactor/logs/${data.id}`, data).then(unwrap)
        : api.post('/contactor/logs', data).then(unwrap)
    ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['ctr_contacts'] });
      qc.invalidateQueries({ queryKey: ['ctr_logs'] });
      if (variables.contact_id) {
        qc.invalidateQueries({ queryKey: ['ctr_contact', variables.contact_id] });
      }
    },
  });
};

export const useDeleteLog = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/contactor/logs/${id}`).then(unwrap),
    onSuccess: () => invalidateContactor(qc),
  });
};

export const useSaveRelation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => (
      data.id
        ? api.put(`/contactor/relations/${data.id}`, data).then(unwrap)
        : api.post('/contactor/relations', data).then(unwrap)
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ctr_relations'] }),
  });
};

export const useDeleteRelation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/contactor/relations/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ctr_relations'] }),
  });
};
