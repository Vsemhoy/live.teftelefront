import { create } from 'zustand';

export const useBadgerStore = create((set, get) => ({
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

  // ── Активный слой (пока всегда base) ─────────────────────────────
  activeLayerId: null,
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

  // ── Режим итога счёта ────────────────────────────────────────────
  balanceMode: 'basic',
  toggleBalanceMode: () =>
    set((s) => ({ balanceMode: s.balanceMode === 'basic' ? 'extended' : 'basic' })),
}));
