import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon, Box, Button, Center, Group,
  Loader, Modal, Select, Stack, Text, Textarea, TextInput, Tooltip,
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
  IconTrash, IconCopy, IconPencil, IconX,
} from '@tabler/icons-react';
import { useBook } from '@/modules/booker/api/bookerApi';
import { useDocuments } from '@/modules/booker/api/bookerApi';
import { useBlocks, useSaveBlock, useDeleteBlock, useReorderBlocks } from '@/modules/booker/api/bookerApi';
import { BlockRenderer } from '@/modules/booker/components/BlockRenderer/BlockRenderer';
import { MdEditor } from '@/shared/components/MdEditor';
import '@excalidraw/excalidraw/index.css';

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

const BLOCK_META = {
  md: { label: 'MD', name: 'MD text', bg: '#EAF3DE', color: '#27500A', preview: 'Text' },
  excalidraw: { label: 'SVG', name: 'Excalidraw', bg: '#FAECE7', color: '#712B13', preview: 'Drawing' },
  code: { label: 'Code', name: 'Code', bg: '#E7F0FF', color: '#17447D', preview: 'Code' },
  callout: { label: 'Note', name: 'Callout', bg: '#FFF3BF', color: '#5F3D00', preview: 'Callout' },
  divider: { label: 'Line', name: 'Divider', bg: '#F1F3F5', color: '#495057', preview: 'Divider' },
  embed: { label: 'Link', name: 'Embed', bg: '#E6FCF5', color: '#087F5B', preview: 'Embed' },
};

const getBlockMeta = (type) => BLOCK_META[type] ?? {
  label: type,
  name: type,
  bg: '#e9ecef',
  color: '#495057',
  preview: type,
};

