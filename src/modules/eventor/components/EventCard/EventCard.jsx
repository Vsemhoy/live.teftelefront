import { Paper, Text, Group, Box, Tooltip } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useEventorStore } from '../../store/eventorStore';
import { MdPreview } from '@/shared/components/MdRenderer';

export const EventCard = ({ event, isDraft = false }) => {
  const { openReader } = useEventorStore();

  const typeColor = event.type_bgcolor ? event.type_bgcolor.substring(0, 7) : null;

  // Двойной клик → просмотр
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isDraft) {
      openReader({ draft: { ...event } });
    } else {
      openReader({ id: event.id, event });
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
        borderLeftColor: typeColor || 'var(--mantine-color-gray-3)',
        borderLeftWidth: 3,
        userSelect: 'none',
      }}
    >
      <Group justify="space-between" mb={event.name ? 4 : 0} wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isDraft && <span className="draft-badge">Draft</span>}
          {event.is_locked && (
            <Tooltip label="Locked">
              <IconLock size={12} color="var(--mantine-color-gray-5)" />
            </Tooltip>
          )}
          {event.name && (
            <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{event.name}</Text>
          )}
        </Group>
      </Group>

      {/* MD превью — теперь с таблицами и mermaid */}
      <MdPreview content={event.content} />
    </Paper>
  );
};
