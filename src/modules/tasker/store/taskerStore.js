import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskerStore = create(
  persist(
    (set) => ({
      taskFilter: 'open',
      searchQuery: '',
      projectFilter: 'all',
      showHidden: false,
      taskEditorOpen: false,
      taskEditorParams: null,
      logEditorOpen: false,
      logEditorParams: null,
      timeEditorOpen: false,
      timeEditorParams: null,
      timerPanelOpen: false,
      setTaskFilter: (value) => set({ taskFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value }),
      setProjectFilter: (value) => set({ projectFilter: value }),
      setShowHidden: (value) => set({ showHidden: value }),
      openTaskEditor: (params = {}) => set({ taskEditorOpen: true, taskEditorParams: params }),
      closeTaskEditor: () => set({ taskEditorOpen: false, taskEditorParams: null }),
      openLogEditor: (params = {}) => set({ logEditorOpen: true, logEditorParams: params }),
      closeLogEditor: () => set({ logEditorOpen: false, logEditorParams: null }),
      openTimeEditor: (params = {}) => set({ timeEditorOpen: true, timeEditorParams: params }),
      closeTimeEditor: () => set({ timeEditorOpen: false, timeEditorParams: null }),
      setTimerPanelOpen: (value) => set({ timerPanelOpen: value }),
    }),
    {
      name: 'tasker-ui',
      version: 1,
      partialize: (state) => ({
        taskFilter: state.taskFilter,
        searchQuery: state.searchQuery,
        projectFilter: state.projectFilter,
        showHidden: state.showHidden,
      }),
    }
  )
);
