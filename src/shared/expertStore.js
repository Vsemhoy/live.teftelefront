import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useExpertStore = create(
  persist(
    (set, get) => ({
      expertMode: false,
      toggleExpertMode: () => set({ expertMode: !get().expertMode }),
      setExpertMode: (val) => set({ expertMode: val }),
    }),
    { name: 'teftele-expert' }
  )
);
