import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Text,
  Alert,
  Tooltip,
  ActionIcon,
  Box,
  Center,
  SegmentedControl,
  Menu,
  Textarea,
  Switch,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  BlockTypeSelect,
  CodeToggle,
  InsertCodeBlock,
  InsertTable,
  ListsToggle,
  CreateLink,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
} from '@mdxeditor/editor';
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconTrash,
  IconWifiOff,
  IconX,
  IconPhoto,
  IconChartBar,
  IconPalette,
  IconCheck,
  IconCircleDashed,
  IconCalendarEvent,
  IconBolt,
  IconNote,
  IconCheckbox,
  IconInfoCircle,
  IconFileText,
  IconLock,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

import { useEventorStore } from '../../store/eventorStore';
import {
  useSections,
  useEventTypes,
  useSaveEvent,
  useEvent,
  useDeleteEvent,
  useTags,
} from '../../api/eventorApi';
import { TagSelect } from '../TagSelect/TagSelect';
import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { createDraft, updateDraft, deleteDraft } from '@/shared/utils/db';

const DEFAULT_CONTENT = '';

const shortTypeCode = (label) => {
  if (!label) return 'NONE';
  const letters = String(label).replace(/[^A-Za-z]/g, '').toUpperCase();
  return (letters.slice(0, 3) || 'ACT');
};

const toTimeString = (value) => {
  const date = value ? dayjs(value) : dayjs();
  return date.isValid() ? date.format('HH:mm') : '09:00';
};

const composeDateTime = (dateValue, timeValue) => {
  const date = dayjs(dateValue || new Date());
  const [h, m] = String(timeValue || '09:00').split(':').map(Number);
  return date.hour(Number.isFinite(h) ? h : 9).minute(Number.isFinite(m) ? m : 0).second(0);
};

// Маппинг icon-строки (Tabler) → компонент иконки
const TYPE_ICON_MAP = {
  'calendar-event': IconCalendarEvent,
  'bolt':           IconBolt,
  'pencil':         IconNote,
  'checklist':      IconCheckbox,
  'book-2':         IconFileText,
  'info-circle':    IconInfoCircle,
  'dashboard':      IconLayoutDashboard,
};

const getTypeIconBySlug = (slug) => TYPE_ICON_MAP[slug] || IconCircleDashed;

// Оставляем для обратной совместимости (fallback по label)
const getTypeIcon = (label) => {
  const key = String(label || '').trim().toLowerCase();
  if (!key || key === 'без типа' || key === 'none') return IconCircleDashed;
  if (key.includes('event')    || key.includes('событ'))  return IconCalendarEvent;
  if (key.includes('action')   || key.includes('действ')) return IconBolt;
  if (key.includes('note')     || key.includes('замет'))  return IconNote;
  if (key.includes('task')     || key.includes('задач'))  return IconCheckbox;
  if (key.includes('info')     || key.includes('инфо'))   return IconInfoCircle;
  if (key.includes('synopsis') || key.includes('опис'))   return IconFileText;
  return IconCircleDashed;
};

