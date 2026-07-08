import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import api from '@/shared/utils/api';

// Хелпер — извлекает content из { status, content } или возвращает как есть
const unwrap = (r) => r.data?.content ?? r.data ?? [];

// ─── Accounts ────────────────────────────────────────────────────

export const useAccounts = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_accounts'],
    queryFn: () => api.get('/ledger/accounts').then(unwrap),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/ledger/accounts/${data.id}`, data).then(unwrap)
        : api.post('/ledger/accounts', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_accounts'] }),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/ledger/accounts/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_accounts'] }),
  });
};

// ─── Transactions ─────────────────────────────────────────────────

export const useTransactions = ({ start, end, account_id } = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_transactions', { start, end, account_id }],
    queryFn: () =>
      api.get('/ledger/transactions', { params: { start, end, account_id } }).then(unwrap),
    enabled: Boolean(user) && Boolean(start) && Boolean(end),
    staleTime: 60 * 1000,
  });
};

export const useTransaction = (id) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_transaction', id],
    queryFn: () => api.get(`/ledger/transactions/${id}`).then(unwrap),
    enabled: Boolean(user) && Boolean(id),
  });
};

export const useSaveTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/ledger/transactions/${data.id}`, data).then(unwrap)
        : api.post('/ledger/transactions', data).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['led_transactions'] });
      qc.invalidateQueries({ queryKey: ['led_month_totals'] });
      qc.invalidateQueries({ queryKey: ['led_accounts'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/ledger/transactions/${id}`).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['led_transactions'] });
      qc.invalidateQueries({ queryKey: ['led_month_totals'] });
      qc.invalidateQueries({ queryKey: ['led_accounts'] });
    },
  });
};

export const useMoveTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, occurred_at, account_id }) =>
      api.patch(`/ledger/transactions/${id}/move`, { occurred_at, account_id }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['led_transactions'] });
      qc.invalidateQueries({ queryKey: ['led_month_totals'] });
      qc.invalidateQueries({ queryKey: ['led_accounts'] });
    },
  });
};

export const useToggleTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_disabled }) =>
      api.patch(`/ledger/transactions/${id}/toggledisabled`, { is_disabled }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['led_transactions'] });
      qc.invalidateQueries({ queryKey: ['led_month_totals'] });
      qc.invalidateQueries({ queryKey: ['led_accounts'] });
    },
  });
};

// ─── Transaction Groups ──────────────────────────────────────────

export const useTransactionGroups = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_groups'],
    queryFn: () => api.get('/ledger/groups').then(unwrap),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
};

export const useToggleGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_disabled }) =>
      api.patch(`/ledger/groups/${id}/toggle`, { is_disabled }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['led_groups'] });
      qc.invalidateQueries({ queryKey: ['led_transactions'] });
      qc.invalidateQueries({ queryKey: ['led_month_totals'] });
    },
  });
};

export const useSaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/ledger/groups/${data.id}`, data).then(unwrap)
        : api.post('/ledger/groups', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_groups'] }),
  });
};

// ─── Month Totals ─────────────────────────────────────────────────

// Запрос диапазона месяцев — основной режим
// start/end в формате 'YYYY-MM', account_id через запятую
export const useMonthTotals = ({ start, end, account_id } = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_month_totals', { start, end, account_id }],
    queryFn: () =>
      api.get('/ledger/month-totals', { params: { start, end, account_id } }).then(unwrap),
    // account_id обязателен — без него бэк не вызовет fillGapsUntil
    enabled: Boolean(user) && Boolean(start) && Boolean(end) && Boolean(account_id),
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Categories ──────────────────────────────────────────────────

export const useCategories = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['led_categories'],
    queryFn: () => api.get('/ledger/categories').then(unwrap),
    enabled: Boolean(user),
    staleTime: 10 * 60 * 1000,
  });
};

export const useSaveCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      data.id
        ? api.put(`/ledger/categories/${data.id}`, data).then(unwrap)
        : api.post('/ledger/categories', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/ledger/categories/${id}`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_categories'] }),
  });
};

export const useReorderCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items) => api.post('/ledger/categories/reorder', { items }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['led_categories'] }),
  });
};
