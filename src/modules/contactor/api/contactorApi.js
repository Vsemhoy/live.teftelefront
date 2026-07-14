import { useMemo } from 'react';
import { useContactorStore } from '../store/contactorStore';
import { contactMatches, getRelationA, getRelationB } from '../utils/contactorUtils';

export const useContacts = () => {
  const contacts = useContactorStore((state) => state.contacts);
  const groupFilter = useContactorStore((state) => state.groupFilter);
  const searchQuery = useContactorStore((state) => state.searchQuery);

  return useMemo(() => {
    const data = contacts
      .filter((contact) => !contact.is_archived)
      .filter((contact) => groupFilter === 'all' || contact.group === groupFilter)
      .filter((contact) => contactMatches(contact, searchQuery))
      .sort((a, b) => String(b.last_contact_at || '').localeCompare(String(a.last_contact_at || '')));

    return { data, isLoading: false };
  }, [contacts, groupFilter, searchQuery]);
};

export const useContact = (id) => {
  const contacts = useContactorStore((state) => state.contacts);

  return useMemo(() => ({
    data: contacts.find((contact) => String(contact.id) === String(id) && !contact.is_archived) || null,
    isLoading: false,
  }), [contacts, id]);
};

export const useContactLogs = (contactId) => {
  const logs = useContactorStore((state) => state.logs);

  return useMemo(() => ({
    data: logs
      .filter((log) => !contactId || String(log.contact_id) === String(contactId))
      .sort((a, b) => String(b.occurred_at || '').localeCompare(String(a.occurred_at || ''))),
    isLoading: false,
  }), [logs, contactId]);
};

export const useContactRelations = (contactId) => {
  const relations = useContactorStore((state) => state.relations);

  return useMemo(() => ({
    data: relations.filter((relation) => (
      !contactId ||
      String(getRelationA(relation)) === String(contactId) ||
      String(getRelationB(relation)) === String(contactId)
    )),
    isLoading: false,
  }), [relations, contactId]);
};

export const useContactGraph = () => {
  const contacts = useContactorStore((state) => state.contacts);
  const relations = useContactorStore((state) => state.relations);

  return useMemo(() => ({
    contacts: contacts.filter((contact) => !contact.is_archived),
    relations,
    isLoading: false,
  }), [contacts, relations]);
};
