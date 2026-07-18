import dayjs from 'dayjs';

export const formatLastContact = (value) => {
  if (!value) return 'Never contacted';

  const date = dayjs(value);
  const days = dayjs().diff(date, 'day');

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return date.format('MMM D, YYYY');
};

export const formatPartialDate = (value, precision = 'day') => {
  if (!value) return '';

  const date = dayjs(value);
  if (!date.isValid()) return '';
  if (precision === 'year') return date.format('YYYY');
  if (precision === 'month') return date.format('MMM YYYY');
  return date.format('MMM D, YYYY');
};

export const normalizeDetails = (details) => {
  if (Array.isArray(details)) {
    return details
      .filter(Boolean)
      .map((detail, index) => ({
        kind: detail.kind || 'custom',
        label: detail.label || detail.kind || 'Detail',
        value: detail.value || '',
        sort_order: detail.sort_order ?? index + 1,
      }));
  }

  if (details && typeof details === 'object') {
    return Object.entries(details)
      .filter(([, value]) => value)
      .map(([kind, value], index) => ({
        kind: kind === 'telegram' ? 'tg' : kind,
        label: kind === 'telegram' ? 'Telegram' : kind,
        value,
        sort_order: index + 1,
      }));
  }

  return [];
};

export const getRelationA = (relation = {}) =>
  relation.contact_a_id || relation.from_contact_id || '';

export const getRelationB = (relation = {}) =>
  relation.contact_b_id || relation.to_contact_id || '';

export const getRelationPeerId = (relation, contactId) =>
  String(getRelationA(relation)) === String(contactId)
    ? getRelationB(relation)
    : getRelationA(relation);

export const getLogKind = (log = {}) => log.kind || log.type || 'note';

export const buildRelationGraph = (contacts = [], relations = []) => {
  const nodes = contacts
    .filter((contact) => !contact.is_archived)
    .map((contact) => ({
      id: contact.id,
      label: contact.name,
      group: contact.group,
    }));

  const links = relations.map((relation) => ({
    id: relation.id,
    source: getRelationA(relation),
    target: getRelationB(relation),
    kind: relation.kind,
    expired: Boolean(relation.valid_to),
    context: relation.context,
  }));

  return { nodes, links };
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export const contactMatches = (contact, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const detailValues = normalizeDetails(contact.details).map((detail) => detail.value);

  return [
    contact.name,
    contact.nickname,
    contact.group,
    contact.role,
    contact.company,
    contact.met_context,
    ...detailValues,
  ].some((value) => String(value || '').toLowerCase().includes(needle));
};

export const getDetail = (contact, kind) =>
  normalizeDetails(contact.details).find((detail) => detail.kind === kind)?.value || '';