const getBlockPreview = (block) => {
  const meta = getBlockMeta(block.type);
  const content = block.content;

  if (typeof content === 'string') {
    return content.replace(/^#+\s*/m, '').slice(0, 24);
  }

  if (!content || typeof content !== 'object') return meta.preview;
  if (block.type === 'code') return content.caption || content.language || meta.preview;
  if (block.type === 'callout') return content.title || content.text || meta.preview;
  if (block.type === 'divider') return content.label || meta.preview;
  if (block.type === 'embed') return content.title || content.url || meta.preview;
  return meta.preview;
};

const getDefaultBlockContent = (type) => {
  if (type === 'md') return 'New block';
  if (type === 'code') return { language: 'javascript', caption: '', code: 'const value = true;' };
  if (type === 'callout') return { tone: 'info', title: 'Note', text: 'New callout' };
  if (type === 'divider') return { label: '' };
  if (type === 'embed') return { title: 'Embedded link', url: 'https://example.com', description: '' };
  return {};
};

// ── Sortable блок в правом сайдбаре ──────────────────────────────
const SortableSidebarItem = ({ block, isActive, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const badge = getBlockMeta(block.type);
  const preview = getBlockPreview(block);

  return (
    <Box
      ref={setNodeRef}
      onClick={onClick}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        borderRadius: 6,
        margin: '1px 4px',
        cursor: 'pointer',
        background: isActive ? 'var(--mantine-color-body)' : 'transparent',
        border: isActive ? '0.5px solid var(--mantine-color-default-border)' : '0.5px solid transparent',
      }}
    >
      <ActionIcon
        size="xs"
        variant="subtle"
        color="gray"
        style={{ cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={12} />
      </ActionIcon>
      <Box
        style={{
          fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 500,
          background: badge.bg, color: badge.color, flexShrink: 0,
        }}
      >
        {badge.label}
      </Box>
      <Text size="xs" c="dimmed" truncate style={{ flex: 1 }}>{preview || '...'}</Text>
    </Box>
  );
};

// ── Блок в теле документа ─────────────────────────────────────────
const DocBlock = ({ block, onEdit, onDelete }) => {
  const badge = getBlockMeta(block.type);

  return (
    <Box
      className="doc-block"
      onDoubleClick={() => onEdit(block)}
    >
      <Box className="doc-block-header">
        <Box style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 500, background: badge.bg, color: badge.color }}>
          {badge.label}
        </Box>
        <Box style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onEdit(block); }}>
              <IconPencil size={12} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Copy block link" withArrow>
            <ActionIcon
              size="xs" variant="subtle" color="gray"
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/b/${block.id}`); }}
            >
              <IconCopy size={12} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow>
            <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
              <IconTrash size={12} />
            </ActionIcon>
          </Tooltip>
        </Box>
      </Box>
      <BlockRenderer block={block} isEditing={false} />
    </Box>
  );
};

// ── TOC из MD заголовков ──────────────────────────────────────────
const MdBlockModal = ({ block, onClose, onCancel }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(block?.content || '');
  }, [block?.id, block?.content]);

  if (!block) return null;

  return (
    <Modal
      opened
      onClose={() => onClose(value)}
      title="Edit markdown block"
      size="900px"
      centered
      classNames={{ content: 'booker-block-modal', body: 'booker-block-modal-body' }}
      styles={{
        content: { height: '92vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Box className="booker-block-modal-content">
        <MdEditor
          value={value}
          onChange={setValue}
          editorKey={`booker-md-${block.id}`}
          placeholder="Write markdown here..."
          className="md-editor-surface md booker-md-editor"
        />
      </Box>
      <Group className="booker-block-modal-footer" justify="space-between">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>
          Cancel changes
        </Button>
        <Button onClick={() => onClose(value)}>
          Save and close
        </Button>
      </Group>
    </Modal>
  );
};

const ExcalidrawBlockModal = ({ block, onClose, onCancel }) => {
  const [Excalidraw, setExcalidraw] = useState(null);
  const [exportToSvg, setExportToSvg] = useState(null);
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadExcalidraw()
      .then(({ Excalidraw: LoadedExcalidraw, exportToSvg: loadedExportToSvg }) => {
        if (!alive) return;
        setExcalidraw(() => LoadedExcalidraw);
        setExportToSvg(() => loadedExportToSvg);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  const handleSave = useCallback(async () => {
    if (!api || !exportToSvg) {
      onClose(block?.content || {});
      return;
    }

    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    const svgEl = await exportToSvg({ elements, appState, files });
    onClose({ scene: { elements, appState, files }, svg: svgEl.outerHTML });
  }, [api, block?.content, exportToSvg, onClose]);

  if (!block) return null;

  return (
    <Modal
      opened
      onClose={handleSave}
      title="Edit drawing block"
      fullScreen
      classNames={{ content: 'booker-drawing-modal', body: 'booker-drawing-modal-body' }}
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Box className="booker-drawing-modal-content">
        {loading || !Excalidraw ? (
          <Center h="100%">
            <Text size="sm" c="dimmed">Loading Excalidraw...</Text>
          </Center>
        ) : (
          <Excalidraw
            excalidrawAPI={setApi}
            initialData={block.content?.scene ?? null}
            UIOptions={{ canvasActions: { export: false, loadScene: false } }}
          />
        )}
      </Box>
      <Group className="booker-block-modal-footer" justify="space-between">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>
          Cancel changes
        </Button>
        <Button onClick={handleSave}>
          Save and close
        </Button>
      </Group>
    </Modal>
  );
};

const DataBlockModal = ({ block, onClose, onCancel }) => {
  const [value, setValue] = useState({});
  const meta = getBlockMeta(block?.type);

  useEffect(() => {
    const content = typeof block?.content === 'object' && block.content !== null ? block.content : {};
    setValue({ ...content });
  }, [block?.id, block?.content]);

  if (!block) return null;

  const setField = (field, nextValue) => setValue((prev) => ({ ...prev, [field]: nextValue }));

  return (
    <Modal
      opened
      onClose={() => onClose(value)}
      title={`Edit ${meta.name} block`}
      size="760px"
      centered
      classNames={{ content: 'booker-block-modal', body: 'booker-block-modal-body' }}
      styles={{
        content: { minHeight: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' },
        body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Stack className="booker-data-modal-content" gap="md">
        {block.type === 'code' && (
          <>
            <Group grow align="flex-start">
              <TextInput
                label="Caption"
                value={value.caption || ''}
                onChange={(event) => setField('caption', event.currentTarget.value)}
              />
              <TextInput
                label="Language"
                value={value.language || ''}
                onChange={(event) => setField('language', event.currentTarget.value)}
              />
            </Group>
            <Textarea
              label="Code"
              value={value.code || ''}
              onChange={(event) => setField('code', event.currentTarget.value)}
              minRows={14}
              autosize
              className="booker-code-input"
            />
          </>
        )}

        {block.type === 'callout' && (
          <>
            <Group grow align="flex-start">
              <TextInput
                label="Title"
                value={value.title || ''}
                onChange={(event) => setField('title', event.currentTarget.value)}
              />
              <Select
                label="Tone"
                data={[
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'danger', label: 'Danger' },
                ]}
                value={value.tone || 'info'}
                onChange={(nextValue) => setField('tone', nextValue || 'info')}
              />
            </Group>
            <Textarea
              label="Text"
              value={value.text || ''}
              onChange={(event) => setField('text', event.currentTarget.value)}
              minRows={8}
              autosize
            />
          </>
        )}

        {block.type === 'divider' && (
          <TextInput
            label="Optional label"
            value={value.label || ''}
            onChange={(event) => setField('label', event.currentTarget.value)}
          />
        )}

        {block.type === 'embed' && (
          <>
            <TextInput
              label="Title"
              value={value.title || ''}
              onChange={(event) => setField('title', event.currentTarget.value)}
            />
            <TextInput
              label="URL"
              value={value.url || ''}
              onChange={(event) => setField('url', event.currentTarget.value)}
            />
            <Textarea
              label="Description"
              value={value.description || ''}
              onChange={(event) => setField('description', event.currentTarget.value)}
              minRows={4}
              autosize
            />
          </>
        )}
      </Stack>
      <Group className="booker-block-modal-footer" justify="space-between">
        <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onCancel}>
          Cancel changes
        </Button>
        <Button onClick={() => onClose(value)}>
          Save and close
        </Button>
      </Group>
    </Modal>
  );
};

const buildToc = (blocks) => {
  const items = [];
  blocks.forEach((block) => {
    if (block.type !== 'md') return;
    const content = typeof block.content === 'string' ? block.content : '';
    const lines = content.split('\n');
    lines.forEach((line) => {
      const m = line.match(/^(#{1,3})\s+(.+)/);
      if (m) items.push({ level: m[1].length, text: m[2], blockId: block.id });
    });
  });
  return items;
};

// ── DocView ───────────────────────────────────────────────────────
export const DocView = () => {
  const { bookId, docId } = useParams();
  const navigate = useNavigate();

  const { data: book } = useBook(bookId);
  const { data: docs = [] } = useDocuments(bookId);
  const { data: blocks = [], isLoading } = useBlocks(docId);
  const { mutate: saveBlock } = useSaveBlock();
  const { mutate: deleteBlock } = useDeleteBlock();
  const { mutate: reorderBlocks } = useReorderBlocks();

  const doc = docs.find((d) => d.id === docId);

  const [items, setItems] = useState([]);
  const [editingBlock, setEditingBlock] = useState(null);

  useEffect(() => { setItems([...blocks]); }, [blocks]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((b) => b.id === active.id);
    const newIdx = items.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    reorderBlocks({ documentId: docId, order: reordered.map((b, i) => ({ id: b.id, sort_order: i + 1 })) });
  };

  const handleEdit = (block) => setEditingBlock(block);

  const handleSaveBlockContent = useCallback((content) => {
    if (!editingBlock) return;

    const nextBlock = { ...editingBlock, document_id: docId, content };
    saveBlock(nextBlock);
    setItems((prev) => prev.map((b) => (b.id === editingBlock.id ? nextBlock : b)));
    setEditingBlock(null);
  }, [docId, editingBlock, saveBlock]);

  const handleCancelBlockEdit = useCallback(() => {
    setEditingBlock(null);
  }, []);

  const handleDelete = (id) => {
    deleteBlock({ id, documentId: docId });
    setItems((prev) => prev.filter((b) => b.id !== id));
    if (editingBlock?.id === id) setEditingBlock(null);
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      document_id: docId,
      type,
      content: getDefaultBlockContent(type),
      sort_order: items.length + 1,
    };
    saveBlock(newBlock, {
      onSuccess: (saved) => {
        setItems((prev) => [...prev, saved]);
      },
    });
  };

  const toc = [];

  if (isLoading) return <Center h={300}><Loader size="sm" /></Center>;

  return (
    <>
      <div className="content-toolbar">
        <Group px={16} py={8} justify="space-between">
          <Group gap={8}>
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/booker/${bookId}`)}>
              <IconArrowLeft size={16} />
            </ActionIcon>
            {book && (
              <Box style={{ width: 18, height: 18, borderRadius: 4, background: book.cover_color || '#E6F1FB', flexShrink: 0 }} />
            )}
            <Text size="xs" c="dimmed">{book?.title}</Text>
            <Text size="xs" c="dimmed">/</Text>
            <Text size="sm" fw={500}>{doc?.title ?? 'Document'}</Text>
          </Group>
          <Group gap={6}>
            <Button size="sm" variant="subtle" color="gray" leftSection={<IconPlus size={14} />} onClick={() => handleAddBlock('md')}>
              MD
            </Button>
            <Button size="sm" variant="subtle" color="orange" leftSection={<IconPlus size={14} />} onClick={() => handleAddBlock('excalidraw')}>
              Drawing
            </Button>
            <Button size="sm" variant="subtle" color="blue" leftSection={<IconPlus size={14} />} onClick={() => handleAddBlock('code')}>
              Code
            </Button>
            <Button size="sm" variant="subtle" color="yellow" leftSection={<IconPlus size={14} />} onClick={() => handleAddBlock('callout')}>
              Callout
            </Button>
          </Group>
        </Group>
      </div>

      <Box style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Левый сайдбар — оглавление */}
        <Box className="doc-toc-sidebar">
          <Box style={{ fontSize: 10, fontWeight: 500, color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 4px' }}>
            Contents
          </Box>
          {toc.length === 0 ? (
            <Text size="xs" c="dimmed" px={10} pt={4}>No headings yet</Text>
          ) : (
            toc.map((item, i) => (
              <Box
                key={i}
                className={`toc-entry toc-h${item.level}`}
                onClick={() => document.getElementById(`block-${item.blockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {item.text}
              </Box>
            ))
          )}
        </Box>

        {/* Тело документа */}
        <Box className="doc-body content-scroll">
          <Box style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px' }}>
            <Text style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>{doc?.title}</Text>
            <Text size="xs" c="dimmed" mb={20}>
              {items.length} blocks
            </Text>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <Stack gap={4}>
                  {items.map((block) => (
                    <Box key={block.id} id={`block-${block.id}`}>
                      <DocBlock
                        block={block}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </Box>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>

            {items.length === 0 && (
              <Center h={200}>
                <Stack align="center" gap={8}>
                  <Text c="dimmed" size="sm">Empty document</Text>
                  <Group gap={6}>
                    <Button size="xs" variant="light" onClick={() => handleAddBlock('md')}>+ MD block</Button>
                    <Button size="xs" variant="light" color="orange" onClick={() => handleAddBlock('excalidraw')}>+ Drawing</Button>
                    <Button size="xs" variant="light" color="blue" onClick={() => handleAddBlock('code')}>+ Code</Button>
                  </Group>
                </Stack>
              </Center>
            )}
          </Box>
        </Box>

        {/* Правый сайдбар — DnD ресортер */}
        <Box className="doc-sorter-sidebar">
          <Box style={{ fontSize: 10, fontWeight: 500, color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 4px' }}>
            Blocks
          </Box>
          <Box className="booker-sidebar-blocks">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {items.map((block) => (
                <SortableSidebarItem
                  key={block.id}
                  block={block}
                  isActive={editingBlock?.id === block.id}
                  onClick={() => { handleEdit(block); document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                />
              ))}
            </SortableContext>
          </DndContext>
          </Box>
          <Box style={{ height: '0.5px', background: 'var(--mantine-color-default-border)', margin: '8px' }} />
          <Box style={{ fontSize: 10, fontWeight: 500, color: 'var(--mantine-color-dimmed)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 10px' }}>
            Add
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('md')}>
            <Text size="xs">T</Text><Text size="xs">MD text</Text>
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('excalidraw')}>
            <Text size="xs">✏</Text><Text size="xs">Excalidraw</Text>
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('code')}>
            <Text size="xs">{'{}'}</Text><Text size="xs">Code</Text>
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('callout')}>
            <Text size="xs">!</Text><Text size="xs">Callout</Text>
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('divider')}>
            <Text size="xs">--</Text><Text size="xs">Divider</Text>
          </Box>
          <Box className="add-type-btn" onClick={() => handleAddBlock('embed')}>
            <Text size="xs">@</Text><Text size="xs">Embed</Text>
          </Box>
        </Box>
      </Box>
      {editingBlock?.type === 'md' && (
        <MdBlockModal
          block={editingBlock}
          onClose={handleSaveBlockContent}
          onCancel={handleCancelBlockEdit}
        />
      )}
      {editingBlock?.type === 'excalidraw' && (
        <ExcalidrawBlockModal
          block={editingBlock}
          onClose={handleSaveBlockContent}
          onCancel={handleCancelBlockEdit}
        />
      )}
      {['code', 'callout', 'divider', 'embed'].includes(editingBlock?.type) && (
        <DataBlockModal
          block={editingBlock}
          onClose={handleSaveBlockContent}
          onCancel={handleCancelBlockEdit}
        />
      )}
    </>
  );
};
