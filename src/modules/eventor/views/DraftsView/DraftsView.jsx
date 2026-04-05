import { useState } from 'react';
import {
  Stack, Text, Paper, Group, Button, Badge,
  ActionIcon, Center, Alert, Box, Divider,
  Tooltip,
} from '@mantine/core';
import {
  IconCloudUpload, IconTrash, IconEdit,
  IconAlertCircle, IconCheck, IconX,
} from '@tabler/icons-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import db, { deleteDraft, markDraftError } from '@/shared/utils/db';
import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useSaveEvent } from '../../api/eventorApi';
import { useEventorStore } from '../../store/eventorStore';

// Карточка одного черновика
const DraftCard = ({ draft, onSync, onEdit, onDelete, isSyncing }) => {
  const date = dayjs(draft.setdate).format('D MMM YYYY');
  const createdAt = dayjs(draft.created_at).format('D MMM, HH:mm');

  return (
    <Paper p={12} withBorder radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-orange-4)' }}>
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
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => onEdit(draft)}
            title="Edit draft"
          >
            <IconEdit size={13} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => onDelete(draft.localId)}
            title="Delete draft"
          >
            <IconTrash size={13} />
          </ActionIcon>
          <Button
            size="compact-xs"
            variant="light"
            color="blue"
            leftSection={<IconCloudUpload size={12} />}
            onClick={() => onSync(draft)}
            loading={isSyncing === draft.localId}
          >
            Upload to server
          </Button>
        </Group>
      </Group>
    </Paper>
  );
};

export const DraftsView = () => {
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();
  const { openEditor } = useEventorStore();
  const { mutateAsync: saveEvent } = useSaveEvent();
  const [syncingId, setSyncingId] = useState(null);

  // Живой запрос из IndexedDB
  const drafts = useLiveQuery(
    () => db.drafts.orderBy('created_at').reverse().toArray(),
    []
  ) ?? [];

  const pendingCount = drafts.filter((d) => d.syncStatus !== 'synced').length;

  // Синхронизация одного черновика
  const handleSync = async (draft) => {
    if (!user) {
      notifications.show({
        title: 'Sign in required',
        message: 'Please sign in to sync drafts to the server',
        color: 'orange',
      });
      return;
    }
    if (!isOnline) {
      notifications.show({
        title: 'No connection',
        message: 'Cannot sync — check your internet connection',
        color: 'red',
      });
      return;
    }

    setSyncingId(draft.localId);
    try {
      await saveEvent({
        name: draft.name,
        content: draft.content,
        setdate: draft.setdate,
        section_id: draft.section_id,
        type_id: draft.type_id,
      });
      // Успех — удаляем из IDB
      await deleteDraft(draft.localId);
      notifications.show({
        title: 'Synced',
        message: draft.name || 'Draft uploaded to server',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      await markDraftError(draft.localId, msg);
      notifications.show({
        title: 'Sync failed',
        message: msg,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (localId) => {
    await deleteDraft(localId);
    notifications.show({
      message: 'Draft deleted',
      color: 'gray',
    });
  };

  const handleEdit = (draft) => {
    openEditor({
      id: null,
      draftLocalId: draft.localId,
      date: draft.setdate,
      section_id: draft.section_id,
      // Передаём данные черновика чтобы редактор их подхватил
      _draftData: draft,
    });
  };

  return (
    <div className="content-scroll">
      <Box px={16} pt={12} pb={40}>
        {/* Заголовок */}
        <Group justify="space-between" mb={12}>
          <Group gap={8}>
            <Text size="sm" fw={600}>Local drafts</Text>
            {pendingCount > 0 && (
              <Badge size="sm" color="orange" variant="filled">{pendingCount}</Badge>
            )}
          </Group>
        </Group>

        {/* Статус подключения */}
        {!isOnline && (
          <Alert
            icon={<IconAlertCircle size={14} />}
            color="orange"
            variant="light"
            mb={12}
            radius="sm"
          >
            <Text size="xs">You are offline. Drafts will sync when connection is restored.</Text>
          </Alert>
        )}

        {!user && isOnline && (
          <Alert
            icon={<IconAlertCircle size={14} />}
            color="blue"
            variant="light"
            mb={12}
            radius="sm"
          >
            <Text size="xs">Sign in to upload drafts to the server.</Text>
          </Alert>
        )}

        <Divider mb={12} />

        {/* Пусто */}
        {drafts.length === 0 && (
          <Center h={140}>
            <Stack align="center" gap={6}>
              <IconCheck size={32} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">No local drafts</Text>
            </Stack>
          </Center>
        )}

        {/* Список черновиков */}
        <Stack gap={8}>
          {drafts.map((draft) => (
            <DraftCard
              key={draft.localId}
              draft={draft}
              onSync={handleSync}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isSyncing={syncingId}
            />
          ))}
        </Stack>
      </Box>
    </div>
  );
};
