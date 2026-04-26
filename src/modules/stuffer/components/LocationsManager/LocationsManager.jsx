import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, ActionIcon,
  Button, Box, Tooltip, Divider, Badge,
  Loader, Center,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconGripVertical, IconEdit, IconTrash, IconCheck,
  IconX, IconPlus, IconChevronRight, IconHome,
  IconCar, IconBuildingWarehouse, IconMapPin,
} from '@tabler/icons-react';
import {
  DndContext, closestCenter, PointerSensor,
  TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { notifications } from '@mantine/notifications';

import { useStufferStore } from '../../store/stufferStore';
import { useLocations, useSaveLocation, useDeleteLocation, useReorderLocations } from '../../api/stufferApi';

// ── Иконка по имени (как в сайдбаре) ─────────────────────────────
const LocationIcon = ({ name, size = 14 }) => {
  const n = (name || '').toLowerCase();
  if (n.includes('машин') || n.includes('авто') || n.includes('bmw') || n.includes('авт')) return <IconCar size={size} />;
  if (n.includes('гараж')) return <IconBuildingWarehouse size={size} />;
  if (n.includes('квартир') || n.includes('дом') || n.includes('офис')) return <IconHome size={size} />;
  return <IconMapPin size={size} />;
};

// ── Инлайн-форма создания/редактирования ─────────────────────────
const LocationForm = ({ loc, parentId, onSave, onCancel, isSaving }) => {
  const isNew = !loc?.id;
  const [name, setName] = useState(loc?.name || '');

  return (
    <Box
      p={10}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderRadius: 8,
        border: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Group gap={8}>
        <TextInput
          placeholder="Название локации..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="sm"
          style={{ flex: 1 }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSave({ ...(loc || {}), name: name.trim(), parent_id: parentId || loc?.parent_id || null });
            if (e.key === 'Escape') onCancel();
          }}
        />
        <ActionIcon size="sm" variant="subtle" color="gray" onClick={onCancel}>
          <IconX size={13} />
        </ActionIcon>
        <ActionIcon
          size="sm" color="blue"
          disabled={!name.trim()}
          loading={isSaving}
          onClick={() => name.trim() && onSave({ ...(loc || {}), name: name.trim(), parent_id: parentId || loc?.parent_id || null })}
        >
          <IconCheck size={13} />
        </ActionIcon>
      </Group>
    </Box>
  );
};

