import { ActionIcon, Badge, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDeleteTimerEntry, useTimerEntries } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { formatDateTime, formatDuration } from '../../utils/taskerUtils';

export const TimeView = () => {
  const { data: entries = [], isLoading } = useTimerEntries({ source_module: 'tasker', completed_only: true, limit: 300 });
  const openTimeEditor = useTaskerStore((state) => state.openTimeEditor);
  const deleteEntry = useDeleteTimerEntry();

  const handleDelete = (entry) => {
    if (!window.confirm('Delete this time entry?')) return;
    deleteEntry.mutate(entry, {
      onSuccess: () => notifications.show({ message: 'Time entry deleted', color: 'red' }),
    });
  };

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
      <Stack gap={8}>
        <Group justify="flex-end">
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => openTimeEditor()}>
            Time
          </Button>
        </Group>
        {entries.length ? entries.map((entry) => (
          <article key={entry.id} className="task-time-entry" onDoubleClick={() => openTimeEditor(entry)}>
            <Group justify="space-between" gap={8} align="flex-start">
              <Stack gap={3}>
                <Group gap={6}>
                  <Badge size="xs" variant="light">{entry.entry_type}</Badge>
                  <Text size="xs" c="dimmed">{formatDateTime(entry.started_at)} - {formatDateTime(entry.ended_at)}</Text>
                </Group>
                <Text size="sm" fw={600}>{entry.source?.title || 'Task time'}</Text>
                {entry.content && <Text size="sm" c="gray.7" lineClamp={2}>{entry.content}</Text>}
                {entry.note && <Text size="xs" c="dimmed" fs="italic">{entry.note}</Text>}
              </Stack>
              <Group gap={8}>
                <Text size="sm" fw={700}>{formatDuration(entry.elapsed_seconds || entry.duration_min * 60)}</Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(entry);
                  }}
                  onDoubleClick={(event) => event.stopPropagation()}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </article>
        )) : (
          <Center h={220}><Text size="sm" c="dimmed">No time entries found</Text></Center>
        )}
      </Stack>
    </div>
  );
};
