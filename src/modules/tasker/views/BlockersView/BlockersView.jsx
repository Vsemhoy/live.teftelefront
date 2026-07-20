import { Button, Center, Group, Loader, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useBlockers, useSaveBlocker } from '../../api/taskerApi';

export const BlockersView = () => {
  const { data: blockers = [], isLoading } = useBlockers();
  const saveBlocker = useSaveBlocker();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    saveBlocker.mutate({ title: title.trim(), description }, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        notifications.show({ message: 'Blocker saved', color: 'orange' });
      },
    });
  };

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
      <div className="tasker-two-col">
        <Stack gap={8}>
          {blockers.length ? blockers.map((blocker) => (
            <article key={blocker.id} className="task-log-entry">
              <Group justify="space-between">
                <Text size="sm" fw={650}>{blocker.title}</Text>
                <Text size="xs" c="dimmed">{blocker.occurrence_count} hits</Text>
              </Group>
              {blocker.description && <Text size="xs" c="dimmed">{blocker.description}</Text>}
            </article>
          )) : <Center h={220}><Text size="sm" c="dimmed">No blockers found</Text></Center>}
        </Stack>
        <Stack gap="sm" className="tasker-side-panel">
          <Text size="sm" fw={650}>New blocker</Text>
          <TextInput label="Title" value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
          <Textarea label="Description" value={description} onChange={(event) => setDescription(event.currentTarget.value)} minRows={4} />
          <Button color="orange" variant="light" onClick={handleSave} loading={saveBlocker.isPending}>Save</Button>
        </Stack>
      </div>
    </div>
  );
};