export const EventEditor = () => {
  const { editorOpen, editorData, closeEditor } = useEventorStore();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: sections } = useSections();
  const { data: types } = useEventTypes();
  const { mutateAsync: saveEvent, isPending: isSaving } = useSaveEvent();
  const { mutateAsync: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { data: existingEvent, isLoading: isEventLoading } = useEvent(editorData?.id);

  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [setdate, setSetdate] = useState(new Date());
  const [setTime, setSetTime] = useState('09:00');
  const [sectionId, setSectionId] = useState(null);
  const [typeId, setTypeId] = useState(null);

  const [tab, setTab] = useState('editor');
  const [editorMode, setEditorMode] = useState('md');
  const [editorKey, setEditorKey] = useState(0);

  const [tagIds, setTagIds] = useState([]);
  const [project, setProject] = useState('');
  const [access, setAccess] = useState('private');
  const [comments, setComments] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorOpen) return;

    const draftSrc = editorData?._draftData;
    const serverId = editorData?.id;

    if (draftSrc) {
      setName(draftSrc.name || '');
      setContent(draftSrc.content || DEFAULT_CONTENT);
      const srcDate = draftSrc.setdate ? new Date(draftSrc.setdate) : new Date();
      setSetdate(srcDate);
      setSetTime(toTimeString(srcDate));
      setSectionId(draftSrc.section_id || null);
      setTypeId(draftSrc.type_id || null);
      setTagIds(Array.isArray(draftSrc.tag_ids) ? draftSrc.tag_ids : []);
      setProject(draftSrc.project || '');
      setAccess(draftSrc.access || 'private');
      setComments(draftSrc.comments || '');
      setIsLocked(Boolean(draftSrc.is_locked));
      setIsPinned(Boolean(draftSrc.is_pinned));
      setIsBlurred(Boolean(draftSrc.is_blurred));
    } else if (serverId) {
      if (!existingEvent) return;
      setName(existingEvent.name || '');
      setContent(existingEvent.content || DEFAULT_CONTENT);
      const srcDate = existingEvent.setdate ? new Date(existingEvent.setdate) : new Date();
      setSetdate(srcDate);
      setSetTime(toTimeString(srcDate));
      setSectionId(existingEvent.section_id || null);
      setTypeId(existingEvent.type_id || null);
      setTagIds((existingEvent.tags || []).map((t) => t.id));
      setProject(existingEvent.project || '');
      setAccess(existingEvent.access || 'private');
      setComments(existingEvent.comments || '');
      setIsLocked(Boolean(existingEvent.is_locked));
      setIsPinned(Boolean(existingEvent.is_pinned));
      setIsBlurred(Boolean(existingEvent.is_blurred));
    } else {
      const initialDate = editorData?.date ? new Date(editorData.date) : new Date();
      setName('');
      setContent(DEFAULT_CONTENT);
      setSetdate(initialDate);
      setSetTime(toTimeString(initialDate));
      setSectionId(
        editorData?.section_id && editorData.section_id !== 'ALL'
          ? editorData.section_id
          : null
      );
      setTypeId(null);
      setTagIds([]);
      setProject('');
      setAccess('private');
      setComments('');
      setIsLocked(false);
      setIsPinned(false);
      setIsBlurred(false);
    }

    setTab('editor');
    setEditorMode('md');
    setEditorKey((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorOpen, editorData?.id, editorData?.draftLocalId, editorData?._draftData, existingEvent]);

  const handleSave = async () => {
    const dateWithTime = composeDateTime(setdate, setTime);

    const basePayload = {
      id: editorData?.id || null,
      name,
      content,
      setdate: dateWithTime.format('YYYY-MM-DD HH:mm:ss'),
      section_id: sectionId,
      type_id: typeId,
    };

    const localMeta = {
      tag_ids: tagIds,
      project,
      access,
      comments,
      is_locked: isLocked,
      is_pinned: isPinned,
      is_blurred: isBlurred,
    };

    const fullPayload = { ...basePayload, ...localMeta };

    if (!isOnline || !user) {
      try {
        const offlinePayload = { ...fullPayload, syncStatus: 'pending' };
        if (editorData?.draftLocalId) {
          await updateDraft(editorData.draftLocalId, offlinePayload);
        } else {
          await createDraft(offlinePayload);
        }
        notifications.show({
          title: 'Saved as draft',
          message: isOnline ? 'Sign in to sync to server' : 'No connection, saved locally',
          color: 'orange',
          icon: <IconWifiOff size={16} />,
        });
        closeEditor();
      } catch (err) {
        notifications.show({ title: 'Error', message: err.message, color: 'red' });
      }
      return;
    }

    try {
      await saveEvent(fullPayload);
      notifications.show({
        title: editorData?.id ? 'Updated' : 'Created',
        message: name || 'Event saved',
        color: 'green',
        icon: <IconDeviceFloppy size={16} />,
      });
      closeEditor();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      notifications.show({
        title: 'Server error, saved as draft',
        message: msg,
        color: 'orange',
      });
      await createDraft({ ...fullPayload, syncStatus: 'error', errorMsg: msg });
      closeEditor();
    }
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm('Are you sure? This action is irreversible.');
    if (!isConfirmed) return;

    try {
      if (editorData?.id && isOnline && user) {
        await deleteEvent(editorData.id);
        notifications.show({ title: 'Deleted', message: 'Event removed', color: 'red' });
      } else if (editorData?.draftLocalId) {
        await deleteDraft(editorData.draftLocalId);
        notifications.show({ title: 'Deleted', message: 'Draft removed', color: 'red' });
      } else {
        notifications.show({ title: 'Nothing to delete', message: 'Current item is not saved yet', color: 'gray' });
      }
      closeEditor();
    } catch (err) {
      notifications.show({ title: 'Delete failed', message: err.message, color: 'red' });
    }
  };

  const sectionOptions = [
    { value: '', label: 'No section' },
    ...(sections?.map((s) => ({ value: s.id, label: s.name })) || []),
  ];

  const typeOptions =
    types?.map((t) => ({
      value:   t.id,
      label:   t.name,
      icon:    t.icon || null,
      color:   t.color || null,
      bgcolor: t.bgcolor || null,
    })) || [];

  const activeType     = typeOptions.find((t) => t.value === typeId);
  const activeTypeCode = shortTypeCode(activeType?.label);
  const ActiveTypeIcon = activeType?.icon
    ? getTypeIconBySlug(activeType.icon)
    : getTypeIcon(activeType?.label || '');

  const isLoadingEdit = Boolean(editorData?.id && isEventLoading && !existingEvent);
  const isReadOnly = Boolean(editorData?.id && existingEvent?.is_locked);
  const saveLabel = !isOnline || !user ? 'Save draft' : 'Save';

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      withCloseButton={false}
      title={null}
      closeOnClickOutside={false}
      fullScreen={isMobile}
      size={isMobile ? '100%' : '90vw'}
      padding={0}
      radius={isMobile ? 0 : 'md'}
      className="event-editor-modal"
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
      {isLoadingEdit ? (
        <Center style={{ flex: 1 }}>
          <Text size="sm" c="dimmed">Loading event...</Text>
        </Center>
      ) : (
        <Box className="event-editor-layout">
          <Box className="event-editor-header">
            <TextInput
              placeholder="Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="sm"
              className="event-editor-title"
              styles={{ input: { fontWeight: 600 } }}
            />

            <SegmentedControl
              value={tab}
              onChange={setTab}
              data={[
                { label: 'Editor', value: 'editor' },
                { label: 'Settings', value: 'settings' },
              ]}
              size="xs"
              className="event-editor-view-tabs"
            />

            <Menu width={220} withArrow position="bottom-end">
              <Menu.Target>
                <Button
                  variant="light"
                  color="gray"
                  size="compact-xs"
                  className="event-editor-type-trigger"
                  style={{
                    outline: `2px solid ${activeType?.color || '#999999'}`,
                    outlineOffset: 1,
                  }}
                >
                  <ActiveTypeIcon size={14} />
                  {activeTypeCode}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Record type</Menu.Label>
                <Menu.Item onClick={() => setTypeId(null)} leftSection={!typeId ? <IconCheck size={14} /> : null}>
                  <Group gap={8} wrap="nowrap">
                    <IconCircleDashed size={14} />
                    <span>Без типа</span>
                  </Group>
                </Menu.Item>
                {typeOptions.map((option) => (
                  <Menu.Item
                    key={option.value}
                    onClick={() => setTypeId(option.value)}
                    leftSection={typeId === option.value ? <IconCheck size={14} /> : null}
                  >
                    <Group gap={8} wrap="nowrap">
                      {(() => {
                        const TypeIcon = option.icon
                          ? getTypeIconBySlug(option.icon)
                          : getTypeIcon(option.label);
                        return <TypeIcon size={14} />;
                      })()}
                      <span>{option.label}</span>
                    </Group>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Tooltip label="Close">
              <ActionIcon variant="light" color="gray" onClick={closeEditor}>
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Box>

          {(!isOnline || !user) && (
            <Alert
              className="event-editor-alert"
              icon={!isOnline ? <IconWifiOff size={14} /> : <IconAlertCircle size={14} />}
              color="orange"
              variant="light"
              py={6}
              px={10}
              radius="sm"
            >
              <Text size="xs">
                {!isOnline
                  ? 'No connection. Event will be saved as a local draft.'
                  : 'You are not signed in. Event will be saved as a local draft.'}
              </Text>
            </Alert>
          )}

          {isReadOnly && (
            <Alert
              className="event-editor-alert"
              icon={<IconLock size={14} />}
              color="gray"
              variant="light"
              py={6}
              px={10}
              radius="sm"
            >
              <Text size="xs">This event is locked and cannot be edited. Unlock it in settings to make changes.</Text>
            </Alert>
          )}

          <Box className="event-editor-body">
            {tab === 'editor' ? (
              <Box className={`event-editor-surface ${editorMode === 'raw' ? 'raw' : 'md'}`}>
                {editorMode === 'md' ? (
                  <MDXEditor
                    key={editorKey}
                    ref={editorRef}
                    markdown={content}
                    onChange={setContent}
                    placeholder="Write your content..."
                    contentEditableClassName="event-editor-contenteditable"
                    plugins={[
                      headingsPlugin(),
                      listsPlugin(),
                      quotePlugin(),
                      thematicBreakPlugin(),
                      markdownShortcutPlugin(),
                      linkPlugin(),
                      linkDialogPlugin(),
                      tablePlugin(),
                      codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                      codeMirrorPlugin({
                        codeBlockLanguages: {
                          js: 'JavaScript',
                          ts: 'TypeScript',
                          jsx: 'JSX',
                          tsx: 'TSX',
                          py: 'Python',
                          php: 'PHP',
                          java: 'Java',
                          cs: 'C#',
                          cpp: 'C++',
                          go: 'Go',
                          rust: 'Rust',
                          sql: 'SQL',
                          html: 'HTML',
                          css: 'CSS',
                          json: 'JSON',
                          md: 'Markdown',
                          bash: 'Bash',
                          sh: 'Shell',
                          yaml: 'YAML',
                          xml: 'XML',
                        },
                      }),
                      diffSourcePlugin({ viewMode: 'rich-text' }),
                      toolbarPlugin({
                        toolbarClassName: 'event-editor-toolbar',
                        toolbarContents: () => (
                          <>
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <BlockTypeSelect />
                            <CodeToggle />
                            <CreateLink />
                            <ActionIcon size="sm" variant="subtle" color="gray" disabled>
                              <IconPhoto size={14} />
                            </ActionIcon>
                            <InsertTable />
                            <ActionIcon size="sm" variant="subtle" color="gray" disabled>
                              <IconChartBar size={14} />
                            </ActionIcon>
                            <ListsToggle />
                            <ActionIcon size="sm" variant="subtle" color="gray" disabled>
                              <IconPalette size={14} />
                            </ActionIcon>
                            <InsertCodeBlock />
                            <ConditionalContents
                              options={[{
                                when: (editor) => editor?.editorType === 'codeblock',
                                contents: () => <ChangeCodeMirrorLanguage />,
                              }]}
                            />
                          </>
                        ),
                      }),
                    ]}
                  />
                ) : (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Raw markdown"
                    autosize={false}
                    className="event-editor-raw"
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
            ) : (
              <Box className="event-editor-settings-grid">
                <TagSelect
                  value={tagIds}
                  onChange={setTagIds}
                />
                <TextInput
                  label="Project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project name"
                />
                <Select
                  label="Access"
                  value={access}
                  onChange={(value) => setAccess(value || 'private')}
                  data={[
                    { value: 'private', label: 'Private' },
                    { value: 'team', label: 'Team' },
                    { value: 'public', label: 'Public' },
                  ]}
                  allowDeselect={false}
                />
                <Select
                  label="Section"
                  data={sectionOptions}
                  value={sectionId || ''}
                  onChange={(value) => setSectionId(value || null)}
                  clearable
                  placeholder="No section"
                />
                <DatePickerInput
                  label="Date"
                  value={setdate}
                  onChange={(value) => setSetdate(value || new Date())}
                  valueFormat="DD MMM YYYY"
                  clearable={false}
                />
                <TextInput
                  label="Time"
                  type="time"
                  value={setTime}
                  onChange={(e) => setSetTime(e.target.value || '09:00')}
                />
                <Textarea
                  label="Comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  minRows={4}
                  className="event-editor-settings-comments"
                />
                <Box className="event-editor-flags">
                  <Switch
                    label="Locked (no editing)"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.currentTarget.checked)}
                  />
                  <Switch
                    label="Pinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.currentTarget.checked)}
                  />
                  <Switch
                    label="Blur content"
                    checked={isBlurred}
                    onChange={(e) => setIsBlurred(e.currentTarget.checked)}
                  />
                </Box>
              </Box>
            )}
          </Box>

          <Box className="event-editor-footer">
            {isMobile ? (
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={handleDelete}
                loading={isDeleting}
                aria-label="Delete"
              >
                <IconTrash size={16} />
              </ActionIcon>
            ) : (
              <Button
                variant="light"
                color="red"
                onClick={handleDelete}
                loading={isDeleting}
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
              className="event-editor-mode-switch"
            />

            <Group gap="sm" wrap="nowrap" className="event-editor-footer-actions">
              {isMobile ? (
                <>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={closeEditor}
                    aria-label="Close"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                  <ActionIcon
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isReadOnly}
                    size="lg"
                    aria-label={saveLabel}
                    color={!isOnline || !user ? 'orange' : 'blue'}
                  >
                    {!isOnline || !user ? <IconWifiOff size={16} /> : <IconDeviceFloppy size={16} />}
                  </ActionIcon>
                </>
              ) : (
                <>
                  <Button variant="default" onClick={closeEditor}>Close</Button>
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isReadOnly}
                    leftSection={!isOnline || !user ? <IconWifiOff size={14} /> : <IconDeviceFloppy size={14} />}
                    color={!isOnline || !user ? 'orange' : 'blue'}
                  >
                    {saveLabel}
                  </Button>
                </>
              )}
            </Group>
          </Box>
        </Box>
      )}
    </Modal>
  );
};
