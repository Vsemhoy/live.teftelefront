import { Modal, Stack, Group, Text, Badge, Box, ActionIcon, Divider } from '@mantine/core';
import { IconLink, IconPencil, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLedgerStore } from '../../store/ledgerStore';
import { useTransaction, useDeleteTransaction } from '../../api/ledgerApi';
import { formatMoney, flowKindColor, flowKindSign } from '../../utils/ledgerUtils';
import { notifications } from '@mantine/notifications';

const linkedEntityLabel = (tx) => {
  const entity = tx?.linked_entity || {};
  if (entity.label) return entity.label;
  if (entity.name) return entity.name;
  if (entity.title) return entity.title;
  if (entity.thing?.name) return entity.thing.name;
  if (tx?.linked_entity_type === 'stuffer.thing') return 'Thing';
  if (tx?.linked_entity_type === 'exploiter.event' || tx?.exploiter_event_id) return 'Exploit';
  if (tx?.linked_entity_type && tx?.linked_entity_id) return tx.linked_entity_type;
  return null;
};

const linkedEntityTypeLabel = (tx) => {
  if (tx?.linked_entity_type === 'stuffer.thing') return 'Staffer thing';
  if (tx?.linked_entity_type === 'exploiter.event' || tx?.exploiter_event_id) return 'Exploiter event';
  return 'Linked entity';
};

export const TransactionReadModal = () => {
  const { readerOpen, readerParams, closeReader, openEditor } = useLedgerStore();
  const id = readerParams?.id;
  const { data: tx } = useTransaction(id);
  const deleteTransaction = useDeleteTransaction();

  if (!readerOpen || !tx) return null;

  const disabled  = Boolean(tx.is_disabled);
  const isPending = tx.status === 'pending';
  const kindColor = flowKindColor(tx.flow_kind, disabled);
  const kindSign  = flowKindSign(tx.flow_kind);
  const linkedLabel = linkedEntityLabel(tx);
  const linkedTypeLabel = linkedEntityTypeLabel(tx);

  const handleDelete = () => {
    if (!confirm('Delete this transaction?')) return;
    deleteTransaction.mutate(id, {
      onSuccess: () => { notifications.show({ message: 'Deleted', color: 'gray' }); closeReader(); },
    });
  };

  return (
    <Modal opened={readerOpen} onClose={closeReader} size="sm" centered
      title={
        <Group gap={8}>
          <Text fw={600} size="sm" c={kindColor}>
            {kindSign}{formatMoney(tx.amount)}
          </Text>
          {isPending && <Badge size="xs" color="yellow" variant="dot">planned</Badge>}
          {disabled  && <Badge size="xs" color="gray"   variant="dot">disabled</Badge>}
        </Group>
      }
    >
      <Stack gap={12}>
        {tx.title && <Text size="sm" fw={500}>{tx.title}</Text>}

        {linkedLabel && (
          <Box p={10} style={{
            background: 'var(--mantine-color-blue-0)',
            borderRadius: 6,
            border: '1px solid var(--mantine-color-blue-2)',
          }}>
            <Group gap={8} wrap="nowrap">
              <IconLink size={15} color="var(--mantine-color-blue-6)" />
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed">{linkedTypeLabel}</Text>
                <Text size="sm" fw={500} lineClamp={1}>{linkedLabel}</Text>
              </Stack>
            </Group>
          </Box>
        )}

        <Group gap={8}>
          <Badge size="sm" variant="light" color="gray">
            {dayjs(tx.occurred_at).format('DD MMM YYYY')}
          </Badge>
          <Badge size="sm" variant="light"
            color={tx.flow_kind === 'expense' ? 'red' : tx.flow_kind === 'income' ? 'teal' : 'blue'}>
            {tx.flow_kind.replace('_', ' ')}
          </Badge>
          {isPending && <Badge size="sm" variant="light" color="yellow">planned</Badge>}
        </Group>

        {tx.note && (
          <Box p={10} style={{
            background: 'var(--mantine-color-gray-0)',
            borderRadius: 6,
            border: '1px solid var(--mantine-color-gray-2)',
            fontFamily: 'monospace',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {tx.note}
          </Box>
        )}

        {(tx.tags || []).length > 0 && (
          <Group gap={4}>
            {tx.tags.map((tag) => (
              <Badge key={tag.id} size="sm" variant="light"
                style={{ background: tag.bgcolor, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </Group>
        )}

        <Divider />

        <Group justify="space-between">
          <ActionIcon variant="subtle" color="red" size="md" onClick={handleDelete}>
            <IconTrash size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="md"
            onClick={() => { closeReader(); openEditor({ id }); }}>
            <IconPencil size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Modal>
  );
};
