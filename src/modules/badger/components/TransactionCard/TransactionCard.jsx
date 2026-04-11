import { Paper, Group, Text, Badge, Menu, ActionIcon, Stack } from '@mantine/core';
import { IconDots, IconPencil, IconTrash, IconEyeOff } from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { useDeleteTransaction } from '../../api/badgerApi';
import { formatMoney, flowKindColor, flowKindSign } from '../../utils/badgerUtils';

export const TransactionCard = ({ transaction, dragHandleProps = {} }) => {
  const { openEditor } = useBadgerStore();
  const deleteTransaction = useDeleteTransaction();

  const {
    id, title, amount, flow_kind, status,
    is_disabled, tags = [],
  } = transaction;

  const disabled = Boolean(is_disabled);
  const isPending = status === 'pending';

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
        {/* Сумма */}
        <Text
          size="sm"
          fw={600}
          c={disabled ? 'dimmed' : flowKindColor(flow_kind)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {flowKindSign(flow_kind)}{formatMoney(amount)}
        </Text>

        {/* Меню */}
        <Menu shadow="md" size="xs" position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="xs"
              onClick={(e) => e.stopPropagation()}>
              <IconDots size={12} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPencil size={13} />}
              onClick={() => openEditor({ id })}>
              Edit
            </Menu.Item>
            <Menu.Item leftSection={<IconEyeOff size={13} />} color="orange">
              {disabled ? 'Enable' : 'Disable'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconTrash size={13} />} color="red"
              onClick={() => deleteTransaction.mutate(id)}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Название */}
      {title && (
        <Text size="xs" c="dimmed" lineClamp={2} mt={2}>{title}</Text>
      )}

      {/* Теги */}
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

      {/* Pending-бейдж */}
      {isPending && !disabled && (
        <Badge size="xs" color="yellow" variant="dot" mt={4}>planned</Badge>
      )}
    </Paper>
  );
};
