import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProjectorStore = create(
  persist(
    (set) => ({
      projectFilter: 'open',
      searchQuery: '',
      showHidden: false,
      projectEditorOpen: false,
      projectEditorParams: null,
      setProjectFilter: (value) => set({ projectFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value }),
      setShowHidden: (value) => set({ showHidden: value }),
      openProjectEditor: (params = {}) => set({ projectEditorOpen: true, projectEditorParams: params }),
      closeProjectEditor: () => set({ projectEditorOpen: false, projectEditorParams: null }),
    }),
    {
      name: 'projector-ui',
      version: 1,
      partialize: (state) => ({
        projectFilter: state.projectFilter,
        searchQuery: state.searchQuery,
        showHidden: state.showHidden,
      }),
    }
  )
);
