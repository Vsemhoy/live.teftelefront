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
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconTrash, IconX } from '@tabler/icons-react';
import { MdEditor } from '@/shared/components/MdEditor';
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

const MarkdownField = ({ fieldKey, value, onChange, placeholder }) => (
  <MdEditor
    editorKey={fieldKey}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="project-editor-surface md"
    contentEditableClassName="project-editor-contenteditable"
    toolbarClassName="project-editor-toolbar"
  />
);

export const ProjectEditor = () => {
  const { projectEditorOpen, projectEditorParams, closeProjectEditor } = useProjectorStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const saveProject = useSaveProject();
  const deleteProject = useDeleteProject();
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('main');
  const [editorMode, setEditorMode] = useState('md');

  useEffect(() => {
    if (!projectEditorOpen) return;
    setTab('main');
    setEditorMode('md');
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
  const activeTextKey = tab === 'result' ? 'result' : 'description';
  const activePlaceholder = tab === 'result'
    ? 'Outcome, decisions, final notes...'
    : 'Project context, scope, constraints...';

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
    <Modal
      opened={projectEditorOpen}
      onClose={closeProjectEditor}
      withCloseButton={false}
      title={null}
      closeOnClickOutside={false}
      fullScreen={isMobile}
      size={isMobile ? '100%' : '900px'}
      padding={0}
      radius={isMobile ? 0 : 'md'}
      className="project-editor-modal"
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
      <Box className="project-editor-layout">
        <Box className="project-editor-header">
          <TextInput
            placeholder="Project title"
            value={form.title}
            onChange={(event) => patch('title', event.currentTarget.value)}
            size="sm"
            className="project-editor-title"
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
            ]}
            size="xs"
            className="project-editor-view-tabs"
          />

          <Button
            variant="light"
            color="gray"
            size="compact-xs"
            className="project-editor-code-trigger"
            style={{
              outline: `2px solid ${form.color || '#be185d'}`,
              outlineOffset: 1,
            }}
          >
            {(form.code || 'PRJ').slice(0, 3).toUpperCase()}
          </Button>

          <Tooltip label="Close">
            <ActionIcon variant="light" color="gray" onClick={closeProjectEditor}>
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Box>

        <Box className="project-editor-body">
          {tab === 'main' ? (
            <Box className="project-editor-settings-grid">
              <SimpleGrid cols={{ base: 1, sm: 3 }} className="project-editor-wide">
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
              <Select label="Status" value={form.status_id} data={TASK_STATUSES} onChange={(value) => patch('status_id', value || '20')} allowDeselect={false} />
              <Select label="Priority" value={form.priority_id} data={TASK_PRIORITIES} onChange={(value) => patch('priority_id', value || '13')} allowDeselect={false} />
              <TextInput label="Started" type="date" value={form.started_on} onChange={(event) => patch('started_on', event.currentTarget.value)} />
              <TextInput label="Due" type="date" value={form.due_at} onChange={(event) => patch('due_at', event.currentTarget.value)} />
              <Box className="project-editor-flags">
                <Checkbox label="Pinned" checked={form.is_pinned} onChange={(event) => patch('is_pinned', event.currentTarget.checked)} />
                <Checkbox label="Expert only" checked={form.is_expert} onChange={(event) => patch('is_expert', event.currentTarget.checked)} />
                <Checkbox label="Hidden" checked={form.is_hidden} onChange={(event) => patch('is_hidden', event.currentTarget.checked)} />
                <Checkbox label="Show in Tasker" checked={form.show_in_tasker} onChange={(event) => patch('show_in_tasker', event.currentTarget.checked)} />
              </Box>
            </Box>
          ) : editorMode === 'md' ? (
            <MarkdownField
              fieldKey={activeTextKey}
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
              className="project-editor-raw"
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
          )}
        </Box>

        <Box className="project-editor-footer">
          {isMobile ? (
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              onClick={handleDelete}
              loading={deleteProject.isPending}
              disabled={!form.id}
              aria-label="Delete"
            >
              <IconTrash size={16} />
            </ActionIcon>
          ) : (
            <Button
              variant="light"
              color="red"
              onClick={handleDelete}
              loading={deleteProject.isPending}
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
            disabled={tab === 'main'}
            className="project-editor-mode-switch"
          />

          <Group gap="sm" wrap="nowrap" className="project-editor-footer-actions">
            {isMobile ? (
              <>
                <ActionIcon variant="default" size="lg" onClick={closeProjectEditor} aria-label="Close">
                  <IconX size={16} />
                </ActionIcon>
                <ActionIcon onClick={handleSave} loading={saveProject.isPending} size="lg" aria-label="Save" color="pink">
                  <IconDeviceFloppy size={16} />
                </ActionIcon>
              </>
            ) : (
              <>
                <Button variant="default" onClick={closeProjectEditor}>Close</Button>
                <Button color="pink" onClick={handleSave} loading={saveProject.isPending} leftSection={<IconDeviceFloppy size={14} />}>
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
