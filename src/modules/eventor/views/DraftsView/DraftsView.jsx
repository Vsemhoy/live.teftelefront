import { useState } from 'react';
import {
  Stack, Text, Paper, Group, Button, Badge,
  ActionIcon, Center, Alert, Box, Divider, Tooltip,
} from '@mantine/core';
import {
  IconCloudUpload, IconTrash, IconEdit,
  IconAlertCircle, IconCheck, IconX, IconEye,
} from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import db, { deleteDraft, markDraftError } from '@/shared/utils/db';
import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useSaveEvent } from '../../api/eventorApi';
import { useEventorStore } from '../../store/eventorStore';
import Masonry from 'react-masonry-css';
import { useMasonryColumns } from '@/shared/hooks/useMasonryColumns';

const DraftCard = ({ draft, onSync, onView, onEdit, onDelete, isSyncing }) => {
  const date = dayjs(draft.occurred_at).format('D MMM YYYY');
  const createdAt = dayjs(draft.created_at).format('D MMM, HH:mm');

  return (
    <Paper p={12} withBorder radius="sm"
      style={{ borderLeft: '3px solid var(--mantine-color-orange-4)', cursor: 'pointer' }}
      onDoubleClick={() => onView(draft)}
      title="Double-click to view">
      <Group justify="space-between" mb={4} wrap="nowrap">
        <Group gap={8}>
          <span className="draft-badge">Draft</span>
          {draft.syncStatus === 'error' && (
            <Tooltip label={draft.errorMsg || 'Sync failed'} withArrow>
              <IconAlertCircle size={14} color="var(--mantine-color-red-6)" />
            </Tooltip>
          )}
          <Text size="sm" fw={600} lineClamp={1}>
            {draft.name || <Text component="span" c="dimmed" fw={400}>Untitled</Text>}
          </Text>
        </Group>
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{date}</Text>
      </Group>

      {draft.content && (
        <Text size="xs" c="dimmed" lineClamp={2} mb={8}>
          {draft.content.replace(/[#*`_~\[\]]/g, '').substring(0, 200)}
        </Text>
      )}

      {draft.syncStatus === 'error' && draft.errorMsg && (
        <Alert color="red" variant="light" py={4} px={8} mb={8} radius="xs">
          <Text size="xs">{draft.errorMsg}</Text>
        </Alert>
      )}

      <Group justify="space-between">
        <Text size="xs" c="dimmed">Created {createdAt}</Text>
        <Group gap={6}>
          {/* Просмотр */}
          <Tooltip label="View" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm"
              onClick={(e) => { e.stopPropagation(); onView(draft); }}>
              <IconEye size={13} />
            </ActionIcon>
          </Tooltip>
          {/* Редактировать — напрямую в редактор */}
          <Tooltip label="Edit" withArrow>
            <ActionIcon variant="subtle" color="blue" size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(draft); }}>
              <IconEdit size={13} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow>
            <ActionIcon variant="subtle" color="red" size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(draft.localId); }}>
              <IconTrash size={13} />
            </ActionIcon>
          </Tooltip>
          <Button size="compact-xs" variant="light" color="blue"
            leftSection={<IconCloudUpload size={12} />}
            onClick={(e) => { e.stopPropagation(); onSync(draft); }}
            loading={isSyncing === draft.localId}>
            Upload
          </Button>
        </Group>
      </Group>
    </Paper>
  );
};

export const DraftsView = () => {
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();
  const { openEditor, openReader } = useEventorStore();
  const { mutateAsync: saveEvent } = useSaveEvent();
  const [syncingId, setSyncingId] = useState(null);
  const { ref: containerRef, columns: masonryColumns } = useMasonryColumns(650);

  const drafts = useLiveQuery(
    () => db.drafts.orderBy('created_at').reverse().toArray(),
    []
  ) ?? [];

  const pendingCount = drafts.filter((d) => d.syncStatus !== 'synced').length;

  const handleSync = async (draft) => {
    if (!user) { notifications.show({ title: 'Sign in required', message: 'Please sign in to sync', color: 'orange' }); return; }
    if (!isOnline) { notifications.show({ title: 'No connection', message: 'Cannot sync now', color: 'red' }); return; }
    setSyncingId(draft.localId);
    try {
      await saveEvent({ name: draft.name, content: draft.content, occurred_at: draft.occurred_at, section_id: draft.section_id, type_id: draft.type_id });
      await deleteDraft(draft.localId);
      notifications.show({ title: 'Synced', message: draft.name || 'Draft uploaded', color: 'green' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      await markDraftError(draft.localId, msg);
      notifications.show({ title: 'Sync failed', message: msg, color: 'red' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (localId) => {
    await deleteDraft(localId);
    notifications.show({ message: 'Draft deleted', color: 'gray' });
  };

  // Двойной клик / кнопка 👁 → reader (просмотр)
  const handleView = (draft) => openReader({ draft: { ...draft } });

  // Кнопка ✏️ → редактор напрямую с данными черновика
  const handleEdit = (draft) => {
    openEditor({
      id: null,
      draftLocalId: draft.localId,
      _draftData: { ...draft },
    });
  };

  return (
    <div className="content-scroll" ref={containerRef}>
      <Box px={16} pt={12} pb={40}>
        <Group justify="space-between" mb={12}>
          <Group gap={8}>
            <Text size="sm" fw={600}>Local drafts</Text>
            {pendingCount > 0 && <Badge size="sm" color="orange" variant="filled">{pendingCount}</Badge>}
          </Group>
        </Group>

        {!isOnline && <Alert icon={<IconAlertCircle size={14} />} color="orange" variant="light" mb={12} radius="sm"><Text size="xs">Offline. Drafts will sync when connection is restored.</Text></Alert>}
        {!user && isOnline && <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light" mb={12} radius="sm"><Text size="xs">Sign in to upload drafts to the server.</Text></Alert>}

        <Divider mb={12} />

        {drafts.length === 0 && (
          <Center h={140}>
            <Stack align="center" gap={6}>
              <IconCheck size={32} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">No local drafts</Text>
            </Stack>
          </Center>
        )}

        {masonryColumns === 1 ? (
          <Stack gap={8}>
            {drafts.map((draft) => (
              <DraftCard key={draft.localId} draft={draft}
                onSync={handleSync} onView={handleView} onEdit={handleEdit}
                onDelete={handleDelete} isSyncing={syncingId} />
            ))}
          </Stack>
        ) : (
          <Masonry
            breakpointCols={{ default: masonryColumns }}
            className="masonry-grid"
            columnClassName="masonry-grid-col"
          >
            {drafts.map((draft) => (
              <DraftCard key={draft.localId} draft={draft}
                onSync={handleSync} onView={handleView} onEdit={handleEdit}
                onDelete={handleDelete} isSyncing={syncingId} />
            ))}
          </Masonry>
        )}
      </Box>
    </div>
  );
};
