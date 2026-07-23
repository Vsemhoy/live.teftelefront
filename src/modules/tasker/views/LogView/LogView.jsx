import { useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Badge, Box, Button, Center, Checkbox, Group, Loader, Pagination, Select, Stack, Text,
} from '@mantine/core';
import {
  IconAlertTriangle, IconArrowsExchange, IconFileText, IconMessageCircle, IconNote, IconTrash,
} from '@tabler/icons-react';
import { useBulkDeleteTaskLogs, useTaskLogs } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { describeStatusChange, formatDateTime } from '../../utils/taskerUtils';

const KIND_META = {
  note: { icon: IconNote, color: 'gray' },
  report: { icon: IconFileText, color: 'blue' },
  blocker: { icon: IconAlertTriangle, color: 'orange' },
  clarification: { icon: IconMessageCircle, color: 'indigo' },
  status_change: { icon: IconArrowsExchange, color: 'grape' },
};

export const LogView = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState('50');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const params = useMemo(() => ({ page, per_page: Number(perPage) }), [page, perPage]);
  const { data: payload, isLoading } = useTaskLogs(params);
  const bulkDeleteLogs = useBulkDeleteTaskLogs();
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);
  const logs = Array.isArray(payload) ? payload : payload?.data || [];
  const meta = Array.isArray(payload)
    ? { current_page: 1, last_page: 1, per_page: logs.length, total: logs.length }
    : payload?.meta || { current_page: page, last_page: 1, per_page: Number(perPage), total: logs.length };
  const visibleIds = logs.map((log) => log.id);
  const selectedOnPageCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected = visibleIds.length > 0 && selectedOnPageCount === visibleIds.length;
  const somePageSelected = selectedOnPageCount > 0 && !allPageSelected;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, perPage]);

  const toggleLog = (id, checked) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const togglePage = (checked) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !window.confirm(`Delete ${ids.length} selected log entries?`)) return;

    bulkDeleteLogs.mutate({ ids }, {
      onSuccess: (result) => {
        setSelectedIds(new Set());
        notifications.show({ message: `Deleted ${result?.deleted_count ?? ids.length} log entries`, color: 'red' });
      },
      onError: () => notifications.show({ message: 'Failed to delete log entries', color: 'red' }),
    });
  };

  const deleteAll = () => {
    if (!meta.total || !window.confirm(`Delete all ${meta.total} log entries? This action cannot be undone.`)) return;

    bulkDeleteLogs.mutate({ delete_all: true }, {
      onSuccess: (result) => {
        setSelectedIds(new Set());
        setPage(1);
        notifications.show({ message: `Deleted ${result?.deleted_count ?? meta.total} log entries`, color: 'red' });
      },
      onError: () => notifications.show({ message: 'Failed to delete log entries', color: 'red' }),
    });
  };

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
      <Group className="task-log-toolbar" justify="space-between" gap={8}>
        <Group gap={10}>
          <Checkbox
            label="Select page"
            checked={allPageSelected}
            indeterminate={somePageSelected}
            disabled={!visibleIds.length || bulkDeleteLogs.isPending}
            onChange={(event) => togglePage(event.currentTarget.checked)}
          />
          <Text size="sm" c="dimmed">
            {selectedIds.size ? `${selectedIds.size} selected` : `${meta.total || 0} entries`}
          </Text>
        </Group>
        <Group gap={8}>
          <Select
            size="xs"
            w={92}
            value={perPage}
            data={['25', '50', '100']}
            allowDeselect={false}
            onChange={(value) => {
              setPerPage(value || '50');
              setPage(1);
            }}
          />
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconTrash size={14} />}
            disabled={!selectedIds.size}
            loading={bulkDeleteLogs.isPending}
            onClick={deleteSelected}
          >
            Delete selected
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={14} />}
            disabled={!meta.total}
            loading={bulkDeleteLogs.isPending}
            onClick={deleteAll}
          >
            Delete all
          </Button>
        </Group>
      </Group>
      <Stack gap={8} className="task-log-list">
        {logs.length ? logs.map((log) => {
          const meta = KIND_META[log.kind] || KIND_META.note;
          const Icon = meta.icon;
          const isStatusChange = log.kind === 'status_change';
          return (
            <article
              key={log.id}
              className="task-log-entry"
              style={{ cursor: isStatusChange ? 'default' : 'pointer' }}
              onClick={() => !isStatusChange && openLogEditor({ ...log, lockTask: true })}
            >
              <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
                <Checkbox
                  checked={selectedIds.has(log.id)}
                  disabled={bulkDeleteLogs.isPending}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => toggleLog(log.id, event.currentTarget.checked)}
                />
                <Box className={`task-timeline-icon ${meta.color}`}><Icon size={13} /></Box>
                <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                  <Group gap={6} justify="space-between" wrap="nowrap">
                    <Text size="sm" fw={600} truncate>{log.task?.title || 'Task'}</Text>
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{formatDateTime(log.occurred_at)}</Text>
                  </Group>
                  {log.content && (
                    <Text size="sm" c="dimmed" className="task-log-content">
                      {isStatusChange ? describeStatusChange(log.content) : log.content}
                    </Text>
                  )}
                  <Group gap={6}>
                    <Badge size="xs" variant="light" color={meta.color}>{log.kind}</Badge>
                    {log.blocker?.title && (
                      <Badge size="xs" variant="outline" color="orange" leftSection={<IconAlertTriangle size={10} />}>
                        {log.blocker.title}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Group>
            </article>
          );
        }) : (
          <Center h={220}><Text size="sm" c="dimmed">No log entries found</Text></Center>
        )}
      </Stack>
      {meta.last_page > 1 && (
        <Group className="task-log-pagination" justify="center">
          <Pagination
            size="sm"
            value={meta.current_page}
            total={meta.last_page}
            onChange={setPage}
          />
        </Group>
      )}
    </div>
  );
};
