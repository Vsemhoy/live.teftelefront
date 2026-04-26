import { Modal, Text, Group, Badge, Box, Divider, ActionIcon, Tooltip, Loader, Center, Stack, Paper, Anchor } from '@mantine/core';
import { IconEdit, IconCalendar, IconFolder, IconChevronUp, IconChevronDown, IconLink, IconGitFork } from '@tabler/icons-react';
import { MdFull } from '@/shared/components/MdRenderer';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useEventorStore } from '../../store/eventorStore';
import { useEvent } from '../../api/eventorApi';

export const ReadModal = () => {
  const { readerOpen, readerData, closeReader, openEditorFromReader, openReader, openEditor } = useEventorStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  const isDraft = !readerData?.id && !!readerData?.draft;
  const eventId = readerData?.id || null;

  const { data: serverEvent, isLoading } = useEvent(eventId);
  const event = isDraft ? readerData.draft : serverEvent;

  const typeColor = event?.evt_type?.color || null;
  const typeBgcolor = event?.evt_type?.bgcolor || null;

  const handleEdit = () => {
    if (isDraft) {
      openEditorFromReader({ id: null, draftLocalId: event.localId, _draftData: { ...event } });
    } else {
      openEditorFromReader({ id: readerData?.id });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/e/${event.id}`;
    navigator.clipboard.writeText(url);
    notifications.show({ message: 'Ссылка скопирована', color: 'teal', autoClose: 2000 });
  };

  const handleOpenPublic = () => {
    closeReader();
    navigate(`/e/${event.id}`);
  };

  const handleCreateChild = () => {
    closeReader();
    openEditor({ parent_id: event.id, date: event.setdate?.slice(0, 10), section_id: event.section_id });
  };

  return (
    <Modal
      opened={readerOpen}
      onClose={closeReader}
      fullScreen={isMobile}
      size="xl"
      padding={0}
      radius={isMobile ? 0 : 'md'}
      zIndex={1100}
      className="read-modal"
      styles={{
        content: {
          height: isMobile ? '100vh' : 'auto',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
        header: { padding: '16px 20px 12px', borderBottom: '1px solid var(--mantine-color-gray-2)' },
        body: { padding: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
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
          <Group px={20} py={10} gap={12} wrap="wrap" style={{ background: 'var(--mantine-color-gray-0)', borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            {event.setdate && (
              <Group gap={6}>
                <IconCalendar size={13} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">{dayjs(event.setdate).format('D MMMM YYYY')}</Text>
              </Group>
            )}
            {event.section?.name && (
              <Group gap={6}>
                <IconFolder size={13} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">{event.section.name}</Text>
              </Group>
            )}
            {event.evt_type?.name && (
              <Badge size="xs" variant="dot"
                style={typeColor ? { '--badge-dot-size': '7px', '--badge-color': typeColor } : {}}>
                {event.evt_type.name}
              </Badge>
            )}
            <Box style={{ flex: 1 }} />

            {/* Родитель */}
            {event.parent && (
              <Tooltip label={`Родитель: ${event.parent.name}`} withArrow>
                <ActionIcon variant="light" color="gray" size="sm"
                  onClick={() => openReader({ id: event.parent.id })}>
                  <IconChevronUp size={13} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Дочерние */}
            {event.children?.length > 0 && (
              <Tooltip label={`${event.children.length} дочерних`} withArrow>
                <Badge size="sm" variant="light" color="blue" style={{ cursor: 'pointer' }}
                  leftSection={<IconChevronDown size={11} />}
                  onClick={() => document.getElementById('read-modal-children')?.scrollIntoView({ behavior: 'smooth' })}>
                  {event.children.length}
                </Badge>
              </Tooltip>
            )}

            {/* Создать дочернюю */}
            {!isDraft && (
              <Tooltip label="Make child" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleCreateChild}>
                  <IconGitFork size={13} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Ссылка */}
            {!isDraft && (
              <Tooltip label="Copy link" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleCopyLink}>
                  <IconLink size={13} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Редактировать */}
            <Tooltip label="Edit" withArrow>
              <ActionIcon variant="light" color="blue" size="sm" onClick={handleEdit}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Контент */}
          <Box
            px={isMobile ? 14 : 28}
            py={isMobile ? 12 : 20}
            style={{ flex: 1, minHeight: 0, maxHeight: isMobile ? 'none' : '65vh', overflowY: 'auto', overflowX: 'hidden' }}
          >
            {event.content ? (
              <MdFull content={event.content} />
            ) : (
              <Center h={100}><Text size="sm" c="dimmed">No content</Text></Center>
            )}

            {/* Дочерние записи */}
            {event.children?.length > 0 && (
              <Box id="read-modal-children" mt={32}>
                <Divider mb={16} label="Дочерние записи" labelPosition="left" />
                <Stack gap={8}>
                  {event.children.map((child) => (
                    <Paper key={child.id} withBorder p="sm"
                      style={{ cursor: 'pointer', borderLeft: '3px solid var(--mantine-color-blue-4)' }}
                      onClick={() => openReader({ id: child.id })}>
                      <Group justify="space-between">
                        <Box>
                          <Text size="sm" fw={600}>{child.name || 'Без названия'}</Text>
                          {child.setdate && (
                            <Text size="xs" c="dimmed">{dayjs(child.setdate).format('D MMMM YYYY')}</Text>
                          )}
                        </Box>
                        <IconChevronDown size={13} style={{ color: 'var(--mantine-color-gray-4)', transform: 'rotate(-90deg)' }} />
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </>
      )}
    </Modal>
  );
};
