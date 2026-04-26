import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Text, Group, Badge, ActionIcon, Tooltip,
  Loader, Center, Divider, Stack, Paper, Anchor, Drawer,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconArrowLeft, IconChevronUp, IconChevronDown,
  IconLink, IconGitFork, IconLock, IconCalendar,
  IconFolder, IconEdit, IconLayoutSidebarRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MdFull } from '@/shared/components/MdRenderer';
import api from '@/shared/utils/api';
import { useAuthStore } from '@/modules/auth/authStore';
import { useEventorStore } from '../../store/eventorStore';

const fetchPublicEvent = async (id) => {
  const res = await api.get(`/opn/eventor/e/${id}`);
  return res.data?.content ?? null;
};

const usePublicEvent = (id) => useQuery({
  queryKey: ['public_event', id],
  queryFn: () => fetchPublicEvent(id),
  enabled: Boolean(id),
  retry: false,
});

// ── Контент сайдбара (переиспользуется в Drawer и в десктопном сайдбаре) ──
const SidebarContent = ({ event, navigate, openEditor, isOwner }) => (
  <Stack gap={20} p="md">
    {event.user && (
      <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>Author</Text>
        <Text size="sm">{event.user.name}</Text>
      </Box>
    )}

    {event.parent && (
      <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>Part of</Text>
        <Paper withBorder p="xs" style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/e/${event.parent.id}`)}>
          <Group gap={6}>
            <IconChevronUp size={12} style={{ color: 'var(--mantine-color-gray-5)', flexShrink: 0 }} />
            <Text size="xs" lineClamp={2}>{event.parent.name}</Text>
          </Group>
        </Paper>
      </Box>
    )}

    {event.children?.length > 0 && (
      <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>
          Child entries ({event.children.length})
        </Text>
        <Stack gap={6}>
          {event.children.map((child) => (
            <Paper key={child.id} withBorder p="xs"
              style={{ cursor: 'pointer', borderLeft: '3px solid var(--mantine-color-blue-4)' }}
              onClick={() => navigate(`/e/${child.id}`)}>
              <Group gap={6} justify="space-between">
                <Box style={{ minWidth: 0 }}>
                  <Text size="xs" fw={600} lineClamp={2}>{child.name || 'Untitled'}</Text>
                  {child.setdate && (
                    <Text size="xs" c="dimmed">{dayjs(child.setdate).format('D MMM YYYY')}</Text>
                  )}
                </Box>
                <IconChevronDown size={12}
                  style={{ color: 'var(--mantine-color-gray-4)', transform: 'rotate(-90deg)', flexShrink: 0 }} />
              </Group>
            </Paper>
          ))}
        </Stack>
      </Box>
    )}

    {isOwner && (
      <>
        <Divider />
        <Anchor size="xs" c="dimmed"
          onClick={() => openEditor({ parent_id: event.id, section_id: event.section_id })}>
          <Group gap={4}>
            <IconGitFork size={12} />
            Make child entry
          </Group>
        </Anchor>
      </>
    )}
  </Stack>
);

export const EventPublicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { openEditor } = useEventorStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const { data: event, isLoading, isError } = usePublicEvent(id);

  const typeColor   = event?.type?.color   || event?.evt_type?.color   || null;
  const typeBgcolor = event?.type?.bgcolor || event?.evt_type?.bgcolor || null;
  const isOwner = user && event && user.id === event.user_id;
  const hasSidebar = event && (event.parent || event.children?.length > 0 || isOwner);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    notifications.show({ message: 'Link copied', color: 'teal', autoClose: 2000 });
  };

  if (isLoading) return <Center h="100vh"><Loader size="sm" /></Center>;

  if (isError || !event) {
    return (
      <Center h="100vh">
        <Stack align="center" gap={8}>
          <IconLock size={32} style={{ color: 'var(--mantine-color-gray-4)' }} />
          <Text size="sm" c="dimmed">Event not found or access denied</Text>
          <Anchor size="xs" onClick={() => navigate(-1)}>← Back</Anchor>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--mantine-color-body)' }}>

      {/* Sticky topbar */}
      <Box style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        background: 'var(--mantine-color-body)',
        padding: '8px 16px',
      }}>
        <Group justify="space-between">
          <Group gap={6}>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate(-1)}>
              <IconArrowLeft size={15} />
            </ActionIcon>
            <Text size="xs" c="dimmed" truncate style={{ maxWidth: isMobile ? 200 : 400 }}>
              {event.name}
            </Text>
          </Group>

          <Group gap={6}>
            <Tooltip label="Copy link" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleCopyLink}>
                <IconLink size={14} />
              </ActionIcon>
            </Tooltip>

            {isOwner && (
              <Tooltip label="Edit" withArrow>
                <ActionIcon variant="light" color="blue" size="sm"
                  onClick={() => openEditor({ id: event.id })}>
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Кнопка drawer — только на мобилке если есть что показать */}
            {isMobile && hasSidebar && (
              <Tooltip label="Info" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={openDrawer}>
                  <IconLayoutSidebarRight size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Box>

      {/* Drawer для мобилки */}
      <Drawer
        opened={drawerOpen}
        onClose={closeDrawer}
        position="right"
        size="sm"
        title={<Text size="sm" fw={600}>Info</Text>}
        styles={{ body: { padding: 0 } }}
      >
        <SidebarContent
          event={event}
          navigate={(path) => { closeDrawer(); navigate(path); }}
          openEditor={(params) => { closeDrawer(); openEditor(params); }}
          isOwner={isOwner}
        />
      </Drawer>

      {/* Основной layout */}
      <Box style={{
        display: 'flex',
        justifyContent: 'center',  // центрируем весь блок
        padding: '40px 20px 80px',
      }}>
        {/* Внутренний контейнер — бади + сайдбар */}
        <Box style={{
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: hasSidebar ? 1100 : 860,
          gap: 48,
        }}>

        {/* Контент — основная колонка */}
        <Box style={{ flex: 1, minWidth: 0, maxWidth: 800 }}>

          {/* Breadcrumb */}
          {event.parent && (
            <Group gap={6} mb={20}>
              <IconChevronUp size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Anchor size="xs" onClick={() => navigate(`/e/${event.parent.id}`)}>
                {event.parent.name}
              </Anchor>
            </Group>
          )}

          {/* Заголовок */}
          <Group gap={10} mb={10} align="flex-start">
            {typeBgcolor && (
              <Box style={{
                width: 4, minWidth: 4, height: 32,
                borderRadius: 2, background: typeBgcolor,
                marginTop: 5, flexShrink: 0,
              }} />
            )}
            <Text fw={700} style={{ fontSize: 26, lineHeight: 1.3, flex: 1 }}>
              {event.name || <Text component="span" c="dimmed" fw={400}>Untitled</Text>}
            </Text>
          </Group>

          {/* Мета */}
          <Group gap={12} mb={28} wrap="wrap">
            {event.setdate && (
              <Group gap={5}>
                <IconCalendar size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
                <Text size="xs" c="dimmed">{dayjs(event.setdate).format('D MMMM YYYY')}</Text>
              </Group>
            )}
            {event.section?.name && (
              <Group gap={5}>
                <IconFolder size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
                <Text size="xs" c="dimmed">{event.section.name}</Text>
              </Group>
            )}
            {event.type?.name && (
              <Badge size="xs" variant="dot"
                style={typeColor ? { '--badge-dot-size': '7px', '--badge-color': typeColor } : {}}>
                {event.type.name}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Box key={tag.id} style={{
                background: tag.bgcolor || 'var(--mantine-color-gray-1)',
                color: tag.color || 'var(--mantine-color-dark-6)',
                borderRadius: 4, padding: '1px 7px',
                fontSize: 11, fontWeight: 500, lineHeight: '18px',
              }}>
                {tag.name}
              </Box>
            ))}
          </Group>

          <Divider mb={28} />

          {/* Markdown */}
          {event.content
            ? <MdFull content={event.content} />
            : <Text size="sm" c="dimmed">No content</Text>
          }
        </Box>

        {/* Правый сайдбар — только десктоп */}
        {!isMobile && hasSidebar && (
          <Box style={{
            width: 240, flexShrink: 0,
            position: 'sticky', top: 56,
            borderLeft: '1px solid var(--mantine-color-gray-2)',
          }}>
            <SidebarContent
              event={event}
              navigate={navigate}
              openEditor={openEditor}
              isOwner={isOwner}
            />
          </Box>
        )}
        </Box> {/* внутренний контейнер */}
      </Box>   {/* внешний layout */}
    </Box>
  );
};
