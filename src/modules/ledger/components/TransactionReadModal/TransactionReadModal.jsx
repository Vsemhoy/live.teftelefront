import { Modal, Stack, Group, Text, Badge, Box, ActionIcon, Divider } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLedgerStore } from '../../store/ledgerStore';
import { useTransaction, useDeleteTransaction } from '../../api/ledgerApi';
import { formatMoney, flowKindColor, flowKindSign } from '../../utils/ledgerUtils';
import { notifications } from '@mantine/notifications';

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
