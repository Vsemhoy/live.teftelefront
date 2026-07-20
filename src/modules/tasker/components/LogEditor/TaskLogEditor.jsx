import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTasks, useSaveTaskLog } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { LOG_KINDS } from '../../utils/taskerUtils';

export const TaskLogEditor = () => {
  const { logEditorOpen, logEditorParams, closeLogEditor } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'all', include_hidden: true });
  const saveLog = useSaveTaskLog();
  const [form, setForm] = useState({ task_id: '', kind: 'note', content: '' });

  useEffect(() => {
    if (!logEditorOpen) return;
    setForm({
      id: logEditorParams?.id,
      task_id: logEditorParams?.task_id || '',
      kind: logEditorParams?.kind || 'note',
      content: logEditorParams?.content || '',
    });
  }, [logEditorOpen, logEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

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

  return (
    <Modal opened={logEditorOpen} onClose={closeLogEditor} title="Task log" size="lg">
      <Stack>
        <Select
          label="Task"
          value={form.task_id}
          data={tasks.map((task) => ({ value: task.id, label: task.title }))}
          onChange={(value) => patch('task_id', value || '')}
          searchable
          comboboxProps={{ withinPortal: true }}
        />
        <Select label="Kind" value={form.kind} data={LOG_KINDS} onChange={(value) => patch('kind', value || 'note')} allowDeselect={false} />
        <Textarea label="Content" value={form.content} onChange={(event) => patch('content', event.currentTarget.value)} minRows={5} />
        <Group justify="flex-end">
          <Button variant="default" onClick={closeLogEditor}>Cancel</Button>
          <Button color="blue" onClick={handleSave} loading={saveLog.isPending}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
