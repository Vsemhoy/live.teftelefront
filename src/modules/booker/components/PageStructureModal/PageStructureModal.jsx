import { useEffect, useState } from 'react';
import { Menu, Modal, Stack, Text, Box, Group, ActionIcon, Button } from '@mantine/core';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconDots, IconEye, IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { usePages, useReorderPages, useDeletePage, useSavePage } from '@/modules/booker/api/bookerApi';
import { VISIBILITY_OPTIONS } from '@/modules/booker/utils/bookerUtils';

const SortablePage = ({ page, onDelete, onVisibilityChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: 'var(--mantine-color-body)',
        border: '0.5px solid var(--mantine-color-default-border)',
        borderRadius: 8,
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <ActionIcon
        variant="subtle" color="gray" size="sm"
        style={{ cursor: 'grab', touchAction: 'none' }}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={14} />
      </ActionIcon>
      <Text size="sm" style={{ flex: 1 }}>{page.title}</Text>
      <Text size="xs" c="dimmed">{page.block_groups_count ?? 0} blocks</Text>
      <Menu withinPortal position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="sm">
            <IconDots size={13} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Visibility</Menu.Label>
          {VISIBILITY_OPTIONS.map((option) => (
            <Menu.Item
              key={option.value}
              leftSection={<IconEye size={14} />}
              onClick={() => onVisibilityChange(page.id, option.value)}
            >
              {option.label}{page.visibility === option.value ? ' *' : ''}
            </Menu.Item>
          ))}
          <Menu.Divider />
          <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => onDelete(page.id)}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
};

export const PageStructureModal = () => {
  const { pageStructureOpen, pageStructureBookId, closePageStructure } = useBookerStore();
  const { data: pages = [] } = usePages(pageStructureBookId);
  const { mutate: reorder } = useReorderPages();
  const { mutate: deletePage } = useDeletePage();
  const { mutate: savePage } = useSavePage();

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (pages.length) setItems([...pages]);
  }, [pages]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((p) => p.id === active.id);
    const newIdx = items.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    reorder({
      items: reordered.map((p, i) => ({ id: p.id, sort_order: i + 1, parent_id: p.parent_id })),
    });
  };

  const handleDelete = (id) => {
    deletePage({ id });
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleVisibilityChange = (id, visibility) => {
    savePage({ id, visibility });
    setItems((prev) => prev.map((page) => (
      page.id === id ? { ...page, visibility } : page
    )));
  };

  return (
    <Modal opened={pageStructureOpen} onClose={closePageStructure} title="Page structure" size="sm">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={4}>
            {items.map((page) => (
              <SortablePage
                key={page.id}
                page={page}
                onDelete={handleDelete}
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      <Group justify="flex-end" mt="md">
        <Button variant="subtle" color="gray" onClick={closePageStructure}>Close</Button>
      </Group>
    </Modal>
  );
};
