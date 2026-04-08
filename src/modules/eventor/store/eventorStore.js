import { create } from 'zustand';

/**
 * UI-стор Eventor'а.
 * View/section/dates/search живут в URL (useSearchParams).
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
  readerData: null,  // { id } для событий | { draft: obj } для черновиков
  openReader: (data) => set({ readerOpen: true, readerData: data }),
  closeReader: () => set({ readerOpen: false, readerData: null }),

  // Из ридера → в редактор (атомарно)
  openEditorFromReader: (data) => set({
    readerOpen: false, readerData: null,
    editorOpen: true, editorData: data,
  }),

  // Менеджер секций
  sectionsManagerOpen: false,
  openSectionsManager: () => set({ sectionsManagerOpen: true }),
  closeSectionsManager: () => set({ sectionsManagerOpen: false }),
}));
