import { useMemo, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Center, Checkbox, Divider, Group, Loader, Menu, Modal,
  Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconArrowsExchange, IconClockHour4, IconDotsVertical, IconEdit,
  IconFileText, IconFlag, IconMessageCircle, IconNote, IconPlus, IconTrash, IconX,
} from '@tabler/icons-react';
import { useDeleteTask, useSaveChecklistItem, useSaveTask, useTask } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { MdFull } from '@/shared/components/MdRenderer';
import {
  TASK_STATUSES, describeStatusChange, formatDate, formatDateTime, formatDuration,
  priorityColor, priorityLabel, statusColor, statusLabel,
} from '../../utils/taskerUtils';

const KIND_META = {
  note: { icon: IconNote, color: 'gray', label: 'Note' },
  report: { icon: IconFileText, color: 'blue', label: 'Report' },
  blocker: { icon: IconAlertTriangle, color: 'orange', label: 'Blocker' },
  clarification: { icon: IconMessageCircle, color: 'indigo', label: 'Clarification' },
  status_change: { icon: IconArrowsExchange, color: 'grape', label: 'Status' },
  session: { icon: IconClockHour4, color: 'teal', label: 'Session' },
};

const durationMinutes = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return 0;
  return Math.max(0, Math.ceil((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
};

export const TaskReadModal = () => {
  const { readModalOpen, readModalParams, closeReadModal } = useTaskerStore();
  const openTaskEditor = useTaskerStore((state) => state.openTaskEditor);
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);
  const openTimeEditor = useTaskerStore((state) => state.openTimeEditor);
  const { data: task, isLoading } = useTask(readModalParams?.id, { include_hidden: true });
  const saveTask = useSaveTask();
  const saveChecklistItem = useSaveChecklistItem();
  const deleteTask = useDeleteTask();
  const [newItemTitle, setNewItemTitle] = useState('');

  const timeline = useMemo(() => {
    if (!task) return [];
    const linkedEntryIds = new Set((task.logs || []).map((log) => log.timer_entry_id).filter(Boolean));
    const hasSpans = (task.spans || []).length > 0;
    const logItems = (task.logs || [])
      .filter((log) => !(hasSpans && log.kind === 'report' && log.timer_entry_id))
      .map((log) => ({
        key: `log-${log.id}`,
        at: log.occurred_at,
        kind: log.kind,
        log,
      }));
    const spanItems = (task.spans || [])
      .filter((span) => span.kind === 'fact' && span.ended_at)
      .map((span) => ({
        key: `span-${span.id}`,
        at: span.ended_at,
        kind: 'session',
        entry: {
          ...span,
          source_module: 'tasker',
          source_id: task.id,
          task_id: task.id,
          note: span.title,
          duration_min: durationMinutes(span.started_at, span.ended_at),
        },
      }));
    const sessionItems = hasSpans
      ? []
      : (task.timer_entries || [])
        .filter((entry) => entry.ended_at && !linkedEntryIds.has(entry.id))
        .map((entry) => ({
          key: `timer-${entry.id}`,
          at: entry.ended_at,
          kind: 'session',
          entry: { ...entry, task_id: task.id },
        }));
    return [...logItems, ...spanItems, ...sessionItems].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [task]);

  if (!readModalOpen) return null;

  const handleClose = () => closeReadModal();

  const handleEdit = () => {
    openTaskEditor(task);
  };

  const handleOpenLogEditor = (params) => {
    closeReadModal();
    openLogEditor(params);
  };

  const handleOpenTimeEditor = (params) => {
    closeReadModal();
    openTimeEditor(params);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this task?')) return;
    deleteTask.mutate(task, {
      onSuccess: () => {
        notifications.show({ message: 'Task deleted', color: 'red' });
        handleClose();
      },
    });
  };

  const handleStatusChange = (statusId) => {
    if (!task || Number(task.status_id) === Number(statusId)) return;
    saveTask.mutate({ ...task, status_id: Number(statusId) });
  };

  const checklistItems = task?.checklist_items || task?.children || [];

  const handleToggleChecklistItem = (item, checked) => {
    const nextMeta = { ...(item.meta || {}) };
    if (checked) {
      nextMeta.completed_at = new Date().toISOString();
    } else {
      delete nextMeta.completed_at;
    }

    saveChecklistItem.mutate({
      ...item,
      task_id: task.id,
      status_id: checked ? 22 : 20,
      meta: Object.keys(nextMeta).length ? nextMeta : null,
    });
  };

  const handleAddChecklistItem = () => {
    const title = newItemTitle.trim();
    if (!title || !task?.id) return;
    saveChecklistItem.mutate({
      title,
      task_id: task.id,
      status_id: 20,
      sort_order: checklistItems.length,
    }, {
      onSuccess: () => setNewItemTitle(''),
    });
  };

  return (
    <Modal opened={readModalOpen} onClose={handleClose} size="lg" withCloseButton={false} padding={0}>
      {isLoading || !task ? (
        <Center h={300}><Loader /></Center>
      ) : (
        <Stack gap={0}>
          <Box p="md" pb="sm" className="task-read-head">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
                <Group gap={6} wrap="wrap">
                  <StatusMenu task={task} onChange={handleStatusChange} />
                  <Badge size="xs" color={priorityColor(task.priority_id)} variant="light" leftSection={<IconFlag size={10} />}>
                    {priorityLabel(task.priority_id)}
                  </Badge>
                  {task.project?.title && (
                    <Badge size="xs" variant="outline" color="pink">{task.project.title}</Badge>
                  )}
                </Group>
                <Text size="lg" fw={700} lh={1.3}>{task.title}</Text>
              </Stack>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Edit" withArrow>
                  <ActionIcon variant="subtle" color="gray" onClick={handleEdit}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Menu position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Tooltip label="Close" withArrow>
                  <ActionIcon variant="subtle" color="gray" onClick={handleClose}>
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <Group gap={14} mt={10} wrap="wrap">
              {task.due_at && <Text size="xs" c="dimmed">Due {formatDate(task.due_at)}</Text>}
              <Text size="xs" c="dimmed">Assignee {task.assignee?.name || 'Self'}</Text>
              <Text size="xs" c="dimmed">Time {formatDuration(task.tracked_seconds)}</Text>
            </Group>

            {task.description && (
              <Box mt={10} className="task-read-description">
                <MdFull content={task.description} />
              </Box>
            )}
            {task.result && (
              <Box mt={8} className="task-read-result">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Result</Text>
                <MdFull content={task.result} />
              </Box>
            )}
          </Box>

          <Divider />

          <Box p="md" py="sm">
            <Group justify="space-between" mb={6}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">Checklist</Text>
            </Group>
            <Stack gap={6} mb={8}>
              {checklistItems.map((item) => {
                const isDone = Number(item.status_id) === 22 || Number(item.status_id) === 24;
                return (
                  <Group
                    key={item.id}
                    className={`task-checklist-item ${isDone ? 'is-done' : ''}`}
                    gap="xs"
                    wrap="nowrap"
                  >
                    <Checkbox
                      checked={isDone}
                      onChange={(event) => handleToggleChecklistItem(item, event.currentTarget.checked)}
                    />
                    <Box className="task-checklist-title">
                      <Text size="sm" className="task-checklist-title-text">{item.title}</Text>
                      {isDone && item.meta?.completed_at && (
                        <Text size="xs" c="dimmed">Done {formatDateTime(item.meta.completed_at)}</Text>
                      )}
                    </Box>
                  </Group>
                );
              })}
              {!checklistItems.length && <Text size="xs" c="dimmed">No checklist items yet.</Text>}
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <TextInput
                size="xs"
                placeholder="Add checklist item"
                value={newItemTitle}
                onChange={(event) => setNewItemTitle(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button size="xs" variant="light" onClick={handleAddChecklistItem}>Add</Button>
            </Group>
          </Box>

          <Divider />

          <Box p="md" py="sm" className="task-read-timeline">
            <Group justify="space-between" mb={8}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">Log</Text>
              <Group gap={6}>
                <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} onClick={() => handleOpenLogEditor({ task_id: task.id, kind: 'note', lockTask: true })}>
                  Note
                </Button>
                <Button size="xs" variant="light" color="orange" leftSection={<IconPlus size={12} />} onClick={() => handleOpenLogEditor({ task_id: task.id, kind: 'blocker', lockTask: true })}>
                  Blocker
                </Button>
                <Button size="xs" variant="light" color="teal" leftSection={<IconPlus size={12} />} onClick={() => handleOpenTimeEditor({ task_id: task.id })}>
                  Time
                </Button>
              </Group>
            </Group>

            <Stack gap={6}>
              {timeline.map((item) => (
                <TimelineEntry
                  key={item.key}
                  item={item}
                  onEditLog={(log) => handleOpenLogEditor({ ...log, lockTask: true })}
                  onEditEntry={(entry) => handleOpenTimeEditor(entry)}
                />
              ))}
              {!timeline.length && <Text size="xs" c="dimmed">No history yet - add a note or start the timer.</Text>}
            </Stack>
          </Box>
        </Stack>
      )}
    </Modal>
  );
};

const StatusMenu = ({ task, onChange }) => (
  <Menu position="bottom-start" withArrow>
    <Menu.Target>
      <Badge
        size="sm"
        color={statusColor(task.status_id)}
        variant="light"
        style={{ cursor: 'pointer' }}
      >
        {statusLabel(task.status_id)}
      </Badge>
    </Menu.Target>
    <Menu.Dropdown>
      {TASK_STATUSES.map((status) => (
        <Menu.Item key={status.value} onClick={() => onChange(status.value)}>
          <Badge size="xs" color={statusColor(status.value)} variant="light">{status.label}</Badge>
        </Menu.Item>
      ))}
    </Menu.Dropdown>
  </Menu>
);

const TimelineEntry = ({ item, onEditLog, onEditEntry }) => {
  const meta = KIND_META[item.kind] || KIND_META.note;
  const Icon = meta.icon;

  if (item.kind === 'session') {
    const entry = item.entry;
    return (
      <Box className="task-timeline-entry" onDoubleClick={() => onEditEntry(entry)}>
        <Group align="flex-start" wrap="nowrap" gap={8}>
          <Box className={`task-timeline-icon ${meta.color}`}><Icon size={13} /></Box>
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Group gap={6} justify="space-between" wrap="nowrap">
              <Text size="xs" fw={600}>Timer session</Text>
              <Text size="xs" c="dimmed">{formatDateTime(entry.started_at)} - {formatDateTime(entry.ended_at)}</Text>
            </Group>
            {entry.note && <Text size="xs" c="dimmed">{entry.note}</Text>}
          </Stack>
          <Text size="xs" fw={700} c="dimmed">{formatDuration((entry.duration_min || 0) * 60)}</Text>
        </Group>
      </Box>
    );
  }

  const log = item.log;
  const isStatusChange = log.kind === 'status_change';

  return (
    <Box
      className="task-timeline-entry"
      onDoubleClick={() => !isStatusChange && onEditLog(log)}
      style={{ cursor: isStatusChange ? 'default' : 'pointer' }}
    >
      <Group align="flex-start" wrap="nowrap" gap={8}>
        <Box className={`task-timeline-icon ${meta.color}`}><Icon size={13} /></Box>
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Group gap={6} justify="space-between" wrap="nowrap">
            <Badge size="xs" variant="light" color={meta.color}>{meta.label}</Badge>
            <Text size="xs" c="dimmed">{formatDateTime(log.occurred_at)}</Text>
          </Group>
          <Text size="sm" className="task-log-content">
            {isStatusChange ? describeStatusChange(log.content) : log.content}
          </Text>
          {log.blocker?.title && (
            <Badge size="xs" variant="outline" color="orange" leftSection={<IconAlertTriangle size={10} />}>
              {log.blocker.title} | seen {log.blocker.occurrence_count}x
            </Badge>
          )}
          {log.timer_entry?.duration_min != null && (
            <Text size="xs" c="dimmed">Session {formatDuration(log.timer_entry.duration_min * 60)}</Text>
          )}
        </Stack>
      </Group>
    </Box>
  );
};
