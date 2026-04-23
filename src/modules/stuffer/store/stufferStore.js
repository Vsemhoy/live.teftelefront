import { create } from 'zustand';

export const useStufferStore = create((set) => ({
  // ── Редактор вещи (модалка) ───────────────────────────────────
  editorOpen: false,
  editorParams: null,
  openEditor:  (params = {}) => set({ editorOpen: true,  editorParams: params }),
  closeEditor: ()             => set({ editorOpen: false, editorParams: null }),

  // ── Модалка регистра (событие) ────────────────────────────────
  registerOpen: false,
  registerParams: null,
  openRegister:  (params = {}) => set({ registerOpen: true,  registerParams: params }),
  closeRegister: ()             => set({ registerOpen: false, registerParams: null }),

  // ── Менеджер локаций ──────────────────────────────────────────
  locationsOpen: false,
  openLocations:  () => set({ locationsOpen: true }),
  closeLocations: () => set({ locationsOpen: false }),

  // ── Активная локация в сайдбаре ───────────────────────────────
  activeLocationId: null,
  setActiveLocation: (id) => set({ activeLocationId: id }),

  // ── Фильтры ───────────────────────────────────────────────────
  filterType: null,        // 'asset' | 'item' | null
  filterStatus: null,      // статус или null
  filterCategory: null,    // category_id или null
  setFilterType:     (v) => set({ filterType: v }),
  setFilterStatus:   (v) => set({ filterStatus: v }),
  setFilterCategory: (v) => set({ filterCategory: v }),

  // ── Вид списка ────────────────────────────────────────────────
  viewMode: 'grid',        // 'grid' | 'table'
  setViewMode: (v) => set({ viewMode: v }),
}));
