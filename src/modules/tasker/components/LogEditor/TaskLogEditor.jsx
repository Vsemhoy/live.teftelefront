import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useBlockers, useDeleteTaskLog, useTasks, useSaveTaskLog } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { LOG_KINDS } from '../../utils/taskerUtils';

export const TaskLogEditor = () => {
  const { logEditorOpen, logEditorParams, closeLogEditor } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'all', include_hidden: true });
  const { data: blockers = [] } = useBlockers();
  const saveLog = useSaveTaskLog();
  const deleteLog = useDeleteTaskLog();
  const [form, setForm] = useState({ task_id: '', kind: 'note', content: '', blocker_id: '' });

  useEffect(() => {
    if (!logEditorOpen) return;
    setForm({
      id: logEditorParams?.id,
      task_id: logEditorParams?.task_id || '',
      kind: logEditorParams?.kind || 'note',
      content: logEditorParams?.content || '',
      blocker_id: logEditorParams?.blocker_id || '',
    });
  }, [logEditorOpen, logEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const taskLocked = Boolean(logEditorParams?.lockTask);
  const lockedTaskTitle = tasks.find((task) => task.id === form.task_id)?.title;

  const handleSave = () => {
    if (!form.task_id || !form.content.trim()) {
      notifications.show({ message: 'Task and content are required', color: 'red' });
      return;
    }
    saveLog.mutate(form, {
      onSuccess: () => {
        notifications.show({ message: 'Log saved', color: 'blue' });
        closeLogEditor();
      },
    });
  };

  const handleDelete = () => {
    if (!form.id || !window.confirm('Delete this log entry?')) return;
    deleteLog.mutate(form, {
      onSuccess: () => {
        notifications.show({ message: 'Log entry deleted', color: 'red' });
        closeLogEditor();
      },
    });
  };

  return (
    <Modal opened={logEditorOpen} onClose={closeLogEditor} title={form.id ? 'Edit log entry' : 'Add log entry'} size="lg">
      <Stack>
        {taskLocked ? (
          <div>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={2}>Task</Text>
            <Text size="sm" fw={600}>{lockedTaskTitle}</Text>
          </div>
        ) : (
          <Select
            label="Task"
            value={form.task_id}
            data={tasks.map((task) => ({ value: task.id, label: task.title }))}
            onChange={(value) => patch('task_id', value || '')}
            searchable
            comboboxProps={{ withinPortal: true }}
          />
        )}
        <Select label="Kind" value={form.kind} data={LOG_KINDS} onChange={(value) => patch('kind', value || 'note')} allowDeselect={false} />
        {form.kind === 'blocker' && (
          <Select
            label="Known blocker"
            placeholder="Link a recurring issue (optional)"
            value={form.blocker_id}
            data={blockers.map((blocker) => ({ value: blocker.id, label: `${blocker.title} | seen ${blocker.occurrence_count}x` }))}
            onChange={(value) => patch('blocker_id', value || '')}
            searchable
            clearable
            comboboxProps={{ withinPortal: true }}
          />
        )}
        <Textarea label="Content" value={form.content} onChange={(event) => patch('content', event.currentTarget.value)} minRows={5} autosize />
        <Group justify="space-between">
          {form.id ? (
            <Button variant="subtle" color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete} loading={deleteLog.isPending}>
              Delete
            </Button>
          ) : <div />}
          <Group>
            <Button variant="default" onClick={closeLogEditor}>Cancel</Button>
            <Button color="blue" onClick={handleSave} loading={saveLog.isPending}>Save</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
