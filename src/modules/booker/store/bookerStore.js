import { create } from 'zustand';

export const useBookerStore = create((set) => ({
  // Book editor modal
  bookEditorOpen: false,
  bookEditorParams: null,
  openBookEditor:  (params = {}) => set({ bookEditorOpen: true,  bookEditorParams: params }),
  closeBookEditor: ()             => set({ bookEditorOpen: false, bookEditorParams: null }),

  // Page structure modal
  pageStructureOpen: false,
  pageStructureBookId: null,
  openPageStructure:  (bookId) => set({ pageStructureOpen: true,  pageStructureBookId: bookId }),
  closePageStructure: ()       => set({ pageStructureOpen: false, pageStructureBookId: null }),

  // Library filters
  searchQuery: '',
  setSearchQuery: (v) => set({ searchQuery: v }),
}));
