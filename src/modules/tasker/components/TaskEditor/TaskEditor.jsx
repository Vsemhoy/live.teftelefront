import { useEffect, useState } from 'react';
import {
  ActionIcon, Button, Checkbox, Group, Modal, Select, SimpleGrid, Stack, Tabs, Text, TextInput, Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useContacts } from '@/modules/contactor/api/contactorApi';
import { useProjects } from '@/modules/projector/api/projectorApi';
import { useDeleteTask, useSaveTask, useTask } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { TASK_PRIORITIES, TASK_STATUSES, toInputDate } from '../../utils/taskerUtils';

const emptyForm = {
  title: '',
  description: '',
  result: '',
  priority_id: '13',
  status_id: '20',
  due_at: '',
  project_id: '',
  assignee_contact_id: '',
  is_pinned: false,
  is_expert: false,
  is_hidden: false,
};

export const TaskEditor = () => {
  const { taskEditorOpen, taskEditorParams, closeTaskEditor } = useTaskerStore();
  const saveTask = useSaveTask();
  const saveChecklistItem = useSaveTask();
  const deleteChecklistItem = useDeleteTask();
  const { data: projects = [] } = useProjects({ filter: 'all', include_hidden: true });
  const { data: contacts = [] } = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const { data: fullTask } = useTask(taskEditorParams?.id, { include_hidden: true });
  const [form, setForm] = useState(emptyForm);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  useEffect(() => {
    if (!taskEditorOpen) return;
    setForm({
      ...emptyForm,
      ...taskEditorParams,
      priority_id: String(taskEditorParams?.priority_id || 13),
      status_id: String(taskEditorParams?.status_id || 20),
      due_at: toInputDate(taskEditorParams?.due_at),
      project_id: taskEditorParams?.project_id || '',
      assignee_contact_id: taskEditorParams?.assignee_contact_id || '',
      is_pinned: Boolean(taskEditorParams?.is_pinned),
      is_expert: Boolean(taskEditorParams?.is_expert),
      is_hidden: Boolean(taskEditorParams?.is_hidden),
    });
    setNewChecklistTitle('');
  }, [taskEditorOpen, taskEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const checklistItems = fullTask?.children || [];

  const handleSave = () => {
    if (!form.title.trim()) {
      notifications.show({ message: 'Title is required', color: 'red' });
      return;
    }

    saveTask.mutate({
      ...form,
      title: form.title.trim(),
      priority_id: Number(form.priority_id),
      status_id: Number(form.status_id),
      project_id: form.project_id || null,
      assignee_contact_id: form.assignee_contact_id || null,
      due_at: form.due_at || null,
    }, {
      onSuccess: () => {
        notifications.show({ message: 'Task saved', color: 'blue' });
        closeTaskEditor();
      },
      onError: (error) => notifications.show({
        message: error?.response?.data?.message || 'Could not save task',
        color: 'red',
      }),
    });
  };

  const handleAddChecklistItem = () => {
    const title = newChecklistTitle.trim();
    if (!title || !form.id) return;

    saveChecklistItem.mutate({
      title,
      parent_task_id: form.id,
      project_id: form.project_id || null,
      priority_id: 13,
      status_id: 20,
      sort_order: checklistItems.length,
      is_hidden: form.is_hidden,
      is_expert: form.is_expert,
    }, {
      onSuccess: () => {
        setNewChecklistTitle('');
        notifications.show({ message: 'Checklist item added', color: 'blue' });
      },
      onError: (error) => notifications.show({
        message: error?.response?.data?.message || 'Could not add checklist item',
        color: 'red',
      }),
    });
  };

  const handleToggleChecklistItem = (item, checked) => {
    saveChecklistItem.mutate({
      ...item,
      status_id: checked ? 22 : 20,
      parent_task_id: form.id,
      project_id: item.project_id || form.project_id || null,
    });
  };

  const handleDeleteChecklistItem = (item) => {
    if (!window.confirm('Delete this checklist item?')) return;
    deleteChecklistItem.mutate(item, {
      onSuccess: () => notifications.show({ message: 'Checklist item deleted', color: 'red' }),
    });
  };

  return (
    <Modal opened={taskEditorOpen} onClose={closeTaskEditor} title={form.id ? 'Edit task' : 'New task'} size="lg">
      <Tabs defaultValue="main" className="task-editor-tabs">
        <Tabs.List>
          <Tabs.Tab value="main">Task</Tabs.Tab>
          <Tabs.Tab value="checklist">Checklist</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="main" pt="sm">
          <Stack gap="sm">
            <TextInput label="Title" value={form.title} onChange={(event) => patch('title', event.currentTarget.value)} required />
            <Textarea label="Description" value={form.description || ''} onChange={(event) => patch('description', event.currentTarget.value)} minRows={3} />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select label="Status" value={form.status_id} data={TASK_STATUSES} onChange={(value) => patch('status_id', value || '20')} allowDeselect={false} />
              <Select label="Priority" value={form.priority_id} data={TASK_PRIORITIES} onChange={(value) => patch('priority_id', value || '13')} allowDeselect={false} />
              <TextInput label="Due date" type="date" value={form.due_at} onChange={(event) => patch('due_at', event.currentTarget.value)} />
              <Select
                label="Project"
                value={form.project_id}
                data={[{ value: '', label: 'No project' }, ...projects.map((project) => ({ value: project.id, label: project.title }))]}
                onChange={(value) => patch('project_id', value || '')}
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label="Assignee"
                value={form.assignee_contact_id}
                data={[{ value: '', label: 'Self' }, ...contacts.map((contact) => ({ value: contact.id, label: contact.name }))]}
                onChange={(value) => patch('assignee_contact_id', value || '')}
                comboboxProps={{ withinPortal: true }}
              />
            </SimpleGrid>
            <Textarea label="Result" value={form.result || ''} onChange={(event) => patch('result', event.currentTarget.value)} minRows={2} />
            <Group>
              <Checkbox label="Pinned" checked={form.is_pinned} onChange={(event) => patch('is_pinned', event.currentTarget.checked)} />
              <Checkbox label="Expert only" checked={form.is_expert} onChange={(event) => patch('is_expert', event.currentTarget.checked)} />
              <Checkbox label="Hidden" checked={form.is_hidden} onChange={(event) => patch('is_hidden', event.currentTarget.checked)} />
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="checklist" pt="sm">
          <Stack gap="sm">
            {!form.id && (
              <Text size="sm" c="dimmed">Save the task first to add checklist items.</Text>
            )}
            {form.id && (
              <>
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <TextInput
                    className="task-checklist-input"
                    label="New item"
                    value={newChecklistTitle}
                    onChange={(event) => setNewChecklistTitle(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddChecklistItem}
                    loading={saveChecklistItem.isPending}
                  >
                    Add
                  </Button>
                </Group>

                <Stack gap={6}>
                  {checklistItems.length === 0 && <Text size="sm" c="dimmed">No checklist items yet.</Text>}
                  {checklistItems.map((item) => {
                    const isDone = Number(item.status_id) === 22 || Number(item.status_id) === 24;
                    return (
                      <Group key={item.id} className={`task-checklist-item ${isDone ? 'is-done' : ''}`} gap="xs" wrap="nowrap">
                        <Checkbox
                          checked={isDone}
                          onChange={(event) => handleToggleChecklistItem(item, event.currentTarget.checked)}
                        />
                        <Text size="sm" className="task-checklist-title">{item.title}</Text>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteChecklistItem(item)} loading={deleteChecklistItem.isPending}>
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Group>
                    );
                  })}
                </Stack>
              </>
            )}
          </Stack>
        </Tabs.Panel>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeTaskEditor}>Cancel</Button>
          <Button color="blue" onClick={handleSave} loading={saveTask.isPending}>Save</Button>
        </Group>
      </Tabs>
    </Modal>
  );
};
