import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI-стор Eventor'а.
 * Хранит: активную секцию, текущий вид, диапазон дат, состояние редактора.
 */
export const useEventorStore = create(
  persist(
    (set) => ({
      // Текущий вид
      viewMode: 'flow', // 'flow' | 'grid' | 'search'

      // Активная секция ('ALL' | 'NULL' | '<uuid>')
      activeSection: 'ALL',

      // Диапазон дат для flow/grid
      startMonth: null, // ISO string, null = текущий месяц
      endMonth: null,

      // Направление сортировки в flow
      flowDirection: 'DESC', // 'DESC' = свежее сверху

      // Редактор: что сейчас открыто
      editorOpen: false,
      editorData: null, // { id: null, date, section_id } для нового | { id } для редактирования

      // Поисковый запрос (search panel)
      searchQuery: '',

      // ---- Actions ----

      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveSection: (id) => set({ activeSection: id }),
      setFlowDirection: (dir) => set({ flowDirection: dir }),

      setDateRange: (start, end) => set({
        startMonth: start ? start.toISOString() : null,
        endMonth: end ? end.toISOString() : null,
      }),

      openEditor: (data) => set({ editorOpen: true, editorData: data }),
      closeEditor: () => set({ editorOpen: false, editorData: null }),

      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    {
      name: 'teftele-eventor',
      // Сохраняем настройки вида, но не состояние редактора
      partialize: (state) => ({
        viewMode: state.viewMode,
        activeSection: state.activeSection,
        flowDirection: state.flowDirection,
      }),
    }
  )
);
