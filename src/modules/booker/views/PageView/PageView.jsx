import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon, Box, Button, Center, Group,
  FileInput, Loader, Menu, Modal, SegmentedControl, Select, Stack, Text, Textarea, TextInput, Tooltip,
} from '@mantine/core';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconArrowLeft, IconGripVertical, IconPlus,
  IconTrash, IconCopy, IconPencil, IconX, IconEye, IconSettings, IconVersions,
  IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';
import {
  useBook, usePage,
  useCreateBlockGroup, useSaveBlockContent,
  useDeleteBlockGroup, useReorderBlocks, useSavePage, useUpdateBlockGroup,
  useBlockVersions, usePublishVersion,
} from '@/modules/booker/api/bookerApi';
import { BlockRenderer } from '@/modules/booker/components/BlockRenderer/BlockRenderer';
import { AddBlockMenu } from '@/modules/booker/components/AddBlockMenu/AddBlockMenu';
import { getBlockMeta, getBlockPreview, getDefaultContent, VISIBILITY_OPTIONS, getBookCoverSrc } from '@/modules/booker/utils/bookerUtils';
import { MdEditor } from '@/shared/components/MdEditor';
import '@excalidraw/excalidraw/index.css';

// Lazy Excalidraw loader
let ExcalidrawComponent = null;
let exportExcalidrawToSvg = null;

const loadExcalidraw = async () => {
  if (ExcalidrawComponent && exportExcalidrawToSvg) {
    return { Excalidraw: ExcalidrawComponent, exportToSvg: exportExcalidrawToSvg };
  }
  const mod = await import('@excalidraw/excalidraw');
  ExcalidrawComponent = mod.Excalidraw;
  exportExcalidrawToSvg = mod.exportToSvg;
  return { Excalidraw: ExcalidrawComponent, exportToSvg: exportExcalidrawToSvg };
};

const EDITABLE_VERSION_TYPES = ['markdown', 'excalidraw'];

const isEditableVersionGroup = (group) =>
  EDITABLE_VERSION_TYPES.includes(group.type) && ['content', 'note'].includes(group.role ?? 'content');

