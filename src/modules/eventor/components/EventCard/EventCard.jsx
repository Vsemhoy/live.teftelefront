import { Paper, Text, Group, Tooltip, Menu, ActionIcon } from '@mantine/core';
import { IconLock, IconDotsVertical, IconEdit, IconTrash, IconCircleDashed } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEventorStore } from '../../store/eventorStore';
import { useDeleteEvent } from '../../api/eventorApi';
import { MdPreview } from '@/shared/components/MdRenderer';
import { getTypeIconBySlug } from '@/shared/utils/typeIcons';

export const EventCard = ({ event, isDraft = false }) => {
  const { openReader, openEditor } = useEventorStore();
  const { mutateAsync: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  // Цвет типа — фон карточки
  const typeBgcolor  = event.evt_type?.bgcolor || null;

  // Цвет секции — левый бордер
  const sectionColor = event.section?.bgcolor || 'var(--mantine-color-gray-3)';

  // Иконка типа
  const TypeIcon = event.evt_type?.icon
    ? getTypeIconBySlug(event.evt_type.icon)
    : IconCircleDashed;

  // Флаги — бэк отдаёт 0/1
  const isLocked  = Boolean(event.is_locked);
  const isBlurred = Boolean(event.is_blurred);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isDraft) {
      openReader({ draft: { ...event } });
    } else {
      openReader({ id: event.id, event });
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!event.id) return;
    openEditor({ id: event.id });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!event.id) return;
    const isConfirmed = window.confirm('Are you sure? This action is irreversible.');
    if (!isConfirmed) return;
    try {
      await deleteEvent(event.id);
      notifications.show({ title: 'Deleted', message: 'Event removed', color: 'red' });
    } catch (err) {
      notifications.show({ title: 'Delete failed', message: err.message, color: 'red' });
    }
  };

  return (
    <Paper
      className="event-card"
      shadow="none"
      p={10}
      withBorder
      onDoubleClick={handleDoubleClick}
      title="Double-click to view"
      style={{
        borderLeftColor: sectionColor,
        borderLeftWidth: 3,
        userSelect: 'none',
        ...(typeBgcolor && { background: typeBgcolor }),
      }}
    >
      <Group justify="space-between" mb={event.content ? 4 : 0} wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isDraft && <span className="draft-badge">Draft</span>}

          {/* Иконка типа */}
          <Tooltip label={event.evt_type?.name || 'No type'} withArrow>
            <TypeIcon size={13} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
          </Tooltip>

          {isLocked && (
            <Tooltip label="Locked">
              <IconLock size={12} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
            </Tooltip>
          )}

          <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
            {event.name || <Text component="span" c="dimmed" fw={400}>Untitled</Text>}
          </Text>
        </Group>

        <Menu width={150} withArrow position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              aria-label="Card actions"
            >
              <IconDotsVertical size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={handleEdit}>
              Edit
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <MdPreview content={event.content} blurred={isBlurred} />
    </Paper>
  );
};
