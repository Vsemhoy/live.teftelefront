import { Paper, Text, Group, Badge, ActionIcon, Menu, Tooltip, Box, Stack } from '@mantine/core';
import {
  IconDots, IconEdit, IconTrash, IconPackage, IconCpu,
  IconMapPin, IconCalendar, IconExternalLink,
  IconShoppingCart, IconAlertTriangle, IconUser,
  IconArrowRight,
} from '@tabler/icons-react';
import { useStufferStore } from '../../store/stufferStore';
import { THING_STATUSES, MOCK_CATEGORIES, MOCK_LOCATIONS } from '../../api/stufferMocks';
import { formatPrice, getLocationPath } from '../../utils/stufferUtils';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  const s = THING_STATUSES[status];
  if (!s) return null;
  return <Badge size="xs" color={s.color} variant="light">{s.label}</Badge>;
};

const TypeBadge = ({ type }) => (
  <Badge
    size="xs"
    variant="dot"
    color={type === 'asset' ? 'blue' : 'violet'}
    style={{ textTransform: 'none' }}
  >
    {type === 'asset' ? 'Asset' : 'Item'}
  </Badge>
);

export const ThingCard = ({ thing, onDoubleClick }) => {
  const { openEditor, openRegister } = useStufferStore();
  const navigate = useNavigate();

  const category = MOCK_CATEGORIES.find((c) => c.id === thing.category_id);
  const locationPath = getLocationPath(thing.current_location_id, MOCK_LOCATIONS);
  const price = formatPrice(thing.purchase_price);

  const handleDoubleClick = () => {
    navigate(`/stuffer/things/${thing.id}`);
  };

  return (
    <Paper
      className="event-card"
      shadow="xs"
      p="sm"
      withBorder
      onDoubleClick={handleDoubleClick}
      style={{
        borderLeft: `3px solid ${category?.color || 'var(--mantine-color-gray-3)'}`,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Шапка: тип + статус + меню */}
      <Group justify="space-between" mb={6} gap={4}>
        <Group gap={4}>
          <TypeBadge type={thing.entity_type} />
          <StatusBadge status={thing.current_status} />
        </Group>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={13} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={13} />}
              onClick={(e) => { e.stopPropagation(); openEditor({ id: thing.id }); }}
            >
              Редактировать
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowRight size={13} />}
              onClick={(e) => { e.stopPropagation(); openRegister({ thing_id: thing.id }); }}
            >
              Добавить событие
            </Menu.Item>
            {thing.url && (
              <Menu.Item
                leftSection={<IconExternalLink size={13} />}
                component="a"
                href={thing.url}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                Открыть ссылку
              </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item leftSection={<IconTrash size={13} />} color="red">
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Название */}
      <Text size="sm" fw={600} lineClamp={2} mb={4}>
        {thing.name}
      </Text>

      {/* Описание */}
      {thing.description && (
        <Text size="xs" c="dimmed" lineClamp={2} mb={6}>
          {thing.description}
        </Text>
      )}

      {/* Мета-инфо */}
      <Stack gap={3}>
        {/* Локация */}
        {locationPath && (
          <Group gap={4}>
            <IconMapPin size={11} style={{ color: 'var(--mantine-color-gray-5)', flexShrink: 0 }} />
            <Text size="xs" c="dimmed" truncate>{locationPath}</Text>
          </Group>
        )}

        {/* Одолжен */}
        {thing.current_status === 'lent' && thing.lent_to && (
          <Group gap={4}>
            <IconUser size={11} style={{ color: 'var(--mantine-color-yellow-6)', flexShrink: 0 }} />
            <Text size="xs" c="yellow.7">У {thing.lent_to}</Text>
          </Group>
        )}

        {/* Заказан */}
        {thing.current_status === 'ordered' && (
          <Group gap={4}>
            <IconShoppingCart size={11} style={{ color: 'var(--mantine-color-orange-5)', flexShrink: 0 }} />
            <Text size="xs" c="orange.6">В пути</Text>
          </Group>
        )}

        {/* Цена + дата */}
        <Group gap={6} justify="space-between">
          {price && (
            <Text size="xs" fw={500} c="dimmed">{price}</Text>
          )}
          {thing.purchase_date && (
            <Group gap={3}>
              <IconCalendar size={10} style={{ color: 'var(--mantine-color-gray-4)' }} />
              <Text size="xs" c="dimmed">
                {new Date(thing.purchase_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </Group>
          )}
        </Group>

        {/* vendor */}
        {thing.vendor && (
          <Text size="xs" c="dimmed" truncate>
            {thing.vendor}
          </Text>
        )}
      </Stack>
    </Paper>
  );
};
