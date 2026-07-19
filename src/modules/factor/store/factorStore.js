import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFactorStore = create(
  persist(
    (set) => ({
      kindFilter: 'all',
      searchQuery: '',
      localFacts: [],
      factEditorOpen: false,
      factEditorParams: null,
      factViewerOpen: false,
      factViewerParams: null,
      setKindFilter: (value) => set({ kindFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value }),
      openFactEditor: (params = {}) => set({ factEditorOpen: true, factEditorParams: params }),
      closeFactEditor: () => set({ factEditorOpen: false, factEditorParams: null }),
      openFactViewer: (params = {}) => set({ factViewerOpen: true, factViewerParams: params }),
      closeFactViewer: () => set({ factViewerOpen: false, factViewerParams: null }),
      upsertLocalFact: (fact) => set((state) => {
        const id = fact.id || `local-${Date.now()}`;
        const now = new Date().toISOString();
        const next = { ...fact, id, updated_at: now, created_at: fact.created_at || now };
        return {
          localFacts: [
            next,
            ...state.localFacts.filter((item) => item.id !== id),
          ],
        };
      }),
      removeLocalFact: (id) => set((state) => ({
        localFacts: state.localFacts.filter((item) => item.id !== id),
      })),
    }),
    {
      name: 'factor-ui',
      version: 1,
      partialize: (state) => ({
        kindFilter: state.kindFilter,
        searchQuery: state.searchQuery,
        localFacts: state.localFacts,
      }),
    }
  )
);
