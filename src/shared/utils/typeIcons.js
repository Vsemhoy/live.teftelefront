import {
  IconCalendarEvent, IconBolt, IconPencil, IconChecklist,
  IconBook2, IconInfoCircle, IconCircleDashed, IconLayoutDashboard,
} from '@tabler/icons-react';

const TYPE_ICON_MAP = {
  'calendar-event': IconCalendarEvent,
  'bolt':           IconBolt,
  'pencil':         IconPencil,
  'checklist':      IconChecklist,
  'book-2':         IconBook2,
  'info-circle':    IconInfoCircle,
  'dashboard':      IconLayoutDashboard,
};

export const getTypeIconBySlug = (slug) => TYPE_ICON_MAP[slug] || IconCircleDashed;
