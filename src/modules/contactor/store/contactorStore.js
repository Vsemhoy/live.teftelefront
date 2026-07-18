import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useContactorStore = create(
  persist(
    (set) => ({
      groupFilter: 'all',
      searchQuery: '',
      setGroupFilter: (value) => set({ groupFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value }),

      contactEditorOpen: false,
      contactEditorParams: null,
      openContactEditor: (params = {}) => set({ contactEditorOpen: true, contactEditorParams: params }),
      closeContactEditor: () => set({ contactEditorOpen: false, contactEditorParams: null }),

      logEditorOpen: false,
      logEditorParams: null,
      openLogEditor: (params = {}) => set({ logEditorOpen: true, logEditorParams: params }),
      closeLogEditor: () => set({ logEditorOpen: false, logEditorParams: null }),

      relationEditorOpen: false,
      relationEditorParams: null,
      openRelationEditor: (params = {}) => set({ relationEditorOpen: true, relationEditorParams: params }),
      closeRelationEditor: () => set({ relationEditorOpen: false, relationEditorParams: null }),

      viewMode: 'table',
      setViewMode: (mode) => set({ viewMode: mode }),

      sortField: 'last_contact_at',
      sortDir: 'desc',
      setSort: (field) => set((s) => ({
        sortField: field,
        sortDir: s.sortField === field && s.sortDir === 'desc' ? 'asc' : 'desc',
      })),
    }),
    {
      name: 'contactor-ui',
      version: 2,
      migrate: (state) => ({
        groupFilter: state?.groupFilter || 'all',
        searchQuery: state?.searchQuery || '',
        viewMode: state?.viewMode || 'table',
        sortField: state?.sortField || 'last_contact_at',
        sortDir: state?.sortDir || 'desc',
      }),
      partialize: (state) => ({
        groupFilter: state.groupFilter,
        searchQuery: state.searchQuery,
        viewMode: state.viewMode,
        sortField: state.sortField,
        sortDir: state.sortDir,
      }),
    }
  )
);