// Sortable sidebar item
const SortableSidebarItem = ({
  group,
  isActive,
  onClick,
  onEditVersion,
  onVisibilityChange,
  onMakeDefaultVersion,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id });

  const meta = getBlockMeta(group.type);
  const preview = getBlockPreview(group);
  const [menuOpened, setMenuOpened] = useState(false);
  const { data: versions = [], isFetching } = useBlockVersions(group.id, { enabled: menuOpened });
  const canEditVersions = isEditableVersionGroup(group);

  return (
    <Box
      ref={setNodeRef}
      onClick={onClick}
      className={`bkr-sidebar-item ${isActive ? 'bkr-sidebar-item--active' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <ActionIcon
        size="xs" variant="subtle" color="gray"
        style={{ cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
        {...attributes} {...listeners}
      >
        <IconGripVertical size={12} />
      </ActionIcon>
      <Box style={{
        fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 500,
        background: meta.bg, color: meta.color, flexShrink: 0,
      }}>
        {meta.label}
      </Box>
      <Text size="xs" c="dimmed" truncate style={{ flex: 1 }}>{preview}</Text>
      <Menu
        withinPortal
        position="bottom-end"
        opened={menuOpened}
        onChange={setMenuOpened}
        onClick={(event) => event.stopPropagation()}
      >
        <Menu.Target>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            className={`bkr-sidebar-settings-btn ${menuOpened ? 'is-open' : ''}`}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpened((opened) => !opened);
            }}
          >
            <IconSettings size={12} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Visibility</Menu.Label>
          {VISIBILITY_OPTIONS.map((option) => (
            <Menu.Item
              key={option.value}
              leftSection={<IconEye size={14} />}
              onClick={(event) => {
                event.stopPropagation();
                onVisibilityChange(group.id, option.value);
              }}
            >
              {option.label}{group.visibility === option.value ? ' *' : ''}
            </Menu.Item>
          ))}

          {canEditVersions && (
            <>
              <Menu.Divider />
              <Menu.Label>Versions</Menu.Label>
              {isFetching && <Menu.Item disabled>Loading...</Menu.Item>}
              {!isFetching && versions.length === 0 && <Menu.Item disabled>No versions yet</Menu.Item>}
              {versions.map((version) => (
                <Menu.Item
                  key={version.id}
                  leftSection={<IconVersions size={14} />}
                  closeMenuOnClick={false}
                >
                  <Group gap={6} justify="space-between" wrap="nowrap">
                    <Text size="sm">v{version.version_number}</Text>
                    <Group gap={4} wrap="nowrap">
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditVersion(group, version);
                          setMenuOpened(false);
                        }}
                      >
                        Edit
                      </Button>
                      {group.master_block_id !== version.id && (
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="gray"
                          onClick={(event) => {
                            event.stopPropagation();
                            onMakeDefaultVersion(group.id, version.id);
                            setMenuOpened(false);
                          }}
                        >
                          Default
                        </Button>
                      )}
                    </Group>
                  </Group>
                </Menu.Item>
              ))}
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
};

// Page block in content body
const PageBlock = ({ group, onEdit, onView, onDelete, onVisibilityChange }) => {
  return (
    <Box className="bkr-block" onDoubleClick={() => onEdit(group)}>
      <Box className="bkr-block-actions">
        <Tooltip label="View" withArrow>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onView(group); }}>
            <IconEye size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Edit" withArrow>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onEdit(group); }}>
            <IconPencil size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Copy block link" withArrow>
          <ActionIcon size="sm" variant="subtle" color="gray"
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/b/${group.id}`); }}
          >
            <IconCopy size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete" withArrow>
          <ActionIcon size="sm" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}>
            <IconTrash size={15} />
          </ActionIcon>
        </Tooltip>
        <Menu withinPortal position="bottom-end" onClick={(e) => e.stopPropagation()}>
          <Menu.Target>
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
              <IconSettings size={15} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Visibility</Menu.Label>
            {VISIBILITY_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onVisibilityChange(group.id, option.value);
                }}
              >
                {option.label}{group.visibility === option.value ? ' *' : ''}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Box>
      <BlockRenderer group={group} />
    </Box>
  );
};

const BlockViewerModal = ({ group, onClose }) => {
  const meta = getBlockMeta(group?.type);

  if (!group) return null;

  return (
    <Modal
      opened
      onClose={onClose}
      title={`${meta.name} preview`}
      size="min(1180px, 96vw)"
      centered
      classNames={{ content: 'bkr-block-viewer-modal', body: 'bkr-block-viewer-body' }}
      styles={{
        content: { height: '88vh', maxHeight: '96vh', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Box className="bkr-block-viewer-content">
        <BlockRenderer group={group} />
      </Box>
      <Group className="bkr-block-modal-footer" justify="flex-end">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};

const EditablePageTitle = ({ page, onSave, size = 'title' }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(page?.title ?? '');
  }, [page?.id, page?.title]);

  const commit = () => {
    const nextTitle = value.trim() || page?.id || 'Untitled page';
    setEditing(false);
    setValue(nextTitle);
    if (page && nextTitle !== page.title) {
      onSave(nextTitle);
    }
  };

  if (!page) {
    return <Text size={size === 'title' ? undefined : 'sm'} fw={500}>Page</Text>;
  }

  if (editing) {
    return (
      <TextInput
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setValue(page.title ?? '');
            setEditing(false);
          }
        }}
        autoFocus
        size={size === 'title' ? 'md' : 'xs'}
        className={size === 'title' ? 'bkr-page-title-input' : 'bkr-page-title-input bkr-page-title-input--small'}
      />
    );
  }

  return (
    <Text
      size={size === 'title' ? undefined : 'sm'}
      fw={size === 'title' ? 600 : 500}
      truncate={size !== 'title'}
      onDoubleClick={() => setEditing(true)}
      className="bkr-editable-page-title"
      style={size === 'title' ? { fontSize: 24, marginBottom: 4 } : undefined}
    >
      {page.title || page.id}
    </Text>
  );
};

