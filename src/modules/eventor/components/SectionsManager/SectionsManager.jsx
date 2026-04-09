import { useState, useEffect, useCallback } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, ActionIcon,
  Button, Tooltip, Badge, Box, Collapse, ColorPicker,
  Divider, Alert, Loader, Center,
} from '@mantine/core';
import {
  IconGripVertical, IconEdit, IconTrash, IconArchive,
  IconArchiveOff, IconCheck, IconX, IconPlus, IconAlertCircle,
} from '@tabler/icons-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSections, useSaveSection, useDeleteSection, useArchiveSection, useReorderSections } from '../../api/eventorApi';
import { useEventorStore } from '../../store/eventorStore';
import { notifications } from '@mantine/notifications';

const SWATCHES = [
  '#e03131','#c2255c','#9c36b5','#6741d9','#3b5bdb',
  '#1971c2','#0c8599','#087f5b','#2f9e44','#66a80f',
  '#f08c00','#e8590c','#868e96','#343a40',
];

// ─── Инлайн-форма редактирования (раскрывается под строкой) ─────────────────

const SectionForm = ({ section, onSave, onCancel, isSaving }) => {
  const isNew = !section.id;
  const [name, setName]       = useState(section.name || '');
  const [literals, setLiterals] = useState(section.literals || '');
  const [bgcolor, setBgcolor] = useState(section.bgcolor || '#3b5bdb');

  const handleLiterals = (v) => setLiterals(v.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/gi, '').slice(0, 3));

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ ...section, name: name.trim(), literals: literals.trim(), bgcolor });
  };

  return (
    <Box
      p={12}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderRadius: 8,
        border: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Stack gap={10}>
        <Group gap={8} align="flex-start">
          <TextInput
            placeholder="Section name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            size="sm"
            style={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
            autoFocus
          />
          <TextInput
            placeholder="ABC"
            value={literals}
            onChange={(e) => handleLiterals(e.target.value)}
            maxLength={3}
            size="sm"
            style={{ width: 60 }}
            title="Up to 3 letters — shown in collapsed sidebar"
          />
        </Group>

        <Text size="xs" c="dimmed" fw={500}>Background color</Text>
        <ColorPicker
          format="hex"
          value={bgcolor}
          onChange={setBgcolor}
          swatches={SWATCHES}
          swatchesPerRow={7}
          size="sm"
          fullWidth
        />

        <Group justify="flex-end" gap={8} mt={4}>
          <Button size="xs" variant="subtle" color="gray" onClick={onCancel} leftSection={<IconX size={13} />}>
            Cancel
          </Button>
          <Button size="xs" onClick={handleSubmit} loading={isSaving} leftSection={<IconCheck size={13} />}>
            {isNew ? 'Create' : 'Save'}
          </Button>
        </Group>
      </Stack>
    </Box>
  );
};

// ─── Одна строка секции (sortable) ───────────────────────────────────────────

const SectionRow = ({ section, isEditing, onEdit, onCancel, onSave, onDelete, onToggleArchive, isSaving, isDeletingId, isArchivingId }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id, disabled: isEditing || section.is_archived });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.is_archived ? 0.45 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Box
        style={{
          borderRadius: 6,
          border: '1px solid var(--mantine-color-gray-2)',
          background: 'var(--mantine-color-white)',
          marginBottom: 6,
        }}
      >
        {/* Строка */}
        <Group gap={6} px={8} py={7} wrap="nowrap">
          {/* Drag handle — скрываем у архивных */}
          {!section.is_archived ? (
            <Box
              {...listeners}
              {...attributes}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', color: 'var(--mantine-color-gray-4)', touchAction: 'none', flexShrink: 0 }}
            >
              <IconGripVertical size={15} />
            </Box>
          ) : (
            <Box style={{ width: 15, flexShrink: 0 }} />
          )}

          {/* Цветной кружок */}
          <Box
            style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
              background: section.bgcolor || 'var(--mantine-color-gray-4)',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          />

          {/* Литералы */}
          {section.literals && (
            <Badge size="xs" variant="filled"
              style={{ background: section.bgcolor || 'var(--mantine-color-gray-5)', flexShrink: 0, minWidth: 28 }}>
              {section.literals}
            </Badge>
          )}

          {/* Имя */}
          <Text
            size="sm"
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            c={section.is_archived ? 'dimmed' : undefined}
          >
            {section.name}
            {Boolean(section.is_default) && <Text component="span" size="xs" c="dimmed" ml={4}>(default)</Text>}
          </Text>

          {/* Кнопки */}
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onEdit(section.id)} disabled={isEditing}>
                <IconEdit size={13} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={section.is_archived ? 'Unarchive' : 'Archive'} withArrow>
              <ActionIcon
                size="sm" variant="subtle"
                color={section.is_archived ? 'teal' : 'orange'}
                loading={isArchivingId === section.id}
                onClick={() => onToggleArchive(section)}
              >
                {section.is_archived ? <IconArchiveOff size={13} /> : <IconArchive size={13} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon
                size="sm" variant="subtle" color="red"
                loading={isDeletingId === section.id}
                onClick={() => onDelete(section)}
                disabled={section.is_default}
              >
                <IconTrash size={13} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Accordion-форма */}
        <Collapse in={isEditing}>
          <Box px={8} pb={8}>
            <SectionForm
              section={section}
              onSave={onSave}
              onCancel={onCancel}
              isSaving={isSaving}
            />
          </Box>
        </Collapse>
      </Box>
    </div>
  );
};

// ─── Главный компонент ───────────────────────────────────────────────────────

