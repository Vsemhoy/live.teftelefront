import { Paper, Group, Text, Badge, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconPencil, IconTrash, IconEyeOff, IconEye, IconCopy } from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { useDeleteTransaction, useToggleTransaction } from '../../api/badgerApi';
import { formatMoney, flowKindColor, flowKindSign } from '../../utils/badgerUtils';

export const TransactionCard = ({ transaction, dragHandleProps = {} }) => {
  const { openEditor, openDuplicator } = useBadgerStore();
  const deleteTransaction = useDeleteTransaction();
  const toggleTransaction = useToggleTransaction();

  const {
    id, title, note, amount, flow_kind, status,
    is_disabled, tags = [],
  } = transaction;

  const notePreview = note
    ? note.split('\n')[0].slice(0, 80) + (note.split('\n')[0].length > 80 || note.includes('\n') ? '…' : '')
    : null;

  const disabled  = Boolean(is_disabled);
  const isPending = status === 'pending';

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleTransaction.mutate({ id, is_disabled: disabled ? 0 : 1 });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!confirm('Удалить транзакцию?')) return;
    deleteTransaction.mutate(id);
  };

  return (
    <Paper
      className="bud-transaction-card"
      withBorder
      radius="sm"
      p="xs"
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: 'grab',
        borderStyle: isPending ? 'dashed' : 'solid',
        position: 'relative',
      }}
      {...dragHandleProps}
    >
      <Group justify="space-between" gap={4} wrap="nowrap">
        <Text
          size="sm"
          fw={600}
          c={disabled ? 'dimmed' : flowKindColor(flow_kind)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {flowKindSign(flow_kind)}{formatMoney(amount)}
        </Text>

        <Menu shadow="md" size="xs" position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="xs"
              onClick={(e) => e.stopPropagation()}>
              <IconDots size={12} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconPencil size={13} />}
              onClick={(e) => { e.stopPropagation(); openEditor({ id }); }}
            >
              Редактировать
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCopy size={13} />}
              onClick={(e) => { e.stopPropagation(); openDuplicator(transaction); }}
            >
              Дублировать
            </Menu.Item>
            <Menu.Item
              leftSection={disabled ? <IconEye size={13} /> : <IconEyeOff size={13} />}
              color="orange"
              onClick={handleToggle}
            >
              {disabled ? 'Включить' : 'Отключить'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={13} />}
              color="red"
              onClick={handleDelete}
            >
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {title && (
        <Text size="xs" c="dimmed" lineClamp={1} mt={2}>{title}</Text>
      )}

      {notePreview && (
        <Text size="xs" c="dimmed" mt={1}
          style={{ fontStyle: 'italic', opacity: 0.75, fontFamily: 'monospace', fontSize: 11 }}
          lineClamp={1}>
          {notePreview}
        </Text>
      )}

      {tags.length > 0 && (
        <Group gap={4} mt={4}>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              size="xs"
              variant="light"
              style={{
                backgroundColor: tag.bgcolor || undefined,
                color: tag.color || undefined,
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </Group>
      )}

      {isPending && !disabled && (
        <Badge size="xs" color="yellow" variant="dot" mt={4}>planned</Badge>
      )}
    </Paper>
  );
};
