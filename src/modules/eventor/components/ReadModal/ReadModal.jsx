import { Modal, Text, Group, Badge, Box, Divider, ActionIcon, Tooltip, Loader, Center, Button, Skeleton } from '@mantine/core';
import { IconEdit, IconCalendar, IconFolder } from '@tabler/icons-react';
import { MdFull } from '@/shared/components/MdRenderer';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useEventorStore } from '../../store/eventorStore';
import { useEvent } from '../../api/eventorApi';

export const ReadModal = () => {
  const { readerOpen, readerData, closeReader, openEditorFromReader } = useEventorStore();

  // Режим: черновик или серверное событие
  const isDraft = !readerData?.id && !!readerData?.draft;
  const eventId = readerData?.id || null;

  // Грузим с сервера только если есть id
  const { data: serverEvent, isLoading } = useEvent(eventId);
  const event = isDraft ? readerData.draft : serverEvent;

  const typeColor = event?.type_bgcolor ? event.type_bgcolor.substring(0, 7) : null;

  const handleEdit = () => {
    if (isDraft) {
      openEditorFromReader({
        id: null,
        draftLocalId: event.localId,
        _draftData: { ...event },
      });
    } else {
      openEditorFromReader({ id: readerData?.id });
    }
  };

  return (
    <Modal
      opened={readerOpen}
      onClose={closeReader}
      size="xl"
      padding={0}
      radius="md"
      zIndex={1100}
      styles={{
        header: { padding: '16px 20px 12px', borderBottom: '1px solid var(--mantine-color-gray-2)' },
        body: { padding: 0 },
      }}
      title={
        isLoading && !isDraft ? (
          <Text size="sm" c="dimmed">Loading…</Text>
        ) : (
          <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {isDraft && <span className="draft-badge">Draft</span>}
            {typeColor && (
              <Box style={{ width: 4, minWidth: 4, height: 20, borderRadius: 2, background: typeColor, flexShrink: 0 }} />
            )}
            <Text fw={700} size="md" style={{ flex: 1 }} lineClamp={1}>
              {event?.name || <Text component="span" c="dimmed" fw={400} size="md">Untitled</Text>}
            </Text>
          </Group>
        )
      }
    >
      {isLoading && !isDraft ? (
        <Center h={240}><Loader size="sm" /></Center>
      ) : !event ? (
        <Center h={240}><Text size="sm" c="dimmed">Not found</Text></Center>
      ) : (
        <>
          {/* Мета-строка */}
          <Group px={20} py={10} gap={16} style={{ background: 'var(--mantine-color-gray-0)', borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            {event.setdate && (
              <Group gap={6}>
                <IconCalendar size={13} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">{dayjs(event.setdate).format('D MMMM YYYY')}</Text>
              </Group>
            )}
            {event.section_name && (
              <Group gap={6}>
                <IconFolder size={13} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">{event.section_name}</Text>
              </Group>
            )}
            {event.type_name && (
              <Badge size="xs" variant="dot"
                color={typeColor ? undefined : 'gray'}
                style={typeColor ? { '--badge-dot-size': '7px', '--badge-color': typeColor } : {}}>
                {event.type_name}
              </Badge>
            )}
            <Box style={{ flex: 1 }} />
            <Tooltip label="Edit" withArrow>
              <ActionIcon variant="light" color="blue" size="sm" onClick={handleEdit}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Контент */}
          <Box px={28} py={20} style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
            {event.content ? (
              <MdFull content={event.content} />
            ) : (
              <Center h={100}><Text size="sm" c="dimmed">No content</Text></Center>
            )}
          </Box>
        </>
      )}
    </Modal>
  );
};