export const SectionsManager = () => {
  const { sectionsManagerOpen, closeSectionsManager } = useEventorStore();
  const { data: sections, isLoading } = useSections();

  const { mutateAsync: saveSection }     = useSaveSection();
  const { mutateAsync: deleteSection }   = useDeleteSection();
  const { mutateAsync: archiveSection }  = useArchiveSection();
  const { mutateAsync: reorderSections } = useReorderSections();

  // Локальная копия для drag-and-drop
  const [localSections, setLocalSections] = useState([]);
  const [editingId, setEditingId]         = useState(null); // id | 'new' | null
  const [isSaving, setIsSaving]           = useState(false);
  const [isDeletingId, setIsDeletingId]   = useState(null);
  const [isArchivingId, setIsArchivingId] = useState(null);
  const [isDirtyOrder, setIsDirtyOrder]   = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Синхронизируем локальный список при загрузке
  useEffect(() => {
    if (sections) {
      const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
      setLocalSections(sorted);
      setIsDirtyOrder(false);
    }
  }, [sections]);

  // Активные (не архивные) — идут сверху и участвуют в drag-and-drop
  const activeSections   = localSections.filter((s) => !s.is_archived);
  const archivedSections = localSections.filter((s) => s.is_archived);

  // ── DnD ───────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    setLocalSections((prev) => {
      const activeIdx = prev.findIndex((s) => s.id === active.id);
      const overIdx   = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, activeIdx, overIdx);
    });
    setIsDirtyOrder(true);
  }, []);

  // ── Сохранение порядка ────────────────────────────────────────────────────

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const payload = localSections.map((s, i) => ({ id: s.id, sort_order: i }));
      await reorderSections(payload);
      setIsDirtyOrder(false);
      notifications.show({ message: 'Order saved', color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to save order', color: 'red' });
    } finally {
      setIsSavingOrder(false);
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      await saveSection(data);
      setEditingId(null);
      notifications.show({ message: data.id ? 'Section updated' : 'Section created', color: 'green' });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to save section', color: 'red' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (section) => {
    setIsDeletingId(section.id);
    try {
      await deleteSection(section.id);
      notifications.show({ message: 'Section deleted', color: 'gray' });
    } catch (err) {
      // Бэк вернул ошибку — вероятно есть связанные события → предлагаем архивировать
      const msg = err.response?.data?.message || '';
      notifications.show({
        title: 'Cannot delete',
        message: msg || 'This section has linked events. Archive it instead?',
        color: 'orange',
        autoClose: false,
        withCloseButton: true,
        // Кнопка архивации прямо в нотификации
        children: (
          <Button size="xs" mt={6} color="orange" variant="light"
            onClick={() => handleToggleArchive(section)}>
            Archive instead
          </Button>
        ),
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleToggleArchive = async (section) => {
    setIsArchivingId(section.id);
    try {
      await archiveSection({ id: section.id, is_archived: !section.is_archived });
      notifications.show({
        message: section.is_archived ? 'Section restored' : 'Section archived',
        color: 'teal',
      });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update section', color: 'red' });
    } finally {
      setIsArchivingId(null);
    }
  };

  // ── Рендер ────────────────────────────────────────────────────────────────

  return (
    <Modal
      opened={sectionsManagerOpen}
      onClose={closeSectionsManager}
      title={<Text fw={600} size="sm">Sections</Text>}
      size="sm"
      styles={{
        body: { padding: '8px 12px 16px' },
        header: { paddingBottom: 8 },
      }}
    >
      {isLoading ? (
        <Center h={120}><Loader size="sm" /></Center>
      ) : (
        <Stack gap={0}>
          {/* ── Активные секции (drag-and-drop) ── */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {activeSections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  isEditing={editingId === section.id}
                  onEdit={(id) => setEditingId((prev) => prev === id ? null : id)}
                  onCancel={() => setEditingId(null)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onToggleArchive={handleToggleArchive}
                  isSaving={isSaving}
                  isDeletingId={isDeletingId}
                  isArchivingId={isArchivingId}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* ── Форма новой секции ── */}
          <Collapse in={editingId === 'new'}>
            <Box mb={6}>
              <SectionForm
                section={{ name: '', literals: '', bgcolor: '#3b5bdb' }}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                isSaving={isSaving}
              />
            </Box>
          </Collapse>

          {/* ── Кнопка добавить ── */}
          {editingId !== 'new' && (
            <Button
              variant="subtle" color="gray" size="xs"
              leftSection={<IconPlus size={13} />}
              justify="start"
              onClick={() => setEditingId('new')}
              mt={2} mb={6}
            >
              New section
            </Button>
          )}

          {/* ── Архивированные ── */}
          {archivedSections.length > 0 && (
            <>
              <Divider my={8} label={<Text size="xs" c="dimmed">Archived</Text>} labelPosition="left" />
              {archivedSections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  isEditing={editingId === section.id}
                  onEdit={(id) => setEditingId((prev) => prev === id ? null : id)}
                  onCancel={() => setEditingId(null)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onToggleArchive={handleToggleArchive}
                  isSaving={isSaving}
                  isDeletingId={isDeletingId}
                  isArchivingId={isArchivingId}
                />
              ))}
            </>
          )}

          {/* ── Save order ── */}
          {isDirtyOrder && (
            <>
              <Divider my={8} />
              <Alert color="blue" variant="light" py={6} px={10} radius="sm" icon={<IconAlertCircle size={14} />}>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs">Order changed</Text>
                  <Button size="xs" onClick={handleSaveOrder} loading={isSavingOrder}>
                    Save order
                  </Button>
                </Group>
              </Alert>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
};
