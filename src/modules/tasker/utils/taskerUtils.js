export const TASK_STATUSES = [
  { value: '20', label: 'Planned' },
  { value: '21', label: 'In progress' },
  { value: '22', label: 'Done' },
  { value: '23', label: 'Blocked' },
  { value: '24', label: 'Canceled' },
];

export const TASK_PRIORITIES = [
  { value: '11', label: 'Critical' },
  { value: '12', label: 'High' },
  { value: '13', label: 'Normal' },
  { value: '14', label: 'Low' },
  { value: '15', label: 'Someday' },
];

export const LOG_KINDS = [
  { value: 'note', label: 'Note' },
  { value: 'report', label: 'Report' },
  { value: 'blocker', label: 'Blocker' },
  { value: 'clarification', label: 'Clarification' },
];

export const statusLabel = (id) =>
  TASK_STATUSES.find((item) => Number(item.value) === Number(id))?.label || 'Unknown';

export const priorityLabel = (id) =>
  TASK_PRIORITIES.find((item) => Number(item.value) === Number(id))?.label || 'Normal';

export const statusColor = (id) => ({
  20: 'gray',
  21: 'blue',
  22: 'green',
  23: 'orange',
  24: 'red',
}[Number(id)] || 'gray');

export const priorityColor = (id) => ({
  11: 'red',
  12: 'orange',
  13: 'blue',
  14: 'gray',
  15: 'grape',
}[Number(id)] || 'gray');

export const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
};

export const describeStatusChange = (content) => {
  const match = /^(\d+)\s*->\s*(\d+)$/.exec(String(content || '').trim());
  if (!match) return content;
  return `${statusLabel(match[1])} -> ${statusLabel(match[2])}`;
};

export const toInputDate = (value) => value ? String(value).slice(0, 10) : '';

// Layout spans into non-overlapping visual lanes.
export const layoutSpansIntoLanes = (spans) => {
  if (!spans.length) return new Map();

  const getStart = (s) => s.started_at
    ? new Date(s.started_at).getTime()
    : s.planned_start_at ? new Date(s.planned_start_at).getTime() : 0;

  const getEnd = (s) => {
    if (s.ended_at) return new Date(s.ended_at).getTime();
    if (s.planned_end_at) return new Date(s.planned_end_at).getTime();
    if (!s.ended_at && s.started_at) return Date.now();
    return getStart(s) + 30 * 60 * 1000;
  };

  const sorted = [...spans].sort((a, b) => getStart(a) - getStart(b));
  const lanes = [];
  const result = new Map();

  for (const span of sorted) {
    const start = getStart(span);
    const end = getEnd(span);
    let placed = false;

    for (let i = 0; i < lanes.length; i++) {
      if (start >= lanes[i]) {
        lanes[i] = end;
        result.set(span.id, i);
        placed = true;
        break;
      }
    }

    if (!placed) {
      result.set(span.id, lanes.length);
      lanes.push(end);
    }
  }

  const totalLanes = Math.max(1, lanes.length);
  for (const [id, laneIndex] of result) {
    result.set(id, { laneIndex, totalLanes });
  }

  return result;
};

export const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const PRIORITY_COLORS = {
  11: { bg: '#F09595', border: '#E24B4A', text: '#791F1F', plan: '#FDE8E8', planBorder: '#E24B4A' },
  12: { bg: '#FAC775', border: '#BA7517', text: '#412402', plan: '#FEF0D0', planBorder: '#BA7517' },
  13: { bg: '#9FE1CB', border: '#1D9E75', text: '#04342C', plan: '#E1F5EE', planBorder: '#1D9E75' },
  14: { bg: '#A8CFEE', border: '#378ADD', text: '#0C2F59', plan: '#E3F0FB', planBorder: '#378ADD' },
  15: { bg: '#D8C5F0', border: '#7950F2', text: '#3B1FA0', plan: '#F3EEFF', planBorder: '#7950F2' },
};

export const getPriorityColors = (priorityId) =>
  PRIORITY_COLORS[Number(priorityId)] || PRIORITY_COLORS[13];

export const buildHourLabels = (startHour, endHour) => {
  const labels = [];
  for (let h = startHour; h <= endHour; h++) labels.push(h);
  return labels;
};

export const timeToFraction = (datetimeStr, startHour, endHour) => {
  if (!datetimeStr) return null;
  const d = new Date(datetimeStr);
  const totalMinutes = (endHour - startHour) * 60;
  const offsetMinutes = d.getHours() * 60 + d.getMinutes() - startHour * 60;
  return Math.min(1, Math.max(0, offsetMinutes / totalMinutes));
};

export const snapMinutes = (minutes, step = 30) => Math.round(minutes / step) * step;

export const formatTime = (datetimeStr) => {
  if (!datetimeStr) return '';
  const d = new Date(datetimeStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const dateOffsetStr = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const formatDayLabel = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'long' }).format(d);
};

export const isToday = (dateStr) => dateStr === new Date().toISOString().slice(0, 10);
export const isPast = (dateStr) => dateStr < new Date().toISOString().slice(0, 10);

export const calcSpanSeconds = (span) => {
  if (span.kind !== 'fact' || !span.started_at) return 0;
  const end = span.ended_at ? new Date(span.ended_at) : new Date();
  const start = new Date(span.started_at);
  return Math.max(0, Math.floor((end - start) / 1000));
};
