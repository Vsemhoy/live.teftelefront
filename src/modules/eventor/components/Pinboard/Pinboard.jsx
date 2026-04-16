import { useState } from 'react';
import { Drawer, Stack, Text, Group, Badge, ScrollArea, Center, Loader } from '@mantine/core';
import { IconPin } from '@tabler/icons-react';
import { usePinnedEvents } from '../../api/eventorApi';
import { EventCard } from '../EventCard/EventCard';

// ─── Кубик в левом нижнем углу ───────────────────────────────────
export const PinboardButton = () => {
  const [opened, setOpened] = useState(false);
  const { data: pinned = [], isLoading } = usePinnedEvents();

  const count = pinned.length;
  if (!isLoading && count === 0) return null;

  return (
    <>
      {/* Кубик */}
      <button
        onClick={() => setOpened(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 200,
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'var(--mantine-color-yellow-4)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          flexDirection: 'column',
          gap: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
        }}
        title="Pinned events"
      >
        <IconPin size={18} color="white" />
        {count > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
            {count}
          </span>
        )}
      </button>

      {/* Дровер с закрепами */}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="left"
        size="sm"
        title={
          <Group gap={8}>
            <IconPin size={16} color="var(--mantine-color-yellow-5)" />
            <Text fw={600} size="sm">Pinned</Text>
            <Badge size="sm" color="yellow" variant="light">{count}</Badge>
          </Group>
        }
        styles={{ body: { padding: 0 } }}
      >
        {isLoading ? (
          <Center h={200}><Loader size="sm" /></Center>
        ) : count === 0 ? (
          <Center h={200}>
            <Text c="dimmed" size="sm">No pinned events</Text>
          </Center>
        ) : (
          <ScrollArea h="calc(100vh - 60px)" p="md">
            <Stack gap={8}>
              {pinned.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Drawer>
    </>
  );
};
