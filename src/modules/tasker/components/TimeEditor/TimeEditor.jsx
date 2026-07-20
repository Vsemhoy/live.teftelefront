import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSaveTimerEntry } from '../../api/timerApi';
import { useTasks } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { toInputDateTime } from '../../utils/taskerUtils';

const nowInput = () => toInputDateTime(new Date().toISOString());

export const TimeEditor = () => {
  const { timeEditorOpen, timeEditorParams, closeTimeEditor } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'all', include_hidden: true });
  const saveEntry = useSaveTimerEntry();
  const [form, setForm] = useState({
    task_id: '',
    started_at: '',
    ended_at: '',
    time_type: 'self',
    note: '',
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
      note: timeEditorParams?.note || '',
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
      note: form.note,
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

  return (
    <Modal opened={timeEditorOpen} onClose={closeTimeEditor} title={form.id ? 'Edit time' : 'Add time'} size="lg">
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
        <Textarea label="Note" value={form.note} onChange={(event) => patch('note', event.currentTarget.value)} minRows={2} />
        <Textarea label="Session report" value={form.content} onChange={(event) => patch('content', event.currentTarget.value)} minRows={4} />
        <Group justify="flex-end">
          <Button variant="default" onClick={closeTimeEditor}>Cancel</Button>
          <Button color="blue" onClick={handleSave} loading={saveEntry.isPending}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
