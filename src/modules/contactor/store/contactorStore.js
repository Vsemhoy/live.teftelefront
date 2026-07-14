import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_CONTACTS, MOCK_LOGS, MOCK_RELATIONS } from '../api/contactorMocks';
import { normalizeDetails } from '../utils/contactorUtils';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useContactorStore = create(
  persist(
    (set, get) => ({
      contacts: MOCK_CONTACTS,
      logs: MOCK_LOGS,
      relations: MOCK_RELATIONS,

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

      saveContact: (payload) => {
        const contacts = get().contacts;
        const next = {
          ...payload,
          id: payload.id || makeId('cnt'),
          details: normalizeDetails(payload.details),
          is_archived: payload.is_archived ?? false,
          last_contact_at: payload.last_contact_at || null,
        };

        set({
          contacts: contacts.some((c) => c.id === next.id)
            ? contacts.map((c) => (c.id === next.id ? { ...c, ...next } : c))
            : [next, ...contacts],
          contactEditorOpen: false,
          contactEditorParams: null,
        });

        return next;
      },

      saveLog: (payload) => {
        const logs = get().logs;
        const next = {
          ...payload,
          id: payload.id || makeId('log'),
          kind: payload.kind || payload.type || 'note',
          title: payload.title || '',
          occurred_at: payload.occurred_at || new Date().toISOString(),
          is_pinned: payload.is_pinned ?? false,
          eventor_event_id: payload.eventor_event_id || null,
          stuffer_register_id: payload.stuffer_register_id || null,
          exploiter_event_id: payload.exploiter_event_id || null,
        };

        set({
          logs: logs.some((l) => l.id === next.id)
            ? logs.map((l) => (l.id === next.id ? { ...l, ...next } : l))
            : [next, ...logs],
          contacts: get().contacts.map((c) =>
            c.id === next.contact_id
              ? { ...c, last_contact_at: next.occurred_at }
              : c
          ),
          logEditorOpen: false,
          logEditorParams: null,
        });

        return next;
      },

      saveRelation: (payload) => {
        const relations = get().relations;
        const next = {
          ...payload,
          id: payload.id || makeId('rel'),
          contact_a_id: payload.contact_a_id || payload.from_contact_id || '',
          contact_b_id: payload.contact_b_id || payload.to_contact_id || '',
          valid_from: payload.valid_from || null,
          valid_to: payload.valid_to || null,
          note: payload.note || '',
        };

        set({
          relations: relations.some((r) => r.id === next.id)
            ? relations.map((r) => (r.id === next.id ? { ...r, ...next } : r))
            : [next, ...relations],
          relationEditorOpen: false,
          relationEditorParams: null,
        });

        return next;
      },

      deleteLog: (id) => set({ logs: get().logs.filter((l) => l.id !== id) }),
      deleteContact: (id) => set({
        contacts: get().contacts.map((c) => c.id === id ? { ...c, is_archived: true } : c),
      }),
      deleteRelation: (id) => set({ relations: get().relations.filter((r) => r.id !== id) }),
    }),
    {
      name: 'contactor-ui',
      partialize: (state) => ({
        contacts: state.contacts,
        logs: state.logs,
        relations: state.relations,
        groupFilter: state.groupFilter,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
