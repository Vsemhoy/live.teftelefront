import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon, Box, Button, Center, Group,
  Loader, Stack, Text, Tooltip,
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
  IconTrash, IconCopy, IconFileText, IconPencil,
} from '@tabler/icons-react';
import { useBook } from '@/modules/booker/api/bookerApi';
import { useDocuments } from '@/modules/booker/api/bookerApi';
import { useBlocks, useSaveBlock, useDeleteBlock, useReorderBlocks } from '@/modules/booker/api/bookerApi';
import { BlockRenderer } from '@/modules/booker/components/BlockRenderer/BlockRenderer';

// ── Sortable блок в правом сайдбаре ──────────────────────────────
const SortableSidebarItem = ({ block, isActive, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const BADGE = { md: { label: 'MD', bg: '#EAF3DE', color: '#27500A' }, excalidraw: { label: 'SVG', bg: '#FAECE7', color: '#712B13' } };
  const badge = BADGE[block.type] ?? { label: block.type, bg: '#e9ecef', color: '#495057' };

  const preview = typeof block.content === 'string'
    ? block.content.replace(/^#+\s*/m, '').slice(0, 24)
    : 'Drawing';

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
const DocBlock = ({ block, isEditing, onEdit, onSave, onDelete, onChange }) => {
  const showHeader = true;

  return (
    <Box
      className={`doc-block ${isEditing ? 'doc-block--editing' : ''}`}
      onClick={() => !isEditing && onEdit(block.id)}
    >
      <Box className="doc-block-header">
        <Box style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 500, background: block.type === 'md' ? '#EAF3DE' : '#FAECE7', color: block.type === 'md' ? '#27500A' : '#712B13' }}>
          {block.type === 'md' ? 'MD' : 'Excalidraw'}
        </Box>
        <Box style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {isEditing ? (
            <Tooltip label="Done editing" withArrow>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onSave(); }}>
                <IconFileText size={12} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onEdit(block.id); }}>
                <IconPencil size={12} />
              </ActionIcon>
            </Tooltip>
          )}
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
      <BlockRenderer block={block} isEditing={isEditing} onChange={onChange} />
    </Box>
  );
};

// ── TOC из MD заголовков ──────────────────────────────────────────
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
  const [editingId, setEditingId] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

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

  const handleEdit = (id) => setEditingId(id);

  const handleSave = () => {
    if (editingId && pendingChanges[editingId] !== undefined) {
      saveBlock({ id: editingId, document_id: docId, content: pendingChanges[editingId] });
      setItems((prev) => prev.map((b) => b.id === editingId ? { ...b, content: pendingChanges[editingId] } : b));
    }
    setEditingId(null);
  };

  const handleChange = (id, value) => {
    setPendingChanges((prev) => ({ ...prev, [id]: value }));
  };

  const handleDelete = (id) => {
    deleteBlock({ id, documentId: docId });
    setItems((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      document_id: docId,
      type,
      content: type === 'md' ? '' : {},
      sort_order: items.length + 1,
    };
    saveBlock(newBlock, {
      onSuccess: (saved) => {
        setItems((prev) => [...prev, saved]);
        setEditingId(saved.id);
      },
    });
  };

  const toc = useMemo(() => buildToc(items), [items]);

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
        <Box className="doc-body content-scroll" onClick={() => editingId && handleSave()}>
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
                        isEditing={editingId === block.id}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onChange={(v) => handleChange(block.id, v)}
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {items.map((block) => (
                <SortableSidebarItem
                  key={block.id}
                  block={block}
                  isActive={editingId === block.id}
                  onClick={() => { handleEdit(block.id); document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                />
              ))}
            </SortableContext>
          </DndContext>
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
          <Box className="add-type-btn" style={{ opacity: 0.4, cursor: 'default' }}>
            <Text size="xs">{'{}'}</Text><Text size="xs">Code</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};
