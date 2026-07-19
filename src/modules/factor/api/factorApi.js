import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import { useExpertStore } from '@/shared/expertStore';
import api from '@/shared/utils/api';
import { factMocks } from './factorMocks';
import { useFactorStore } from '../store/factorStore';

const unwrap = (response) => response.data?.content ?? response.data ?? [];
const fallback = (data) => (error) => {
  if (error?.response?.status === 404) return data;
  return data;
};

const mergeFacts = (localFacts, remoteFacts) => Array.from(
  new Map([...remoteFacts, ...localFacts].map((fact) => [fact.id, fact])).values()
);

const isLocalOnly = (fact) => !fact?.id || String(fact.id).startsWith('local-') || String(fact.id).startsWith('fact-');

const factPayload = (fact) => ({
  label: fact.label,
  value: fact.value,
  format: fact.format || 'text',
  language: fact.language || null,
  unit: fact.unit || null,
  context: fact.context || null,
  search_keywords: fact.search_keywords || fact.search_aliases || fact.tags || [],
  kind: fact.kind || 'other',
  display_mode: fact.display_mode || 'plain',
  is_sensitive: Boolean(fact.is_sensitive),
  is_expert: Boolean(fact.is_expert),
  valid_from: fact.valid_from || null,
  valid_to: fact.valid_to || null,
  is_pinned: Boolean(fact.is_pinned),
  sort_order: Number(fact.sort_order || 0),
});

export const useFacts = (params = {}) => {
  const user = useAuthStore((state) => state.user);
  const kindFilter = useFactorStore((state) => state.kindFilter);
  const searchQuery = useFactorStore((state) => state.searchQuery);
  const localFacts = useFactorStore((state) => state.localFacts);
  const expertMode = useExpertStore((state) => state.expertMode);

  const queryParams = {
    kind: params.kind ?? kindFilter,
    q: params.q ?? searchQuery,
    pinned: params.pinned ?? false,
    include_expert: expertMode,
  };

  return useQuery({
    queryKey: ['fct_facts', queryParams, localFacts, expertMode],
    queryFn: async () => {
      const rows = await api.get('/factor/facts', { params: queryParams }).then(unwrap).catch(fallback(mergeFacts(localFacts, factMocks)));
      const q = String(queryParams.q || '').trim().toLowerCase();
      return rows
        .filter((fact) => (
          (queryParams.kind === 'all' || !queryParams.kind || fact.kind === queryParams.kind) &&
          (!queryParams.pinned || fact.is_pinned) &&
          (expertMode || !fact.is_expert) &&
          (!q || [
            fact.label,
            fact.value,
            fact.context,
            ...(fact.search_keywords || fact.search_aliases || fact.tags || []),
          ].join(' ').toLowerCase().includes(q))
        ))
        .sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)) || (a.sort_order ?? 999) - (b.sort_order ?? 999));
    },
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};

export const usePinnedFacts = () => useFacts({ kind: 'all', q: '', pinned: true });

export const useSaveFact = () => {
  const queryClient = useQueryClient();
  const upsertLocalFact = useFactorStore((state) => state.upsertLocalFact);
  const removeLocalFact = useFactorStore((state) => state.removeLocalFact);

  return useMutation({
    mutationFn: async (fact) => {
      const payload = factPayload(fact);
      if (!isLocalOnly(fact)) {
        return api.put(`/factor/facts/${fact.id}`, payload).then(unwrap);
      }
      return api.post('/factor/facts', payload).then(unwrap);
    },
    onSuccess: (saved, fact) => {
      if (fact?.id) removeLocalFact(fact.id);
      queryClient.invalidateQueries({ queryKey: ['fct_facts'] });
      return saved;
    },
    onError: (error, fact) => {
      if ([404, 405, 500].includes(error?.response?.status) || !error?.response) {
        upsertLocalFact(fact);
        queryClient.invalidateQueries({ queryKey: ['fct_facts'] });
      }
    },
  });
};

export const useToggleFactPin = () => {
  const queryClient = useQueryClient();
  const upsertLocalFact = useFactorStore((state) => state.upsertLocalFact);
  const removeLocalFact = useFactorStore((state) => state.removeLocalFact);

  return useMutation({
    mutationFn: async (fact) => {
      if (isLocalOnly(fact)) {
        const next = { ...fact, is_pinned: !fact.is_pinned };
        upsertLocalFact(next);
        return next;
      }
      return api.post(`/factor/facts/${fact.id}/pin`).then(unwrap);
    },
    onSuccess: (saved, fact) => {
      if (saved?.id && fact?.id && saved.id !== fact.id) removeLocalFact(fact.id);
      queryClient.invalidateQueries({ queryKey: ['fct_facts'] });
    },
    onError: (error, fact) => {
      if ([404, 405, 500].includes(error?.response?.status) || !error?.response) {
        upsertLocalFact({ ...fact, is_pinned: !fact.is_pinned });
        queryClient.invalidateQueries({ queryKey: ['fct_facts'] });
      }
    },
  });
};

export const useDeleteFact = () => {
  const queryClient = useQueryClient();
  const removeLocalFact = useFactorStore((state) => state.removeLocalFact);

  return useMutation({
    mutationFn: async (fact) => {
      if (isLocalOnly(fact)) {
        removeLocalFact(fact.id);
        return { id: fact.id };
      }
      return api.delete(`/factor/facts/${fact.id}`).then(unwrap);
    },
    onSuccess: (deleted) => {
      if (deleted?.id) removeLocalFact(deleted.id);
      queryClient.invalidateQueries({ queryKey: ['fct_facts'] });
    },
  });
};
