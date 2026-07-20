import { useEffect, useState } from 'react';
import {
  Button, Checkbox, Group, Modal, Select, SimpleGrid, Stack, TextInput, Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDeleteProject, useSaveProject } from '../../api/projectorApi';
import { useProjectorStore } from '../../store/projectorStore';
import { TASK_PRIORITIES, TASK_STATUSES, toInputDate } from '@/modules/tasker/utils/taskerUtils';

const emptyForm = {
  title: '',
  code: '',
  color: '#be185d',
  description: '',
  result: '',
  priority_id: '13',
  status_id: '20',
  started_on: '',
  due_at: '',
  is_pinned: false,
  is_expert: false,
  is_hidden: false,
  show_in_tasker: true,
  sort_order: 0,
};

export const ProjectEditor = () => {
  const { projectEditorOpen, projectEditorParams, closeProjectEditor } = useProjectorStore();
  const saveProject = useSaveProject();
  const deleteProject = useDeleteProject();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!projectEditorOpen) return;
    setForm({
      ...emptyForm,
      ...projectEditorParams,
      code: projectEditorParams?.code || '',
      color: projectEditorParams?.color || '#be185d',
      priority_id: String(projectEditorParams?.priority_id || 13),
      status_id: String(projectEditorParams?.status_id || 20),
      started_on: toInputDate(projectEditorParams?.started_on),
      due_at: toInputDate(projectEditorParams?.due_at),
      is_pinned: Boolean(projectEditorParams?.is_pinned),
      is_expert: Boolean(projectEditorParams?.is_expert),
      is_hidden: Boolean(projectEditorParams?.is_hidden),
      show_in_tasker: projectEditorParams?.show_in_tasker !== false,
      sort_order: Number(projectEditorParams?.sort_order || 0),
    });
  }, [projectEditorOpen, projectEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSave = () => {
    if (!form.title.trim()) {
      notifications.show({ message: 'Title is required', color: 'red' });
      return;
    }
    saveProject.mutate({
      ...form,
      title: form.title.trim(),
      code: form.code.trim().toUpperCase().slice(0, 3),
      color: form.color || null,
      priority_id: Number(form.priority_id),
      status_id: Number(form.status_id),
      started_on: form.started_on || null,
      due_at: form.due_at || null,
      sort_order: Number(form.sort_order || 0),
    }, {
      onSuccess: () => {
        notifications.show({ message: 'Project saved', color: 'pink' });
        closeProjectEditor();
      },
      onError: () => notifications.show({ message: 'Could not save project', color: 'red' }),
    });
  };

  const handleDelete = () => {
    if (!form.id || !window.confirm('Delete this project?')) return;
    deleteProject.mutate(form, {
      onSuccess: () => {
        notifications.show({ message: 'Project deleted', color: 'red' });
        closeProjectEditor();
      },
    });
  };

  return (
    <Modal opened={projectEditorOpen} onClose={closeProjectEditor} title={form.id ? 'Edit project' : 'New project'} size="lg">
      <Stack>
        <TextInput label="Title" value={form.title} onChange={(event) => patch('title', event.currentTarget.value)} required />
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput
            label="Code"
            placeholder="TEF"
            value={form.code}
            maxLength={3}
            onChange={(event) => patch('code', event.currentTarget.value.toUpperCase().slice(0, 3))}
          />
          <TextInput label="Color" type="color" value={form.color} onChange={(event) => patch('color', event.currentTarget.value)} />
          <TextInput label="Sort" type="number" value={form.sort_order} onChange={(event) => patch('sort_order', event.currentTarget.value)} />
        </SimpleGrid>
        <Textarea label="Description" value={form.description || ''} onChange={(event) => patch('description', event.currentTarget.value)} minRows={3} />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Status" value={form.status_id} data={TASK_STATUSES} onChange={(value) => patch('status_id', value || '20')} allowDeselect={false} />
          <Select label="Priority" value={form.priority_id} data={TASK_PRIORITIES} onChange={(value) => patch('priority_id', value || '13')} allowDeselect={false} />
          <TextInput label="Started" type="date" value={form.started_on} onChange={(event) => patch('started_on', event.currentTarget.value)} />
          <TextInput label="Due" type="date" value={form.due_at} onChange={(event) => patch('due_at', event.currentTarget.value)} />
        </SimpleGrid>
        <Textarea label="Result" value={form.result || ''} onChange={(event) => patch('result', event.currentTarget.value)} minRows={2} />
        <Group>
          <Checkbox label="Pinned" checked={form.is_pinned} onChange={(event) => patch('is_pinned', event.currentTarget.checked)} />
          <Checkbox label="Expert only" checked={form.is_expert} onChange={(event) => patch('is_expert', event.currentTarget.checked)} />
          <Checkbox label="Hidden" checked={form.is_hidden} onChange={(event) => patch('is_hidden', event.currentTarget.checked)} />
          <Checkbox label="Show in Tasker" checked={form.show_in_tasker} onChange={(event) => patch('show_in_tasker', event.currentTarget.checked)} />
        </Group>
        <Group justify="space-between">
          <div>
            {form.id && <Button variant="subtle" color="red" onClick={handleDelete} loading={deleteProject.isPending}>Delete</Button>}
          </div>
          <Group>
            <Button variant="default" onClick={closeProjectEditor}>Cancel</Button>
            <Button color="pink" onClick={handleSave} loading={saveProject.isPending}>Save</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
