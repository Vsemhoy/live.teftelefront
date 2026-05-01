import { create } from 'zustand';

export const useBookerStore = create((set) => ({
  // ── Редактор книги (модалка) ──────────────────────────────────
  bookEditorOpen: false,
  bookEditorParams: null,
  openBookEditor:  (params = {}) => set({ bookEditorOpen: true,  bookEditorParams: params }),
  closeBookEditor: ()             => set({ bookEditorOpen: false, bookEditorParams: null }),

  // ── Менеджер структуры документов книги (модалка) ────────────
  docStructureOpen: false,
  docStructureBookId: null,
  openDocStructure:  (bookId) => set({ docStructureOpen: true,  docStructureBookId: bookId }),
  closeDocStructure: ()       => set({ docStructureOpen: false, docStructureBookId: null }),

  // ── Фильтры библиотеки ────────────────────────────────────────
  filterTab: 'all',      // 'all' | 'my' | 'subscriptions'
  filterTheme: null,     // theme id или null
  filterTag: null,       // tag slug или null
  searchQuery: '',

  setFilterTab:    (v) => set({ filterTab: v }),
  setFilterTheme:  (v) => set({ filterTheme: v }),
  setFilterTag:    (v) => set({ filterTag: v }),
  setSearchQuery:  (v) => set({ searchQuery: v }),
  clearFilters:    ()  => set({ filterTheme: null, filterTag: null, searchQuery: '' }),
}));
