// src/shared/lifecycle.js
// Единый справочник состояний на все модули Teftele.
// Источник истины — числовой id. Лейблы/цвета — производные.
// Сейчас const, позже → таблица sys_lifecycle.

export const LC_PALETTE = {
  red:   '#E24B4A',
  amber: '#B45309',
  green: '#2D9E6B',
  blue:  '#2D6CDF',
  teal:  '#1D9E75',
  slate: '#64748B',
  faint: '#9CA3AF',
};

export const LC_KIND = {
  PRIORITY: 'priority',
  WORKFLOW: 'workflow',
  STATE:    'state',
};

// Диапазоны: 11–19 priority, 20–39 workflow, 40–59 state
export const LIFECYCLE = [
  // ── Приоритеты ──
  { id: 11, kind: 'priority', code: 'someday',  label: 'Когда-нибудь',  color: 'faint', icon: 'circle',      modules: ['exploiter', 'tasker', 'pm'] },
  { id: 12, kind: 'priority', code: 'low',      label: 'Низкий',        color: 'slate', icon: 'circle',      modules: ['exploiter', 'tasker', 'pm'] },
  { id: 13, kind: 'priority', code: 'normal',   label: 'Обычный',       color: 'slate', icon: 'circle',      modules: ['exploiter', 'tasker', 'pm'] },
  { id: 14, kind: 'priority', code: 'high',     label: 'Высокий',       color: 'amber', icon: 'circle',      modules: ['exploiter', 'tasker', 'pm'] },
  { id: 15, kind: 'priority', code: 'critical', label: 'Критично',      color: 'red',   icon: 'circle',      modules: ['exploiter', 'tasker', 'pm'] },

  // ── Статусы работы ──
  { id: 20, kind: 'workflow', code: 'planned',     label: 'Запланировано', color: 'slate', icon: 'clock',        modules: ['exploiter', 'tasker', 'pm'] },
  { id: 21, kind: 'workflow', code: 'in_progress', label: 'В работе',      color: 'blue',  icon: 'progress',     modules: ['exploiter', 'tasker', 'pm'] },
  { id: 22, kind: 'workflow', code: 'done',        label: 'Сделано',       color: 'green', icon: 'check',        modules: ['exploiter', 'tasker', 'pm'] },
  { id: 23, kind: 'workflow', code: 'on_hold',     label: 'Отложено',      color: 'amber', icon: 'player-pause', modules: ['exploiter', 'tasker', 'pm'] },
  { id: 24, kind: 'workflow', code: 'canceled',    label: 'Отменено',      color: 'faint', icon: 'x',            modules: ['exploiter', 'tasker', 'pm'] },

  // ── Состояния вещи (только Stuffer) ──
  { id: 40, kind: 'state', code: 'active',    label: 'Активна',       color: 'green', icon: 'circle-check',   modules: ['stuffer'] },
  { id: 41, kind: 'state', code: 'stored',    label: 'На хранении',   color: 'slate', icon: 'box',            modules: ['stuffer'] },
  { id: 42, kind: 'state', code: 'ordered',   label: 'Заказано',      color: 'blue',  icon: 'truck-delivery', modules: ['stuffer'] },
  { id: 43, kind: 'state', code: 'installed', label: 'Установлено',   color: 'teal',  icon: 'tool',           modules: ['stuffer'] },
  { id: 44, kind: 'state', code: 'lent',      label: 'Одолжено',      color: 'amber', icon: 'user-share',     modules: ['stuffer'] },
  { id: 45, kind: 'state', code: 'sold',      label: 'Продано',       color: 'teal',  icon: 'cash',           modules: ['stuffer'] },
  { id: 46, kind: 'state', code: 'lost',      label: 'Потеряно',      color: 'red',   icon: 'alert-triangle', modules: ['stuffer'] },
  { id: 47, kind: 'state', code: 'disposed',  label: 'Утилизировано', color: 'faint', icon: 'trash',          modules: ['stuffer'] },
];

export const OVERDUE = { code: 'overdue', label: 'Просрочено', color: 'red', icon: 'alert-triangle' };

const BY_ID   = Object.fromEntries(LIFECYCLE.map((s) => [s.id, s]));
const BY_CODE = Object.fromEntries(LIFECYCLE.map((s) => [`${s.kind}:${s.code}`, s]));

export const lcById   = (id) => BY_ID[id] || null;
export const lcByCode = (kind, code) => BY_CODE[`${kind}:${code}`] || null;
export const lcHex    = (id) => LC_PALETTE[BY_ID[id]?.color] || LC_PALETTE.slate;

export const lcFor = (moduleId, kind) =>
  LIFECYCLE.filter((s) => s.kind === kind && s.modules.includes(moduleId));

const today = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (statusId, occurredAt) =>
  BY_ID[statusId]?.code === 'planned' && occurredAt < today();
