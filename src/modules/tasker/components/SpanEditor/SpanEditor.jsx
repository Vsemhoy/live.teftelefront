import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useDeleteTaskSpan, useSaveTaskSpan, useTasks } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { toInputDateTime } from '../../utils/taskerUtils';

const nowISO = () => new Date().toISOString();
const hourAgoISO = () => new Date(Date.now() - 3600 * 1000).toISOString();

export const SpanEditor = () => {
  const { timeEditorOpen, timeEditorParams, closeTimeEditor } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'all', include_hidden: true });
  const saveSpan = useSaveTaskSpan();
  const deleteSpan = useDeleteTaskSpan();

  const [form, setForm] = useState({
    id: null,
    task_id: '',
    kind: 'fact',
    title: '',
    content: '',
    planned_start_at: '',
    planned_end_at: '',
    started_at: '',
    ended_at: '',
  });

  useEffect(() => {
    if (!timeEditorOpen) return;
    const p = timeEditorParams || {};
    const isFact = !p.kind || p.kind === 'fact';
    setForm({
      id: p.id || null,
      task_id: p.task_id || p.source_id || '',
      kind: p.kind || 'fact',
      title: p.title || '',
      content: p.content || '',
      planned_start_at: toInputDateTime(p.planned_start_at) || (isFact ? '' : toInputDateTime(hourAgoISO())),
      planned_end_at: toInputDateTime(p.planned_end_at) || (isFact ? '' : toInputDateTime(nowISO())),
      started_at: toInputDateTime(p.started_at) || (isFact ? toInputDateTime(hourAgoISO()) : ''),
      ended_at: toInputDateTime(p.ended_at) || (isFact && p.id ? '' : isFact ? toInputDateTime(nowISO()) : ''),
    });
  }, [timeEditorOpen, timeEditorParams]);

  const patch = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const isFact = form.kind === 'fact';

  const handleSave = () => {
    if (!form.task_id) {
      notifications.show({ message: 'Select a task', color: 'red' });
      return;
    }

    const payload = {
      id: form.id,
      task_id: form.task_id,
      kind: form.kind,
      title: form.title.trim() || null,
      content: form.content.trim() || null,
    };

    if (isFact) {
      if (!form.started_at) {
        notifications.show({ message: 'Set the start time', color: 'red' });
        return;
      }
      payload.started_at = form.started_at;
      payload.ended_at = form.ended_at || null;
    } else {
      if (!form.planned_start_at || !form.planned_end_at) {
        notifications.show({ message: 'Set the plan start and end', color: 'red' });
        return;
      }
      payload.planned_start_at = form.planned_start_at;
      payload.planned_end_at = form.planned_end_at;
    }

    saveSpan.mutate(payload, {
      onSuccess: () => {
        notifications.show({ message: 'Span saved', color: 'blue' });
        closeTimeEditor();
      },
      onError: (error) => notifications.show({
        message: error?.response?.data?.message || 'Could not save span',
        color: 'red',
      }),
    });
  };

  const handleDelete = () => {
    if (!form.id || !window.confirm('Delete this span?')) return;
    deleteSpan.mutate({ id: form.id, task_id: form.task_id }, {
      onSuccess: () => {
        notifications.show({ message: 'Span deleted', color: 'red' });
        closeTimeEditor();
      },
    });
  };

  const taskTitle = tasks.find((t) => t.id === form.task_id)?.title;

  return (
    <Modal
      opened={timeEditorOpen}
      onClose={closeTimeEditor}
      title={form.id ? 'Edit span' : 'Add span'}
      size="md"
    >
      <Stack gap="sm">
        {timeEditorParams?.lockTask ? (
          <div>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={2}>Task</Text>
            <Text size="sm" fw={600}>{taskTitle}</Text>
          </div>
        ) : (
          <Select
            label="Task"
            value={form.task_id}
            data={tasks.map((t) => ({ value: t.id, label: t.title }))}
            onChange={(v) => patch('task_id', v || '')}
            searchable
            comboboxProps={{ withinPortal: true }}
          />
        )}

        <Select
          label="Type"
          value={form.kind}
          data={[
            { value: 'fact', label: 'Fact (tracking)' },
            { value: 'plan', label: 'Plan (schedule)' },
          ]}
          onChange={(v) => patch('kind', v || 'fact')}
          allowDeselect={false}
        />

        <TextInput
          label={isFact ? 'Session title' : 'Slot title'}
          placeholder={isFact ? 'Diagnostics, config cleanup...' : 'Planned work...'}
          value={form.title}
          onChange={(e) => patch('title', e.currentTarget.value)}
        />

        {isFact ? (
          <Group grow align="flex-start">
            <TextInput
              label="Start"
              type="datetime-local"
              value={form.started_at}
              onChange={(e) => patch('started_at', e.currentTarget.value)}
            />
            <TextInput
              label="End"
              type="datetime-local"
              value={form.ended_at}
              onChange={(e) => patch('ended_at', e.currentTarget.value)}
              description={!form.ended_at ? 'Empty means still running' : ''}
            />
          </Group>
        ) : (
          <Group grow align="flex-start">
            <TextInput
              label="Plan start"
              type="datetime-local"
              value={form.planned_start_at}
              onChange={(e) => patch('planned_start_at', e.currentTarget.value)}
            />
            <TextInput
              label="Plan end"
              type="datetime-local"
              value={form.planned_end_at}
              onChange={(e) => patch('planned_end_at', e.currentTarget.value)}
            />
          </Group>
        )}

        {isFact && (
          <Textarea
            label="Details / result"
            placeholder="What exactly was done, what you found, what changed..."
            value={form.content}
            onChange={(e) => patch('content', e.currentTarget.value)}
            minRows={3}
            autosize
          />
        )}

        <Group justify="space-between" mt={4}>
          {form.id ? (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              leftSection={<IconTrash size={14} />}
              onClick={handleDelete}
              loading={deleteSpan.isPending}
            >
              Delete
            </Button>
          ) : <div />}
          <Group>
            <Button variant="default" onClick={closeTimeEditor}>Cancel</Button>
            <Button color="blue" onClick={handleSave} loading={saveSpan.isPending}>Save</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
