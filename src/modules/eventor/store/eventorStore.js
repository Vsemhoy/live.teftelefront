import { create } from 'zustand';

/**
 * UI-стор Eventor'а.
 * View/section/dates/search теперь живут в URL (useSearchParams).
 * Здесь только состояние оверлеев: editor и reader.
 */
export const useEventorStore = create((set) => ({
  // Редактор
  editorOpen: false,
  editorData: null,
  openEditor: (data) => set({ editorOpen: true, editorData: data }),
  closeEditor: () => set({ editorOpen: false, editorData: null }),

  // Ридер (режим чтения — двойной клик)
  readerOpen: false,
  readerData: null,
  openReader: (data) => set({ readerOpen: true, readerData: data }),
  closeReader: () => set({ readerOpen: false, readerData: null }),
}));
