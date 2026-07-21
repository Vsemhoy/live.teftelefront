import { useEffect, useState } from 'react';
import {
  ActionIcon, Button, Checkbox, Group, Modal, Select, SimpleGrid, Stack, Tabs, Text, TextInput, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import { IconCheck, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
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

const markdownPlugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  diffSourcePlugin({ viewMode: 'rich-text' }),
  toolbarPlugin({
    toolbarClassName: 'task-md-toolbar',
    toolbarContents: () => (
      <>
        <UndoRedo />
        <BoldItalicUnderlineToggles />
        <BlockTypeSelect />
        <CodeToggle />
        <CreateLink />
        <ListsToggle />
      </>
    ),
  }),
];

const MarkdownField = ({ value, onChange, placeholder, editorKey }) => (
  <div className="task-md-editor">
    <MDXEditor
      key={editorKey}
      overlayContainer={typeof document !== 'undefined' ? document.body : undefined}
      markdown={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      contentEditableClassName="task-md-contenteditable"
      plugins={markdownPlugins}
    />
  </div>
);

export const TaskEditor = () => {
  const { taskEditorOpen, taskEditorParams, closeTaskEditor } = useTaskerStore();
  const saveTask = useSaveTask();
  const saveChecklistItem = useSaveTask();
  const deleteChecklistItem = useDeleteTask();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects({ filter: 'all', include_hidden: true });
  const { data: contacts = [] } = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const { data: fullTask } = useTask(taskEditorParams?.id, { include_hidden: true });
  const [form, setForm] = useState(emptyForm);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [loadedFullTaskId, setLoadedFullTaskId] = useState(null);
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState('');

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
    setLoadedFullTaskId(null);
    setEditingChecklistId(null);
    setEditingChecklistTitle('');
  }, [taskEditorOpen, taskEditorParams]);

  useEffect(() => {
    if (!taskEditorOpen || !fullTask?.id || fullTask.id !== taskEditorParams?.id || loadedFullTaskId === fullTask.id) return;
    setForm({
      ...emptyForm,
      ...fullTask,
      priority_id: String(fullTask.priority_id || 13),
      status_id: String(fullTask.status_id || 20),
      due_at: toInputDate(fullTask.due_at),
      project_id: fullTask.project_id || '',
      assignee_contact_id: fullTask.assignee_contact_id || '',
      is_pinned: Boolean(fullTask.is_pinned),
      is_expert: Boolean(fullTask.is_expert),
      is_hidden: Boolean(fullTask.is_hidden),
    });
    setLoadedFullTaskId(fullTask.id);
  }, [taskEditorOpen, taskEditorParams?.id, fullTask, loadedFullTaskId]);

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

  const startEditingChecklistItem = (item) => {
    setEditingChecklistId(item.id);
    setEditingChecklistTitle(item.title || '');
  };

  const cancelEditingChecklistItem = () => {
    setEditingChecklistId(null);
    setEditingChecklistTitle('');
  };

  const handleSaveChecklistTitle = (item) => {
    const title = editingChecklistTitle.trim();
    if (!title) {
      notifications.show({ message: 'Checklist item title is required', color: 'red' });
      return;
    }
    if (title === item.title) {
      cancelEditingChecklistItem();
      return;
    }

    saveChecklistItem.mutate({
      ...item,
      title,
      parent_task_id: form.id,
      project_id: item.project_id || form.project_id || null,
    }, {
      onSuccess: cancelEditingChecklistItem,
      onError: (error) => notifications.show({
        message: error?.response?.data?.message || 'Could not save checklist item',
        color: 'red',
      }),
    });
  };

  const handleDeleteChecklistItem = (item) => {
    if (!window.confirm('Delete this checklist item?')) return;
    deleteChecklistItem.mutate(item, {
      onSuccess: () => notifications.show({ message: 'Checklist item deleted', color: 'red' }),
    });
  };

  return (
    <Modal
      opened={taskEditorOpen}
      onClose={closeTaskEditor}
      title={form.id ? 'Edit task' : 'New task'}
      size="xl"
      classNames={{ content: 'task-editor-modal' }}
    >
      <Tabs defaultValue="main" className="task-editor-tabs">
        <Tabs.List>
          <Tabs.Tab value="main">Task</Tabs.Tab>
          <Tabs.Tab value="description">Description</Tabs.Tab>
          <Tabs.Tab value="result">Result</Tabs.Tab>
          <Tabs.Tab value="checklist">Checklist</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="main" pt="sm">
          <Stack gap="sm">
            <TextInput label="Title" value={form.title} onChange={(event) => patch('title', event.currentTarget.value)} required />
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
            <Group>
              <Checkbox label="Pinned" checked={form.is_pinned} onChange={(event) => patch('is_pinned', event.currentTarget.checked)} />
              <Checkbox label="Expert only" checked={form.is_expert} onChange={(event) => patch('is_expert', event.currentTarget.checked)} />
              <Checkbox label="Hidden" checked={form.is_hidden} onChange={(event) => patch('is_hidden', event.currentTarget.checked)} />
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="description" pt="sm" className="task-md-panel">
          <MarkdownField
            editorKey={`description-${form.id || 'new'}`}
            value={form.description || ''}
            onChange={(value) => patch('description', value)}
            placeholder="Write task description..."
          />
        </Tabs.Panel>

        <Tabs.Panel value="result" pt="sm" className="task-md-panel">
          <MarkdownField
            editorKey={`result-${form.id || 'new'}`}
            value={form.result || ''}
            onChange={(value) => patch('result', value)}
            placeholder="Write outcome, decisions or final notes..."
          />
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
                    const isEditing = editingChecklistId === item.id;
                    return (
                      <Group key={item.id} className={`task-checklist-item ${isDone ? 'is-done' : ''}`} gap="xs" wrap="nowrap">
                        <Checkbox
                          checked={isDone}
                          onChange={(event) => handleToggleChecklistItem(item, event.currentTarget.checked)}
                        />
                        {isEditing ? (
                          <>
                            <TextInput
                              className="task-checklist-title-input"
                              size="xs"
                              value={editingChecklistTitle}
                              onChange={(event) => setEditingChecklistTitle(event.currentTarget.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  handleSaveChecklistTitle(item);
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  cancelEditingChecklistItem();
                                }
                              }}
                              autoFocus
                            />
                            <Tooltip label="Save" withArrow>
                              <ActionIcon variant="subtle" color="green" onClick={() => handleSaveChecklistTitle(item)} loading={saveChecklistItem.isPending}>
                                <IconCheck size={15} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Cancel" withArrow>
                              <ActionIcon variant="subtle" color="gray" onClick={cancelEditingChecklistItem}>
                                <IconX size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Text size="sm" className="task-checklist-title">{item.title}</Text>
                            <Tooltip label="Edit" withArrow>
                              <ActionIcon variant="subtle" color="gray" onClick={() => startEditingChecklistItem(item)}>
                                <IconEdit size={15} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete" withArrow>
                              <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteChecklistItem(item)} loading={deleteChecklistItem.isPending}>
                                <IconTrash size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      </Group>
                    );
                  })}
                </Stack>
              </>
            )}
          </Stack>
        </Tabs.Panel>

        <Group justify="space-between" mt="md">
          {form.id ? (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => {
                if (!window.confirm('Delete this task?')) return;
                deleteTask.mutate(form, {
                  onSuccess: () => {
                    notifications.show({ message: 'Task deleted', color: 'red' });
                    closeTaskEditor();
                  },
                });
              }}
            >
              Delete task
            </Button>
          ) : <div />}
          <Group>
            <Button variant="default" onClick={closeTaskEditor}>Cancel</Button>
            <Button color="blue" onClick={handleSave} loading={saveTask.isPending}>Save</Button>
          </Group>
        </Group>
      </Tabs>
    </Modal>
  );
};
