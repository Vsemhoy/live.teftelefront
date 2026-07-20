import { Badge, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTaskLogs } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { formatDateTime } from '../../utils/taskerUtils';

export const LogView = () => {
  const { data: logs = [], isLoading } = useTaskLogs({ limit: 300 });
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
      <Stack gap={8} className="task-log-list">
        <Group justify="flex-end">
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => openLogEditor()}>
            Log
          </Button>
        </Group>
        {logs.length ? logs.map((log) => (
          <article key={log.id} className="task-log-entry">
            <Group justify="space-between" align="flex-start" gap={8}>
              <Stack gap={2}>
                <Group gap={6}>
                  <Badge size="xs" variant="light" color={log.kind === 'blocker' ? 'orange' : 'blue'}>{log.kind}</Badge>
                  <Text size="xs" c="dimmed">{formatDateTime(log.occurred_at)}</Text>
                </Group>
                <Text size="sm" fw={600}>{log.task?.title || 'Task'}</Text>
              </Stack>
            </Group>
            {log.content && <Text size="sm" c="dimmed" className="task-log-content">{log.content}</Text>}
          </article>
        )) : (
          <Center h={220}><Text size="sm" c="dimmed">No log entries found</Text></Center>
        )}
      </Stack>
    </div>
  );
};
