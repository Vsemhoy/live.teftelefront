import { useState } from 'react';
import { Drawer, Stack, Text, Group, Badge, ScrollArea, Center, Loader } from '@mantine/core';
import { IconPin } from '@tabler/icons-react';
import { usePinnedEvents } from '../../api/eventorApi';
import { EventCard } from '../EventCard/EventCard';

export const PinboardButton = ({ blockingOverlayOpen = false }) => {
  const [opened, setOpened] = useState(false);
  const { data: pinned = [], isLoading } = usePinnedEvents();

  const count = pinned.length;
  const hideTrigger = blockingOverlayOpen || opened;

  if (!isLoading && count === 0) return null;

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          className="pinboard-corner-trigger"
          onClick={() => setOpened(true)}
          title="Pinned events"
          aria-label="Pinned events"
        >
          <IconPin size={13} />
          {count > 0 && <span>{count}</span>}
        </button>
      )}

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
