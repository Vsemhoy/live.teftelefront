import { Paper, Text, Group, Box, Tooltip, Menu, ActionIcon } from '@mantine/core';
import {
  IconLock, IconDotsVertical, IconEdit, IconTrash,
  IconCircleDashed, IconPin, IconPinnedOff,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEventorStore } from '../../store/eventorStore';
import { useDeleteEvent, useTogglePin } from '../../api/eventorApi';
import { MdPreview } from '@/shared/components/MdRenderer';
import { getTypeIconBySlug } from '@/shared/utils/typeIcons';

export const EventCard = ({ event, isDraft = false }) => {
  const { openReader, openEditor } = useEventorStore();
  const { mutateAsync: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutateAsync: togglePin, isPending: isSaving } = useTogglePin();

  const typeBgcolor  = event.evt_type?.bgcolor || null;
  const sectionColor = event.section?.bgcolor || 'var(--mantine-color-gray-3)';
  const TypeIcon     = event.evt_type?.icon ? getTypeIconBySlug(event.evt_type.icon) : IconCircleDashed;

  const isLocked  = Boolean(event.is_locked);
  const isBlurred = Boolean(event.is_blurred);
  const isPinned  = Boolean(event.is_pinned);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isDraft) openReader({ draft: { ...event } });
    else         openReader({ id: event.id, event });
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!event.id) return;
    openEditor({ id: event.id });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!event.id) return;
    if (!window.confirm('Are you sure? This action is irreversible.')) return;
    try {
      await deleteEvent(event.id);
      notifications.show({ title: 'Deleted', message: 'Event removed', color: 'red' });
    } catch (err) {
      notifications.show({ title: 'Delete failed', message: err.message, color: 'red' });
    }
  };

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    if (!event.id) return;
    try {
      await togglePin(event.id);
      notifications.show({
        message: isPinned ? 'Unpinned' : 'Pinned!',
        color: isPinned ? 'gray' : 'yellow',
        autoClose: 1500,
      });
    } catch (err) {
      notifications.show({ message: 'Failed', color: 'red' });
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
        ...(isPinned && { outline: '1.5px solid var(--mantine-color-yellow-4)' }),
      }}
    >
      <Group justify="space-between" mb={event.content ? 4 : 0} wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isDraft && <span className="draft-badge">Draft</span>}

          <Tooltip label={event.evt_type?.name || 'No type'} withArrow>
            <TypeIcon size={13} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
          </Tooltip>

          {isLocked && (
            <Tooltip label="Locked">
              <IconLock size={12} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
            </Tooltip>
          )}

          {isPinned && (
            <Tooltip label="Pinned">
              <IconPin size={12} color="var(--mantine-color-yellow-5)" style={{ flexShrink: 0 }} />
            </Tooltip>
          )}

          <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
            {event.name || <Text component="span" c="dimmed" fw={400}>Untitled</Text>}
          </Text>
        </Group>

        <Menu width={160} withArrow position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="sm"
              onClick={(e) => e.stopPropagation()} aria-label="Card actions">
              <IconDotsVertical size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={handleEdit}>
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={isPinned
                ? <IconPinnedOff size={14} />
                : <IconPin size={14} />}
              onClick={handleTogglePin}
              disabled={isSaving}
            >
              {isPinned ? 'Unpin' : 'Pin'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />}
              onClick={handleDelete} disabled={isDeleting}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <MdPreview content={event.content} blurred={isBlurred} />

      {event.tags?.length > 0 && (
        <Group gap={4} mt={6} wrap="wrap">
          {event.tags.map((tag) => (
            <Box key={tag.id} style={{
              background: tag.bgcolor || 'var(--mantine-color-gray-1)',
              color: tag.color || 'var(--mantine-color-dark-6)',
              borderRadius: 4, padding: '1px 7px',
              fontSize: 11, fontWeight: 500,
              lineHeight: '18px', whiteSpace: 'nowrap',
            }}>
              {tag.name}
            </Box>
          ))}
        </Group>
      )}
    </Paper>
  );
};
