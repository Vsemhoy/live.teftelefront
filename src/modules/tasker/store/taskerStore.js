import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskerStore = create(
  persist(
    (set) => ({
      taskFilter: 'open',
      searchQuery: '',
      projectFilter: 'all',
      assigneeFilter: 'all',
      onlyBlocked: false,
      showHidden: false,
      calendarHourRange: '9-20',
      calendarShowFuture: false,
      taskEditorOpen: false,
      taskEditorParams: null,
      readModalOpen: false,
      readModalParams: null,
      logEditorOpen: false,
      logEditorParams: null,
      timeEditorOpen: false,
      timeEditorParams: null,
      timerPanelOpen: false,
      setTaskFilter: (value) => set({ taskFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value }),
      setProjectFilter: (value) => set({ projectFilter: value }),
      setAssigneeFilter: (value) => set({ assigneeFilter: value }),
      setOnlyBlocked: (value) => set({ onlyBlocked: value }),
      setShowHidden: (value) => set({ showHidden: value }),
      setCalendarHourRange: (value) => set({ calendarHourRange: value }),
      setCalendarShowFuture: (value) => set({ calendarShowFuture: value }),
      openTaskEditor: (params = {}) => set({ taskEditorOpen: true, taskEditorParams: params, readModalOpen: false }),
      closeTaskEditor: () => set({ taskEditorOpen: false, taskEditorParams: null }),
      openReadModal: (params = {}) => set({ readModalOpen: true, readModalParams: params }),
      closeReadModal: () => set({ readModalOpen: false, readModalParams: null }),
      openLogEditor: (params = {}) => set({ logEditorOpen: true, logEditorParams: params }),
      closeLogEditor: () => set({ logEditorOpen: false, logEditorParams: null }),
      openTimeEditor: (params = {}) => set({ timeEditorOpen: true, timeEditorParams: params }),
      closeTimeEditor: () => set({ timeEditorOpen: false, timeEditorParams: null }),
      setTimerPanelOpen: (value) => set({ timerPanelOpen: value }),
    }),
    {
      name: 'tasker-ui',
      version: 2,
      partialize: (state) => ({
        taskFilter: state.taskFilter,
        searchQuery: state.searchQuery,
        projectFilter: state.projectFilter,
        assigneeFilter: state.assigneeFilter,
        onlyBlocked: state.onlyBlocked,
        showHidden: state.showHidden,
        calendarHourRange: state.calendarHourRange,
        calendarShowFuture: state.calendarShowFuture,
      }),
    }
  )
);
