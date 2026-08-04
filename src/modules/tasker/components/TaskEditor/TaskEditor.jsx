import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDeviceFloppy, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useContacts } from '@/modules/contactor/api/contactorApi';
import { useProjects } from '@/modules/projector/api/projectorApi';
import { MdEditor } from '@/shared/components/MdEditor';
import {
  useDeleteChecklistItem, useDeleteTask, useSaveChecklistItem, useSaveTask, useTask,
} from '../../api/taskerApi';
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

const MarkdownField = ({ value, onChange, placeholder, editorKey }) => (
  <MdEditor
    editorKey={editorKey}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="task-editor-surface md"
    contentEditableClassName="task-md-contenteditable"
    toolbarClassName="task-md-toolbar"
  />
);

export const TaskEditor = () => {
  const { taskEditorOpen, taskEditorParams, closeTaskEditor } = useTaskerStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const projectFilter = useTaskerStore((state) => state.projectFilter);
  const saveTask = useSaveTask();
  const saveChecklistItem = useSaveChecklistItem();
  const deleteChecklistItem = useDeleteChecklistItem();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects({ filter: 'all', include_hidden: true });
  const { data: contacts = [] } = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const { data: fullTask } = useTask(taskEditorParams?.id, { include_hidden: true });
  const [form, setForm] = useState(emptyForm);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [loadedFullTaskId, setLoadedFullTaskId] = useState(null);
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState('');
  const [tab, setTab] = useState('main');
  const [editorMode, setEditorMode] = useState('md');

  useEffect(() => {
    if (!taskEditorOpen) return;
    // For a new task, preselect the active sidebar project (unless "All projects").
    const isNew = !taskEditorParams?.id;
    const activeProjectId = projectFilter && projectFilter !== 'all' ? projectFilter : '';
    setTab('main');
    setEditorMode('md');
    setForm({
      ...emptyForm,
      ...taskEditorParams,
      priority_id: String(taskEditorParams?.priority_id || 13),
      status_id: String(taskEditorParams?.status_id || 20),
      due_at: toInputDate(taskEditorParams?.due_at),
      project_id: taskEditorParams?.project_id || (isNew ? activeProjectId : ''),
      assignee_contact_id: taskEditorParams?.assignee_contact_id || '',
      is_pinned: Boolean(taskEditorParams?.is_pinned),
      is_expert: Boolean(taskEditorParams?.is_expert),
      is_hidden: Boolean(taskEditorParams?.is_hidden),
    });
    setNewChecklistTitle('');
    setLoadedFullTaskId(null);
    setEditingChecklistId(null);
    setEditingChecklistTitle('');
  }, [taskEditorOpen, taskEditorParams, projectFilter]);

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
  const checklistItems = fullTask?.checklist_items || fullTask?.children || [];
  const activeTextKey = tab === 'result' ? 'result' : 'description';
  const activePlaceholder = tab === 'result'
    ? 'Write outcome, decisions or final notes...'
    : 'Write task description...';

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
      task_id: form.id,
      status_id: 20,
      sort_order: checklistItems.length,
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
    const nextMeta = { ...(item.meta || {}) };
    if (checked) {
      nextMeta.completed_at = new Date().toISOString();
    } else {
      delete nextMeta.completed_at;
    }

    saveChecklistItem.mutate({
      ...item,
      task_id: form.id,
      status_id: checked ? 22 : 20,
      meta: Object.keys(nextMeta).length ? nextMeta : null,
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
      task_id: form.id,
      title,
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

  const handleDeleteTask = () => {
    if (!form.id || !window.confirm('Delete this task?')) return;
    deleteTask.mutate(form, {
      onSuccess: () => {
        notifications.show({ message: 'Task deleted', color: 'red' });
        closeTaskEditor();
      },
    });
  };

  return (
    <Modal
      opened={taskEditorOpen}
      onClose={closeTaskEditor}
      withCloseButton={false}
      title={null}
      closeOnClickOutside={false}
      fullScreen={isMobile}
      size={isMobile ? '100%' : '900px'}
      padding={0}
      radius={isMobile ? 0 : 'md'}
      className="task-editor-modal"
      styles={{
        content: {
          height: isMobile ? '100dvh' : '92vh',
          maxHeight: isMobile ? '100dvh' : '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          padding: 0,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box className="task-editor-layout">
        <Box className="task-editor-header">
          <TextInput
            placeholder="Task title"
            value={form.title}
            onChange={(event) => patch('title', event.currentTarget.value)}
            size="sm"
            className="task-editor-title"
            styles={{ input: { fontWeight: 600 } }}
            required
          />

          <SegmentedControl
            value={tab}
            onChange={setTab}
            data={[
              { label: 'Main', value: 'main' },
              { label: 'Description', value: 'description' },
              { label: 'Result', value: 'result' },
              { label: 'Checklist', value: 'checklist' },
            ]}
            size="xs"
            className="task-editor-view-tabs"
          />

          <Button
            variant="light"
            color="gray"
            size="compact-xs"
            className="task-editor-status-trigger"
          >
            TSK
          </Button>

          <Tooltip label="Close">
            <ActionIcon variant="light" color="gray" onClick={closeTaskEditor}>
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Box>

        <Box className="task-editor-body">
          {tab === 'main' && (
            <Box className="task-editor-settings-grid">
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
            <Box className="task-editor-flags">
              <Checkbox label="Pinned" checked={form.is_pinned} onChange={(event) => patch('is_pinned', event.currentTarget.checked)} />
              <Checkbox label="Expert only" checked={form.is_expert} onChange={(event) => patch('is_expert', event.currentTarget.checked)} />
              <Checkbox label="Hidden" checked={form.is_hidden} onChange={(event) => patch('is_hidden', event.currentTarget.checked)} />
            </Box>
            </Box>
          )}

          {(tab === 'description' || tab === 'result') && (
            editorMode === 'md' ? (
              <MarkdownField
                editorKey={`${activeTextKey}-${form.id || 'new'}`}
                value={form[activeTextKey] || ''}
                onChange={(value) => patch(activeTextKey, value)}
                placeholder={activePlaceholder}
              />
            ) : (
              <Textarea
                value={form[activeTextKey] || ''}
                onChange={(event) => patch(activeTextKey, event.currentTarget.value)}
                placeholder={activePlaceholder}
                autosize={false}
                className="task-editor-raw"
                styles={{
                  root: { height: '100%' },
                  wrapper: { height: '100%' },
                  input: {
                    height: '100%',
                    border: 'none',
                    padding: '14px 16px',
                    borderRadius: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: 13,
                    lineHeight: 1.55,
                  },
                }}
              />
            )
          )}

          {tab === 'checklist' && (
            <Stack gap="sm" className="task-editor-checklist">
            {!form.id && (
              <Text size="sm" c="dimmed">Save the task first to add checklist items.</Text>
            )}
            {form.id && (
              <>
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
                            <Text size="sm" className="task-checklist-title task-checklist-title-text">{item.title}</Text>
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
              </>
            )}
          </Stack>
          )}
        </Box>

        <Box className="task-editor-footer">
          {isMobile ? (
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              onClick={handleDeleteTask}
              loading={deleteTask.isPending}
              disabled={!form.id}
              aria-label="Delete"
            >
              <IconTrash size={16} />
            </ActionIcon>
          ) : (
            <Button
              variant="light"
              color="red"
              onClick={handleDeleteTask}
              loading={deleteTask.isPending}
              disabled={!form.id}
              leftSection={<IconTrash size={14} />}
            >
              Delete
            </Button>
          )}

          <SegmentedControl
            value={editorMode}
            onChange={setEditorMode}
            data={[
              { label: 'MD', value: 'md' },
              { label: 'Raw', value: 'raw' },
            ]}
            size="xs"
            disabled={tab === 'main' || tab === 'checklist'}
            className="task-editor-mode-switch"
          />

          <Group gap="sm" wrap="nowrap" className="task-editor-footer-actions">
            {isMobile ? (
              <>
                <ActionIcon variant="default" size="lg" onClick={closeTaskEditor} aria-label="Close">
                  <IconX size={16} />
                </ActionIcon>
                <ActionIcon onClick={handleSave} loading={saveTask.isPending} size="lg" aria-label="Save" color="blue">
                  <IconDeviceFloppy size={16} />
                </ActionIcon>
              </>
            ) : (
              <>
                <Button variant="default" onClick={closeTaskEditor}>Close</Button>
                <Button color="blue" onClick={handleSave} loading={saveTask.isPending} leftSection={<IconDeviceFloppy size={14} />}>
                  Save
                </Button>
              </>
            )}
          </Group>
        </Box>
      </Box>
    </Modal>
  );
};
