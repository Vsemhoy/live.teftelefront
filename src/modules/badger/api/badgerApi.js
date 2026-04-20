import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import api from '@/shared/utils/api';

// Хелпер — извлекает content из { status, content } или возвращает как есть
const unwrap = (r) => r.data?.content ?? r.data ?? [];

// ─── Accounts ────────────────────────────────────────────────────

export const useAccounts = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bud_accounts'],
    queryFn: () => api.get('/badger/accounts').then(unwrap),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/badger/accounts/${data.id}`, data).then(unwrap)
        : api.post('/badger/accounts', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bud_accounts'] }),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/badger/accounts/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bud_accounts'] }),
  });
};

// ─── Transactions ─────────────────────────────────────────────────

export const useTransactions = ({ start, end, account_id } = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bud_transactions', { start, end, account_id }],
    queryFn: () =>
      api.get('/badger/transactions', { params: { start, end, account_id } }).then(unwrap),
    enabled: Boolean(user) && Boolean(start) && Boolean(end),
    staleTime: 60 * 1000,
  });
};

export const useTransaction = (id) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bud_transaction', id],
    queryFn: () => api.get(`/badger/transactions/${id}`).then(unwrap),
    enabled: Boolean(user) && Boolean(id),
  });
};

export const useSaveTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/badger/transactions/${data.id}`, data).then(unwrap)
        : api.post('/badger/transactions', data).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bud_transactions'] });
      qc.invalidateQueries({ queryKey: ['bud_month_totals'] });
      qc.invalidateQueries({ queryKey: ['bud_accounts'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/badger/transactions/${id}`).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bud_transactions'] });
      qc.invalidateQueries({ queryKey: ['bud_month_totals'] });
      qc.invalidateQueries({ queryKey: ['bud_accounts'] });
    },
  });
};

export const useMoveTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, occurred_at, account_id }) =>
      api.patch(`/badger/transactions/${id}/move`, { occurred_at, account_id }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bud_transactions'] });
      qc.invalidateQueries({ queryKey: ['bud_month_totals'] });
      qc.invalidateQueries({ queryKey: ['bud_accounts'] });
    },
  });
};

// ─── Transaction Groups ──────────────────────────────────────────

export const useTransactionGroups = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bud_groups'],
    queryFn: () => api.get('/badger/groups').then(unwrap),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
};

export const useToggleGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_disabled }) =>
      api.patch(`/badger/groups/${id}/toggle`, { is_disabled }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bud_groups'] });
      qc.invalidateQueries({ queryKey: ['bud_transactions'] });
      qc.invalidateQueries({ queryKey: ['bud_month_totals'] });
    },
  });
};

export const useSaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/badger/groups/${data.id}`, data).then(unwrap)
        : api.post('/badger/groups', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bud_groups'] }),
  });
};

// ─── Month Totals ─────────────────────────────────────────────────

// Запрос диапазона месяцев — основной режим
// start/end в формате 'YYYY-MM', account_id через запятую
export const useMonthTotals = ({ start, end, account_id } = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bud_month_totals', { start, end, account_id }],
    queryFn: () =>
      api.get('/badger/month-totals', { params: { start, end, account_id } }).then(unwrap),
    // account_id обязателен — без него бэк не вызовет fillGapsUntil
    enabled: Boolean(user) && Boolean(start) && Boolean(end) && Boolean(account_id),
    staleTime: 2 * 60 * 1000,
  });
};
