import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Box, Group, ActionIcon, Button } from '@mantine/core';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { useDocuments, useReorderDocuments, useDeleteDocument } from '@/modules/booker/api/bookerApi';

const SortableDoc = ({ doc, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doc.id });

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
        variant="subtle"
        color="gray"
        size="sm"
        style={{ cursor: 'grab', touchAction: 'none' }}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={14} />
      </ActionIcon>
      <Text size="sm" style={{ flex: 1 }}>{doc.title}</Text>
      <Text size="xs" c="dimmed">{doc.block_count ?? 0} blocks</Text>
      <ActionIcon
        variant="subtle"
        color="red"
        size="sm"
        onClick={() => onDelete(doc.id)}
      >
        <IconTrash size={13} />
      </ActionIcon>
    </Box>
  );
};

export const DocStructureModal = () => {
  const { docStructureOpen, docStructureBookId, closeDocStructure } = useBookerStore();
  const { data: docs = [] } = useDocuments(docStructureBookId);
  const { mutate: reorder } = useReorderDocuments();
  const { mutate: deleteDoc } = useDeleteDocument();

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (docs.length) setItems([...docs]);
  }, [docs]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((d) => d.id === active.id);
    const newIdx = items.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    reorder({
      bookId: docStructureBookId,
      order: reordered.map((d, i) => ({ id: d.id, sort_order: i + 1 })),
    });
  };

  const handleDelete = (id) => {
    deleteDoc({ id, bookId: docStructureBookId });
    setItems((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <Modal
      opened={docStructureOpen}
      onClose={closeDocStructure}
      title="Document structure"
      size="sm"
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <Stack gap={4}>
            {items.map((doc) => (
              <SortableDoc key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
      <Group justify="flex-end" mt="md">
        <Button variant="subtle" color="gray" onClick={closeDocStructure}>Close</Button>
      </Group>
    </Modal>
  );
};
