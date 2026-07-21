import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useDeleteTimerEntry, useSaveTimerEntry } from '../../api/timerApi';
import { useTasks } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { toInputDateTime } from '../../utils/taskerUtils';

const nowInput = () => toInputDateTime(new Date().toISOString());

export const TimeEditor = () => {
  const { timeEditorOpen, timeEditorParams, closeTimeEditor } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'all', include_hidden: true });
  const saveEntry = useSaveTimerEntry();
  const deleteEntry = useDeleteTimerEntry();
  const [form, setForm] = useState({
    task_id: '',
    started_at: '',
    ended_at: '',
    time_type: 'self',
    content: '',
  });

  useEffect(() => {
    if (!timeEditorOpen) return;
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    setForm({
      id: timeEditorParams?.id,
      task_id: timeEditorParams?.task_id || timeEditorParams?.source_id || '',
      started_at: toInputDateTime(timeEditorParams?.started_at) || toInputDateTime(start.toISOString()),
      ended_at: toInputDateTime(timeEditorParams?.ended_at) || nowInput(),
      time_type: timeEditorParams?.time_type || 'self',
      content: timeEditorParams?.content || '',
    });
  }, [timeEditorOpen, timeEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSave = () => {
    if (!form.task_id || !form.started_at || !form.ended_at) {
      notifications.show({ message: 'Task, start and end are required', color: 'red' });
      return;
    }

    saveEntry.mutate({
      id: form.id,
      source_module: 'tasker',
      source_id: form.task_id,
      started_at: form.started_at,
      ended_at: form.ended_at,
      entry_type: 'manual',
      time_type: form.time_type,
      content: form.content,
    }, {
      onSuccess: () => {
        notifications.show({ message: 'Time saved', color: 'blue' });
        closeTimeEditor();
      },
      onError: (error) => notifications.show({
        message: error?.response?.data?.message || 'Could not save time',
        color: 'red',
      }),
    });
  };

  const handleDelete = () => {
    if (!form.id || !window.confirm('Delete this time entry?')) return;
    deleteEntry.mutate(form, {
      onSuccess: () => {
        notifications.show({ message: 'Time entry deleted', color: 'red' });
        closeTimeEditor();
      },
    });
  };

  return (
    <Modal opened={timeEditorOpen} onClose={closeTimeEditor} title={form.id ? 'Edit time session' : 'Add time session'} size="lg">
      <Stack>
        <Select
          label="Task"
          value={form.task_id}
          data={tasks.map((task) => ({ value: task.id, label: task.title }))}
          onChange={(value) => patch('task_id', value || '')}
          searchable
          comboboxProps={{ withinPortal: true }}
        />
        <Group grow align="flex-start">
          <TextInput label="Start" type="datetime-local" value={form.started_at} onChange={(event) => patch('started_at', event.currentTarget.value)} />
          <TextInput label="End" type="datetime-local" value={form.ended_at} onChange={(event) => patch('ended_at', event.currentTarget.value)} />
        </Group>
        <Select
          label="Time type"
          value={form.time_type}
          data={[
            { value: 'self', label: 'Self' },
            { value: 'service', label: 'Service' },
          ]}
          onChange={(value) => patch('time_type', value || 'self')}
          allowDeselect={false}
        />
        <Textarea
          label="What was done in this session"
          description="Saved as a report entry in the task's log"
          value={form.content}
          onChange={(event) => patch('content', event.currentTarget.value)}
          minRows={4}
          autosize
        />
        <Group justify="space-between">
          {form.id ? (
            <Button variant="subtle" color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete} loading={deleteEntry.isPending}>
              Delete
            </Button>
          ) : <div />}
          <Group>
            <Button variant="default" onClick={closeTimeEditor}>Cancel</Button>
            <Button color="blue" onClick={handleSave} loading={saveEntry.isPending}>Save</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
