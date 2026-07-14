import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLedgerStore = create(
  persist(
    (set, get) => ({
  // ── Редактор транзакции ──────────────────────────────────────────
  editorOpen: false,
  editorParams: null,
  openEditor:  (params) => set({ editorOpen: true,  editorParams: params }),
  closeEditor: ()       => set({ editorOpen: false, editorParams: null }),

  // ── Ридер транзакции (ReadModal) ─────────────────────────────────
  readerOpen: false,
  readerParams: null,
  openReader:  (params) => set({ readerOpen: true,  readerParams: params }),
  closeReader: ()       => set({ readerOpen: false, readerParams: null }),

  // ── Менеджер счетов ──────────────────────────────────────────────
  managerOpen: false,
  openManager:  () => set({ managerOpen: true }),
  closeManager: () => set({ managerOpen: false }),

  // ── Активные счета в таблице ─────────────────────────────────────
  activeAccounts: [],
  activeCurrency: 'RUB',

  toggleAccount: (accountId, currency) => {
    if (!accountId || !currency) return;

    const { activeAccounts, activeCurrency } = get();
    if (currency !== activeCurrency) {
      set({ activeAccounts: [accountId], activeCurrency: currency });
      return;
    }
    const already = activeAccounts.includes(accountId);
    set({
      activeAccounts: already
        ? activeAccounts.filter((id) => id !== accountId)
        : [...activeAccounts, accountId],
    });
  },

  pruneActiveAccounts: (accounts = []) => {
    const validAccounts = (Array.isArray(accounts) ? accounts : [])
      .filter((account) => account?.id && String(account.name || '').trim() && !Boolean(account.is_archived));
    const validIds = new Set(validAccounts.map((account) => account.id));
    const { activeAccounts, activeCurrency } = get();
    const nextActive = activeAccounts.filter((id) => validIds.has(id));

    if (nextActive.length === activeAccounts.length) return;

    const firstAccount = validAccounts.find((account) => account.id === nextActive[0]);
    set({
      activeAccounts: nextActive,
      activeCurrency: firstAccount?.currency || activeCurrency || 'RUB',
    });
  },

  // ── Активный слой (пока всегда base) ─────────────────────────────
  activeLayerId: null,
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

  // ── Дупликатор транзакций ───────────────────────────────────────
  duplicatorOpen: false,
  duplicatorTx: null,
  openDuplicator:  (tx) => set({ duplicatorOpen: true,  duplicatorTx: tx }),
  closeDuplicator: ()   => set({ duplicatorOpen: false, duplicatorTx: null }),

  // ── Режим итога счёта ────────────────────────────────────────────
  balanceMode: 'basic',
  toggleBalanceMode: () =>
    set((s) => ({ balanceMode: s.balanceMode === 'basic' ? 'extended' : 'basic' })),

  // ── Фильтр по категории ──────────────────────────────────────────
  categoryFilter: null, // category id или null
  setCategoryFilter: (id) => set({ categoryFilter: id }),
    }),
    {
      name: 'ledger-ui',
      // Сохраняем только нужное — не сохраняем состояния модалок
      partialize: (s) => ({
        activeAccounts: s.activeAccounts,
        activeCurrency: s.activeCurrency,
        balanceMode:    s.balanceMode,
      }),
    }
  )
);