// ── Sortable строка локации ───────────────────────────────────────
const LocationRow = ({
  loc, depth = 0,
  onEdit, onDelete, onAddChild,
  editingId, setEditingId,
  saveLoc, isSaving,
  children,
}) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = children && children.length > 0;
  const isEditing = editingId === loc.id;

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: loc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {isEditing ? (
        <Box style={{ paddingLeft: depth * 20 }}>
          <LocationForm
            loc={loc}
            onSave={(data) => { saveLoc(data); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
          />
        </Box>
      ) : (
        <Group
          gap={4}
          style={{
            padding: `5px 6px 5px ${6 + depth * 20}px`,
            borderRadius: 6,
            background: isDragging ? 'var(--mantine-color-blue-0)' : 'transparent',
          }}
          className="location-row"
        >
          {/* Drag handle */}
          <div
            {...listeners}
            {...attributes}
            style={{ cursor: 'grab', touchAction: 'none', color: 'var(--mantine-color-gray-4)', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <IconGripVertical size={13} />
          </div>

          {/* Раскрытие */}
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            style={{ visibility: hasChildren ? 'visible' : 'hidden', flexShrink: 0 }}
            onClick={() => setOpen((v) => !v)}
          >
            <IconChevronRight
              size={12}
              style={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </ActionIcon>

          {/* Иконка + Имя */}
          <LocationIcon name={loc.name} size={13} />
          <Text size="sm" style={{ flex: 1 }} truncate>{loc.name}</Text>

          {/* Счётчик вложенных */}
          {hasChildren && (
            <Badge size="xs" variant="light" color="gray">{children.length}</Badge>
          )}

          {/* Действия — показываем при hover через CSS */}
          <Group gap={2} className="location-row-actions">
            <Tooltip label="Добавить вложенную" withArrow>
              <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => onAddChild(loc.id)}>
                <IconPlus size={11} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Переименовать" withArrow>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setEditingId(loc.id)}>
                <IconEdit size={11} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Удалить" withArrow>
              <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onDelete(loc)}>
                <IconTrash size={11} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      )}

      {/* Дочерние */}
      {open && hasChildren && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
};

// ── Рекурсивный рендер дерева ─────────────────────────────────────
const renderTree = (nodes, allNodes, depth, props) => {
  return nodes.map((node) => {
    const childNodes = allNodes.filter((n) => n.parent_id === node.id);
    return (
      <LocationRow key={node.id} loc={node} depth={depth} {...props}>
        {childNodes.length > 0
          ? renderTree(childNodes, allNodes, depth + 1, props)
          : null}
      </LocationRow>
    );
  });
};

// ── Главный компонент ─────────────────────────────────────────────
export const LocationsManager = () => {
  const { locationsOpen, closeLocations } = useStufferStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: locations = [], isLoading } = useLocations();
  const saveLocation    = useSaveLocation();
  const deleteLocation  = useDeleteLocation();
  const reorderLocations = useReorderLocations();

  const [editingId, setEditingId]   = useState(null);  // id редактируемой локации
  const [addingParentId, setAddingParentId] = useState(undefined); // undefined = не создаём, null = корень, 'id' = дочерняя
  const [localOrder, setLocalOrder] = useState([]);    // локальный порядок для DnD

  // Синхронизируем локальный порядок с данными
  useEffect(() => {
    setLocalOrder(locations);
  }, [locations]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleSave = (data) => {
    saveLocation.mutate(data, {
      onSuccess: () => {
        notifications.show({ message: data.id ? 'Переименовано' : 'Локация добавлена', color: 'green', autoClose: 2000 });
        setAddingParentId(undefined);
        setEditingId(null);
      },
      onError: () => notifications.show({ message: 'Ошибка', color: 'red' }),
    });
  };

  const handleDelete = (loc) => {
    if (!confirm(`Удалить «${loc.name}»?`)) return;
    deleteLocation.mutate(loc.id, {
      onSuccess: () => notifications.show({ message: 'Удалено', color: 'gray', autoClose: 2000 }),
      onError:  () => notifications.show({ message: 'Ошибка удаления', color: 'red' }),
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.findIndex((l) => l.id === active.id);
    const newIndex = localOrder.findIndex((l) => l.id === over.id);
    const newOrder = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(newOrder);

    reorderLocations.mutate(
      newOrder.map((l, i) => ({ id: l.id, sort_order: i + 1 })),
      { onError: () => setLocalOrder(locations) } // откат при ошибке
    );
  };

  // Корневые локации
  const roots = localOrder.filter((l) => !l.parent_id);

  const rowProps = {
    onEdit:       (id) => setEditingId(id),
    onDelete:     handleDelete,
    onAddChild:   (parentId) => { setAddingParentId(parentId); setEditingId(null); },
    editingId,
    setEditingId,
    saveLoc:      handleSave,
    isSaving:     saveLocation.isPending,
  };

  return (
    <>
      {/* Инлайн-стили для hover-эффектов */}
      <style>{`
        .location-row-actions { opacity: 0; transition: opacity 0.1s; }
        .location-row:hover .location-row-actions { opacity: 1; }
      `}</style>

      <Modal
        opened={locationsOpen}
        onClose={closeLocations}
        title={
          <Group gap={8}>
            <IconMapPin size={16} />
            <Text size="sm" fw={600}>Локации</Text>
          </Group>
        }
        size="sm"
        fullScreen={isMobile}
        centered={!isMobile}
      >
        <Stack gap={10}>

          {isLoading && (
            <Center py="xl"><Loader size="sm" /></Center>
          )}

          {!isLoading && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localOrder.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack gap={2}>
                  {renderTree(roots, localOrder, 0, rowProps)}

                  {/* Форма добавления вложенной (открывается при нажатии + на строке) */}
                  {addingParentId !== undefined && addingParentId !== null && (
                    <Box style={{ paddingLeft: 20 }}>
                      <LocationForm
                        parentId={addingParentId}
                        onSave={handleSave}
                        onCancel={() => setAddingParentId(undefined)}
                        isSaving={saveLocation.isPending}
                      />
                    </Box>
                  )}
                </Stack>
              </SortableContext>
            </DndContext>
          )}

          {!isLoading && locations.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Локаций пока нет
            </Text>
          )}

          <Divider />

          {/* Форма добавления корневой локации */}
          {addingParentId === null ? (
            <LocationForm
              onSave={handleSave}
              onCancel={() => setAddingParentId(undefined)}
              isSaving={saveLocation.isPending}
            />
          ) : (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={13} />}
              onClick={() => { setAddingParentId(null); setEditingId(null); }}
            >
              Добавить локацию
            </Button>
          )}

        </Stack>
      </Modal>
    </>
  );
};
