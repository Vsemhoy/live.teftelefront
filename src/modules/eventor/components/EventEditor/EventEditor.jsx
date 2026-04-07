import { useEffect, useRef, useState } from 'react';
import {
  Modal, TextInput, Select, Button, Group, Stack,
  Text, Alert, Divider, SegmentedControl, Tooltip,
  ActionIcon, Box, Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  MDXEditor,
  headingsPlugin, listsPlugin, quotePlugin,
  thematicBreakPlugin, markdownShortcutPlugin,
  linkDialogPlugin, tablePlugin, codeBlockPlugin,
  codeMirrorPlugin, diffSourcePlugin,
  UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
  BlockTypeSelect, CodeToggle, InsertCodeBlock,
  InsertTable, ListsToggle, CreateLink,
} from '@mdxeditor/editor';
import {
  IconAlertCircle, IconDeviceFloppy, IconTrash,
  IconWifi, IconWifiOff, IconEye, IconEdit,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

import { useEventorStore } from '../../store/eventorStore';
import { useSections, useEventTypes, useSaveEvent, useEvent } from '../../api/eventorApi';
import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { createDraft, updateDraft, deleteDraft } from '@/shared/utils/db';

const DEFAULT_CONTENT = '';

export const EventEditor = () => {
  const { editorOpen, editorData, closeEditor } = useEventorStore();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();

  // --- Данные из API ---
  const { data: sections } = useSections();
  const { data: types } = useEventTypes();
  const { mutateAsync: saveEvent, isPending: isSaving } = useSaveEvent();

  // Загружаем событие если редактируем существующее
  const { data: existingEvent, isLoading: isEventLoading } = useEvent(editorData?.id);

  // --- Форма ---
  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [setdate, setSetdate] = useState(new Date());
  const [sectionId, setSectionId] = useState(null);
  const [typeId, setTypeId] = useState(null);
  // 'edit' | 'preview' | 'raw'
  const [editMode, setEditMode] = useState('edit');

  // Ключ для ремаунта MDXEditor — обновляем при каждом открытии/смене айтема
  const [editorKey, setEditorKey] = useState(0);

  const editorRef = useRef(null);

  // Заполняем форму при открытии
  useEffect(() => {
    if (!editorOpen) return;

    if (editorData?.id) {
      // Режим редактирования — ждём пока загрузится existingEvent
      if (!existingEvent) return;

      setName(existingEvent.name || '');
      setContent(existingEvent.content || DEFAULT_CONTENT);
      setSetdate(existingEvent.setdate ? new Date(existingEvent.setdate) : new Date());
      setSectionId(existingEvent.section_id || null);
      setTypeId(existingEvent.type_id || null);
    } else {
      // Новое событие — всегда сбрасываем поля чисто
      setName('');
      setContent(DEFAULT_CONTENT);
      setSetdate(editorData?.date ? new Date(editorData.date) : new Date());
      setSectionId(
        editorData?.section_id && editorData.section_id !== 'ALL'
          ? editorData.section_id
          : null
      );
      setTypeId(null);
    }

    setEditMode('edit');
    // Ремаунтим MDXEditor чтобы он подхватил новый контент
    setEditorKey((k) => k + 1);
  }, [editorOpen, editorData, existingEvent]);

  // --- Сохранение ---
  const handleSave = async () => {
    const payload = {
      id: editorData?.id || null,
      name,
      content,
      setdate: dayjs(setdate).format('YYYY-MM-DD HH:mm:ss'),
      section_id: sectionId,
      type_id: typeId,
    };

    if (!isOnline || !user) {
      try {
        if (editorData?.draftLocalId) {
          await updateDraft(editorData.draftLocalId, { ...payload, syncStatus: 'pending' });
        } else {
          await createDraft(payload);
        }
        notifications.show({
          title: 'Saved as draft',
          message: isOnline ? 'Sign in to sync to server' : 'No connection — saved locally',
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
      await saveEvent(payload);
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
        title: 'Server error — saved as draft',
        message: msg,
        color: 'orange',
      });
      await createDraft({ ...payload, syncStatus: 'error', errorMsg: msg });
      closeEditor();
    }
  };

  // --- Опции для селектов ---
  const sectionOptions = [
    { value: '', label: '— No section —' },
    ...(sections?.map((s) => ({ value: s.id, label: s.name })) || []),
  ];

  const typeOptions = types?.map((t) => ({
    value: t.id,
    label: t.name,
  })) || [];

  // Показываем лоадер пока грузится событие для редактирования
  const isLoadingEdit = Boolean(editorData?.id && isEventLoading && !existingEvent);

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      title={
        <Group gap={8}>
          <Text fw={600} size="sm">
            {editorData?.id ? 'Edit event' : 'New event'}
          </Text>
          {!isOnline && (
            <Tooltip label="Offline — will save as draft">
              <IconWifiOff size={15} color="var(--mantine-color-orange-6)" />
            </Tooltip>
          )}
          {!user && isOnline && (
            <Tooltip label="Sign in to save to server">
              <IconAlertCircle size={15} color="var(--mantine-color-orange-6)" />
            </Tooltip>
          )}
        </Group>
      }
      size="xl"
      padding="md"
      styles={{
        body: { padding: '12px 16px 16px' },
      }}
    >
      {isLoadingEdit ? (
        <Stack gap="sm" py="xl" align="center">
          <Text size="sm" c="dimmed">Loading event…</Text>
        </Stack>
      ) : (
        <Stack gap="sm">
          {(!isOnline || !user) && (
            <Alert
              icon={<IconWifiOff size={14} />}
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

          <TextInput
            placeholder="Title (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="sm"
            styles={{ input: { fontWeight: 600, fontSize: 15 } }}
          />

          <Group grow gap="sm">
            <DatePickerInput
              label="Date"
              value={setdate}
              onChange={setSetdate}
              size="xs"
              valueFormat="DD MMM YYYY"
              clearable={false}
            />
            <Select
              label="Section"
              data={sectionOptions}
              value={sectionId || ''}
              onChange={(v) => setSectionId(v || null)}
              size="xs"
              clearable
              placeholder="No section"
            />
            <Select
              label="Type"
              data={typeOptions}
              value={typeId}
              onChange={setTypeId}
              size="xs"
              clearable
              placeholder="No type"
            />
          </Group>

          <Divider />

          <Group justify="flex-end">
            <SegmentedControl
              size="xs"
              value={editMode}
              onChange={setEditMode}
              data={[
                { label: 'Edit', value: 'edit' },
                { label: 'Preview', value: 'preview' },
                { label: 'Raw', value: 'raw' },
              ]}
            />
          </Group>

          {/* Rich editor */}
          {editMode === 'edit' && (
            <Box
              style={{
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: 6,
                minHeight: 340,
              }}
            >
              <MDXEditor
                key={editorKey}
                ref={editorRef}
                markdown={content}
                onChange={setContent}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  thematicBreakPlugin(),
                  markdownShortcutPlugin(),
                  linkDialogPlugin(),
                  tablePlugin(),
                  codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                  codeMirrorPlugin({
                    codeBlockLanguages: {
                      js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
                      py: 'Python', php: 'PHP', java: 'Java', cs: 'C#',
                      cpp: 'C++', go: 'Go', rust: 'Rust', sql: 'SQL',
                      html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown',
                      bash: 'Bash', sh: 'Shell', yaml: 'YAML', xml: 'XML',
                    },
                  }),
                  diffSourcePlugin({ viewMode: 'rich-text' }),
                  toolbarPlugin({
                    toolbarContents: () => (
                      <>
                        <UndoRedo />
                        <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
                        <BoldItalicUnderlineToggles />
                        <CodeToggle />
                        <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
                        <BlockTypeSelect />
                        <ListsToggle />
                        <Divider orientation="vertical" style={{ height: 20, margin: '0 4px' }} />
                        <InsertTable />
                        <InsertCodeBlock />
                        <CreateLink />
                      </>
                    ),
                  }),
                ]}
              />
            </Box>
          )}

          {/* Preview */}
          {editMode === 'preview' && (
            <Box
              className="md-preview"
              style={{
                border: '1px solid var(--mantine-color-gray-2)',
                borderRadius: 6,
                minHeight: 340,
                padding: 16,
                background: 'var(--mantine-color-gray-0)',
              }}
            >
              {content ? (
                <ReactMarkdownPreview content={content} />
              ) : (
                <Text size="sm" c="dimmed">Nothing to preview</Text>
              )}
            </Box>
          )}

          {/* Raw — простой textarea с чистым markdown */}
          {editMode === 'raw' && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minRows={14}
              autosize
              styles={{
                input: {
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: 'vertical',
                },
              }}
              placeholder="Raw markdown…"
            />
          )}

          <Group justify="flex-end" gap="sm" mt={4}>
            <Button variant="subtle" color="gray" size="sm" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              leftSection={
                !isOnline || !user
                  ? <IconWifiOff size={14} />
                  : <IconDeviceFloppy size={14} />
              }
              color={!isOnline || !user ? 'orange' : 'blue'}
            >
              {!isOnline || !user ? 'Save draft' : 'Save'}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

// --- Инлайн-компонент превью ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ReactMarkdownPreview = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ inline, className, children }) {
        const match = /language-(\w+)/.exec(className || '');
        const lang = match?.[1];
        if (!inline && match) {
          return (
            <SyntaxHighlighter style={oneLight} language={lang} PreTag="div" showLineNumbers>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        }
        return <code className={className}>{children}</code>;
      },
    }}
  >
    {content}
  </ReactMarkdown>
);
