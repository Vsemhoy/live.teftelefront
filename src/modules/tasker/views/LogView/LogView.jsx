import { Badge, Box, Center, Group, Loader, Stack, Text } from '@mantine/core';
import {
  IconAlertTriangle, IconArrowsExchange, IconFileText, IconMessageCircle, IconNote,
} from '@tabler/icons-react';
import { useTaskLogs } from '../../api/taskerApi';
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
  const { data: logs = [], isLoading } = useTaskLogs({ limit: 300 });
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
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
    </div>
  );
};