// Add block divider
const AddBlockDivider = ({ onAdd }) => (
  <AddBlockMenu onAdd={onAdd}>
    <Box className="bkr-add-divider">
      <Box className="bkr-add-divider-line" />
      <Box className="bkr-add-divider-btn">+</Box>
      <Box className="bkr-add-divider-line" />
    </Box>
  </AddBlockMenu>
);

// Markdown editor modal
const MdBlockModal = ({ group, onClose, onCancel }) => {
  const [value, setValue] = useState('');
  const [editorMode, setEditorMode] = useState('md');

  useEffect(() => {
    setValue(group?.master_block?.content || '');
  }, [group?.id, group?.master_block?.content]);

  if (!group) return null;

  return (
    <Modal
      opened
      onClose={() => onClose(value)}
      title="Edit markdown block"
      size="900px"
      centered
      classNames={{ content: 'bkr-block-modal', body: 'bkr-block-modal-body' }}
      styles={{
        content: { height: '92vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Box className="bkr-block-modal-content">
        {editorMode === 'md' ? (
          <MdEditor
            value={value}
            onChange={setValue}
            editorKey={`bkr-md-${group.id}`}
            placeholder="Write markdown here..."
            className="md-editor-surface md bkr-md-editor"
          />
        ) : (
          <Textarea
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            placeholder="Raw markdown"
            autosize={false}
            className="bkr-md-raw"
            styles={{
              root: { width: '100%', height: '100%' },
              wrapper: { height: '100%' },
              input: {
                height: '100%',
                minHeight: 0,
                border: 'none',
                borderRadius: 0,
                padding: '14px 16px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 13,
                lineHeight: 1.55,
              },
            }}
          />
        )}
      </Box>
      <Box className="bkr-block-modal-footer bkr-block-modal-footer--three">
        <Box className="bkr-block-modal-footer-slot bkr-block-modal-footer-slot--left">
          <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>
            Cancel
          </Button>
        </Box>
        <Box className="bkr-block-modal-footer-slot bkr-block-modal-footer-slot--center">
          <SegmentedControl
            size="xs"
            value={editorMode}
            onChange={setEditorMode}
            data={[
              { label: 'MD', value: 'md' },
              { label: 'Raw', value: 'raw' },
            ]}
          />
        </Box>
        <Box className="bkr-block-modal-footer-slot bkr-block-modal-footer-slot--right">
          <Button onClick={() => onClose(value)}>Save and close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

// Excalidraw editor modal
const ExcalidrawBlockModal = ({ group, onClose, onCancel }) => {
  const [Excalidraw, setExcalidraw] = useState(null);
  const [exportToSvg, setExportToSvg] = useState(null);
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadExcalidraw()
      .then(({ Excalidraw: C, exportToSvg: fn }) => {
        if (!alive) return;
        setExcalidraw(() => C);
        setExportToSvg(() => fn);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleSave = useCallback(async () => {
    if (!api || !exportToSvg) {
      onClose(group?.master_block?.payload || {});
      return;
    }
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    const svgEl = await exportToSvg({ elements, appState, files });
    onClose({ scene: { elements, appState, files }, svg: svgEl.outerHTML });
  }, [api, group?.master_block?.payload, exportToSvg, onClose]);

  if (!group) return null;

  return (
    <Modal
      opened
      onClose={handleSave}
      title="Edit drawing"
      fullScreen
      classNames={{ content: 'bkr-drawing-modal', body: 'bkr-drawing-modal-body' }}
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Box className="bkr-drawing-modal-content">
        {loading || !Excalidraw ? (
          <Center h="100%"><Text size="sm" c="dimmed">Loading Excalidraw...</Text></Center>
        ) : (
          <Excalidraw
            excalidrawAPI={setApi}
            initialData={group.master_block?.payload?.scene ?? null}
            UIOptions={{ canvasActions: { export: false, loadScene: false } }}
          />
        )}
      </Box>
      <Group className="bkr-block-modal-footer" justify="space-between">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save and close</Button>
      </Group>
    </Modal>
  );
};

// Data block editor modal
const DataBlockModal = ({ group, onClose, onCancel }) => {
  const [value, setValue] = useState({});
  const meta = getBlockMeta(group?.type);

  useEffect(() => {
    setValue({ ...(group?.master_block?.payload || {}) });
  }, [group?.id, group?.master_block?.payload]);

  if (!group) return null;

  const setField = (field, next) => setValue((prev) => ({ ...prev, [field]: next }));

  return (
    <Modal
      opened
      onClose={() => onClose(value)}
      title={`Edit ${meta.name.toLowerCase()} block`}
      size="760px"
      centered
      classNames={{ content: 'bkr-block-modal', body: 'bkr-block-modal-body' }}
      styles={{
        content: { minHeight: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Stack className="bkr-data-modal-content" gap="md">
        {group.type === 'code' && (
          <>
            <Group grow align="flex-start">
              <TextInput label="Caption" value={value.caption || ''} onChange={(e) => setField('caption', e.currentTarget.value)} />
              <TextInput label="Language" value={value.language || ''} onChange={(e) => setField('language', e.currentTarget.value)} />
            </Group>
            <Textarea label="Code" value={value.code || ''} onChange={(e) => setField('code', e.currentTarget.value)}
              minRows={14} autosize className="bkr-code-input" />
          </>
        )}
        {group.type === 'callout' && (
          <>
            <Group grow align="flex-start">
              <TextInput label="Title" value={value.title || ''} onChange={(e) => setField('title', e.currentTarget.value)} />
              <Select label="Tone"
                data={[
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'danger', label: 'Danger' },
                ]}
                value={value.tone || 'info'}
                onChange={(v) => setField('tone', v || 'info')}
              />
            </Group>
            <Textarea label="Text" value={value.text || ''} onChange={(e) => setField('text', e.currentTarget.value)} minRows={8} autosize />
          </>
        )}
        {group.type === 'divider' && (
          <TextInput label="Optional label" value={value.label || ''} onChange={(e) => setField('label', e.currentTarget.value)} />
        )}
        {group.type === 'embed' && (
          <>
            <TextInput label="Title" value={value.title || ''} onChange={(e) => setField('title', e.currentTarget.value)} />
            <TextInput label="URL" value={value.url || ''} onChange={(e) => setField('url', e.currentTarget.value)} />
            <Textarea label="Description" value={value.description || ''} onChange={(e) => setField('description', e.currentTarget.value)} minRows={4} autosize />
          </>
        )}
        {group.type === 'svg' && (
          <>
            <SegmentedControl
              size="xs"
              value={value.source || 'url'}
              onChange={(next) => setValue((prev) => ({ ...prev, source: next }))}
              data={[
                { value: 'url', label: 'URL' },
                { value: 'inline', label: 'Inline' },
                { value: 'file', label: 'File' },
              ]}
            />
            {(value.source || 'url') === 'url' && (
              <TextInput
                label="SVG URL"
                value={value.url || ''}
                onChange={(e) => setField('url', e.currentTarget.value)}
                placeholder="https://storage.yandexcloud.net/teftele/booker/svg/file.svg"
              />
            )}
            {(value.source || 'url') === 'inline' && (
              <Textarea
                label="SVG code"
                value={value.svg_text || ''}
                onChange={(e) => setField('svg_text', e.currentTarget.value)}
                placeholder={'<svg viewBox="0 0 100 100">...</svg>'}
                minRows={12}
                autosize
                className="bkr-code-input"
              />
            )}
            {(value.source || 'url') === 'file' && (
              <>
                <FileInput
                  label="SVG file"
                  accept=".svg,image/svg+xml"
                  placeholder={value.file_name || 'Choose SVG file'}
                  onChange={(file) => {
                    if (!file) return;
                    file.text().then((svgText) => {
                      setValue((prev) => ({
                        ...prev,
                        source: 'file',
                        svg_text: svgText,
                        file_name: file.name,
                      }));
                    });
                  }}
                />
                {value.file_name && <Text size="xs" c="dimmed">Loaded: {value.file_name}</Text>}
              </>
            )}
            <TextInput label="Caption" value={value.caption || ''} onChange={(e) => setField('caption', e.currentTarget.value)} />
            <Group grow align="flex-start">
              <TextInput
                label="Max width"
                value={value.max_width || ''}
                onChange={(e) => setField('max_width', e.currentTarget.value)}
                placeholder="100%, 720px, 48rem"
              />
              <TextInput
                label="Max height"
                value={value.max_height || ''}
                onChange={(e) => setField('max_height', e.currentTarget.value)}
                placeholder="620px, 70vh, auto"
              />
            </Group>
          </>
        )}
        {group.type === 'table' && (
          <>
            <Group grow align="flex-start">
              <TextInput label="Caption" value={value.caption || ''} onChange={(e) => setField('caption', e.currentTarget.value)} />
              <TextInput label="Minimum width" value={value.min_width || ''} onChange={(e) => setField('min_width', e.currentTarget.value)} placeholder="720px, 960px, 100%" />
            </Group>
            <Textarea
              label="Columns JSON"
              value={value.columns_raw ?? JSON.stringify(value.columns || [], null, 2)}
              onChange={(e) => {
                try {
                  setValue((prev) => ({ ...prev, columns: JSON.parse(e.currentTarget.value), columns_raw: undefined }));
                } catch {
                  setField('columns_raw', e.currentTarget.value);
                }
              }}
              minRows={4}
              autosize
              className="bkr-code-input"
            />
            <Textarea
              label="Rows JSON"
              value={value.rows_raw ?? JSON.stringify(value.rows || [], null, 2)}
              onChange={(e) => {
                try {
                  setValue((prev) => ({ ...prev, rows: JSON.parse(e.currentTarget.value), rows_raw: undefined }));
                } catch {
                  setField('rows_raw', e.currentTarget.value);
                }
              }}
              minRows={10}
              autosize
              className="bkr-code-input"
            />
          </>
        )}
        {group.type === 'checklist' && (
          <ChecklistEditor items={value.items || []} onChange={(items) => setField('items', items)} />
        )}
      </Stack>
      <Group className="bkr-block-modal-footer" justify="space-between">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onClose(value)}>Save and close</Button>
      </Group>
    </Modal>
  );
};

// Checklist editor within data modal
const ChecklistEditor = ({ items, onChange }) => {
  const update = (idx, field, val) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: val } : item));
    onChange(next);
  };
  const add = () => onChange([...items, { text: '', checked: false }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>Items</Text>
      {items.map((item, i) => (
        <Group key={i} gap={8} wrap="nowrap">
          <input
            type="checkbox"
            checked={!!item.checked}
            onChange={(e) => update(i, 'checked', e.target.checked)}
          />
          <TextInput
            value={item.text}
            onChange={(e) => update(i, 'text', e.currentTarget.value)}
            placeholder="Item text"
            style={{ flex: 1 }}
            size="sm"
          />
          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => remove(i)}>
            <IconTrash size={13} />
          </ActionIcon>
        </Group>
      ))}
      <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={add} w="fit-content">
        Add item
      </Button>
    </Stack>
  );
};

// PageView
export const PageView = () => {
  const { bookId, pageId } = useParams();
  const navigate = useNavigate();

  const { data: book } = useBook(bookId);
  const { data: page, isLoading } = usePage(pageId);
  const { mutate: createBlockGroup } = useCreateBlockGroup();
  const { mutate: saveContent } = useSaveBlockContent();
  const { mutate: deleteBlockGroup } = useDeleteBlockGroup();
  const { mutate: reorderBlocks } = useReorderBlocks();
  const { mutate: savePage } = useSavePage();
  const { mutate: updateBlockGroup } = useUpdateBlockGroup();
  const { mutate: publishVersion } = usePublishVersion();
  const coverSrc = getBookCoverSrc(book);

  const groups = page?.block_groups || [];
  const [items, setItems] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [structureHidden, setStructureHidden] = useState(false);

  useEffect(() => { setItems([...groups]); }, [groups]);

  const sensors = useSensors(useSensor(PointerSensor));

  // DnD handler
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((g) => g.id === active.id);
    const newIdx = items.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    reorderBlocks({ items: reordered.map((g, i) => ({ id: g.id, sort_order: i + 1 })) });
  };

  // Block CRUD
  const handleAddBlock = (type, afterIndex) => {
    const defaults = getDefaultContent(type);
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : items.length;

    createBlockGroup(
      { page_id: pageId, type, sort_order: insertAt + 1, ...defaults },
      {
        onSuccess: (created) => {
          setItems((prev) => {
            const next = [...prev];
            next.splice(insertAt, 0, created);
            return next;
          });
        },
      },
    );
  };

  const handleEdit = (group) => setEditingGroup(group);
  const handleView = (group) => setViewingGroup(group);

  const handleEditVersion = (group, version) => {
    setEditingGroup({
      ...group,
      master_block: version,
      editing_version_id: version.id,
    });
  };

  const handleSaveContent = useCallback((contentOrPayload) => {
    if (!editingGroup) return;

    const isMarkdown = editingGroup.type === 'markdown';
    const cleanedPayload = !isMarkdown && contentOrPayload && typeof contentOrPayload === 'object'
      ? Object.fromEntries(Object.entries(contentOrPayload).filter(([key]) => !key.endsWith('_raw')))
      : contentOrPayload;
    const body = isMarkdown
      ? { content: contentOrPayload }
      : { payload: cleanedPayload };

    saveContent({
      groupId: editingGroup.id,
      pageId,
      ...body,
    });

    // Optimistic update
    setItems((prev) => prev.map((g) => {
      if (g.id !== editingGroup.id) return g;
      const mb = { ...(g.master_block || {}) };
      if (isMarkdown) mb.content = contentOrPayload;
      else mb.payload = cleanedPayload;
      return { ...g, master_block: mb };
    }));

    setEditingGroup(null);
  }, [editingGroup, pageId, saveContent]);

  const handleCancelEdit = useCallback(() => setEditingGroup(null), []);

  const handleDelete = (id) => {
    deleteBlockGroup({ id, pageId });
    setItems((prev) => prev.filter((g) => g.id !== id));
    if (editingGroup?.id === id) setEditingGroup(null);
    if (viewingGroup?.id === id) setViewingGroup(null);
  };

  const handleRenamePage = (title) => {
    savePage({ id: pageId, title });
  };

  const handlePageVisibility = (visibility) => {
    savePage({ id: pageId, visibility });
  };

  const handleBlockVisibility = (id, visibility) => {
    updateBlockGroup({ id, visibility });
    setItems((prev) => prev.map((group) => (
      group.id === id ? { ...group, visibility } : group
    )));
  };

  const handleMakeDefaultVersion = (groupId, blockId) => {
    publishVersion({ groupId, blockId });
    setItems((prev) => prev.map((group) => {
      if (group.id !== groupId) return group;
      return { ...group, master_block_id: blockId };
    }));
  };

  if (isLoading) return <Center h={300}><Loader size="sm" /></Center>;

  return (
    <>
      {/* Toolbar */}
      <div className="content-toolbar">
        <Group px={12} py={4} justify="space-between" wrap="nowrap" className="bkr-page-toolbar" style={{ width: '100%' }}>
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/booker/${bookId}`)}>
              <IconArrowLeft size={16} />
            </ActionIcon>
            {book && (
              <Box style={{ width: 18, height: 18, borderRadius: 4, background: book.cover_color || '#E6F1FB', flexShrink: 0, overflow: 'hidden' }}>
                {coverSrc && <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
              </Box>
            )}
            <EditablePageTitle page={page} onSave={handleRenamePage} size="small" />
          </Group>
          <Group gap={6} wrap="nowrap" justify="flex-end" style={{ marginLeft: 'auto', flexShrink: 0, minWidth: 'max-content' }}>
            <Select
              size="xs"
              w={128}
              data={VISIBILITY_OPTIONS}
              value={page?.visibility ?? 'private'}
              onChange={(value) => value && handlePageVisibility(value)}
            />

            <AddBlockMenu onAdd={(type) => handleAddBlock(type)}>
              <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} className="bkr-add-block-btn">
                Add block
              </Button>
            </AddBlockMenu>
                        <Tooltip label={structureHidden ? 'Show structure' : 'Hide structure'} withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => setStructureHidden((hidden) => !hidden)}
              >
                {structureHidden ? (
                  <IconLayoutSidebarRightExpand size={15} />
                ) : (
                  <IconLayoutSidebarRightCollapse size={15} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </div>

      {/* Content area */}
      <Box style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Body */}
        <Box className="page-body content-scroll">
          <Box className={`bkr-page-content ${structureHidden ? 'bkr-page-content--wide' : ''}`}>
            <EditablePageTitle page={page} onSave={handleRenamePage} />
            <Text size="xs" c="dimmed" mb={20}>
              {items.length} {items.length === 1 ? 'block' : 'blocks'}
            </Text>

            {items.length === 0 ? (
              <Center h={200}>
                <Stack align="center" gap={8}>
                  <Text c="dimmed" size="sm">Empty page</Text>
                  <AddBlockMenu onAdd={(type) => handleAddBlock(type)}>
                    <Button size="sm" variant="light" leftSection={<IconPlus size={14} />}>
                      Add first block
                    </Button>
                  </AddBlockMenu>
                </Stack>
              </Center>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                  <Stack gap={0}>
                    {items.map((group, index) => (
                      <Box key={group.id}>
                        {index > 0 && <AddBlockDivider onAdd={(type) => handleAddBlock(type, index - 1)} />}
                        <Box id={`block-${group.id}`}>
                          <PageBlock
                            group={group}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onVisibilityChange={handleBlockVisibility}
                          />
                        </Box>
                      </Box>
                    ))}
                    <AddBlockDivider onAdd={(type) => handleAddBlock(type)} />
                  </Stack>
                </SortableContext>
              </DndContext>
            )}
          </Box>
        </Box>

        {/* Right sidebar block minimap */}
        {!structureHidden && (
        <Box className="page-sorter-sidebar">
          <Box style={{ fontSize: 10, fontWeight: 500, color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 4px' }}>
            Blocks
          </Box>
          <Box>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                {items.map((group) => (
                  <SortableSidebarItem
                    key={group.id}
                    group={group}
                    isActive={editingGroup?.id === group.id}
                    onEditVersion={handleEditVersion}
                    onVisibilityChange={handleBlockVisibility}
                    onMakeDefaultVersion={handleMakeDefaultVersion}
                    onClick={() => {
                      document.getElementById(`block-${group.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Box>
          <Box style={{ height: '0.5px', background: 'var(--mantine-color-default-border)', margin: '8px' }} />
          <Box style={{ fontSize: 10, fontWeight: 500, color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 10px' }}>
            Add
          </Box>
          {Object.entries(getBlockMeta('')).length === 0 ? null : null}
          {['markdown', 'excalidraw', 'svg', 'table', 'code', 'callout', 'checklist', 'divider', 'embed'].map((type) => {
            const m = getBlockMeta(type);
            return (
              <Box key={type} className="add-type-btn" onClick={() => handleAddBlock(type)}>
                <Text size="xs">{m.icon}</Text>
                <Text size="xs">{m.name}</Text>
              </Box>
            );
          })}
        </Box>
        )}
      </Box>

      {/* Editing modals */}
      <BlockViewerModal group={viewingGroup} onClose={() => setViewingGroup(null)} />
      {editingGroup?.type === 'markdown' && (
        <MdBlockModal group={editingGroup} onClose={handleSaveContent} onCancel={handleCancelEdit} />
      )}
      {editingGroup?.type === 'excalidraw' && (
        <ExcalidrawBlockModal group={editingGroup} onClose={handleSaveContent} onCancel={handleCancelEdit} />
      )}
      {['code', 'callout', 'divider', 'embed', 'svg', 'table', 'checklist'].includes(editingGroup?.type) && (
        <DataBlockModal group={editingGroup} onClose={handleSaveContent} onCancel={handleCancelEdit} />
      )}
    </>
  );
};
