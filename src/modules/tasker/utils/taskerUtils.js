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

export const toInputDate = (value) => value ? String(value).slice(0, 10) : '';

export const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
