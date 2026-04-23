import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Text, Group, Badge, Button, Stack, Paper, Divider,
  ActionIcon, Tooltip, Anchor, Timeline, ThemeIcon,
} from '@mantine/core';
import {
  IconArrowLeft, IconEdit, IconPlus, IconMapPin,
  IconCalendar, IconExternalLink, IconUser,
  IconShoppingCart, IconTool, IconTransfer,
  IconAlertTriangle, IconTrash, IconPackage,
  IconArrowRight, IconCurrencyRubel,
} from '@tabler/icons-react';
import { MOCK_THINGS, MOCK_REGISTER, MOCK_CATEGORIES, THING_STATUSES, REGISTER_EVENT_TYPES } from '../../api/stufferMocks';
import { formatPrice, getLocationPath } from '../../utils/stufferUtils';
import { MOCK_LOCATIONS } from '../../api/stufferMocks';
import { useStufferStore } from '../../store/stufferStore';

const EventIcon = ({ type }) => {
  const icons = {
    bought:    <IconShoppingCart size={14} />,
    ordered:   <IconShoppingCart size={14} />,
    moved:     <IconTransfer size={14} />,
    installed: <IconTool size={14} />,
    lent:      <IconUser size={14} />,
    returned:  <IconArrowRight size={14} />,
    sold:      <IconCurrencyRubel size={14} />,
    lost:      <IconAlertTriangle size={14} />,
    stolen:    <IconAlertTriangle size={14} />,
    disposed:  <IconTrash size={14} />,
    repaired:  <IconTool size={14} />,
    received:  <IconPackage size={14} />,
  };
  return icons[type] || <IconArrowRight size={14} />;
};

export const ThingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openEditor, openRegister } = useStufferStore();

  const thing = MOCK_THINGS.find((t) => t.id === id);
  if (!thing) {
    return (
      <Box p="xl">
        <Text c="dimmed">Вещь не найдена</Text>
        <Button mt="md" variant="subtle" onClick={() => navigate(-1)}>← Назад</Button>
      </Box>
    );
  }

  const category = MOCK_CATEGORIES.find((c) => c.id === thing.category_id);
  const locationPath = getLocationPath(thing.current_location_id, MOCK_LOCATIONS);
  const price = formatPrice(thing.purchase_price);
  const status = THING_STATUSES[thing.current_status];

  // Регистр этой вещи
  const registers = MOCK_REGISTER
    .filter((r) => r.thing_id === id)
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  // Связанные вещи (дети)
  const children = MOCK_THINGS.filter((t) => t.parent_id === id);

  return (
    <Box style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 40px' }}>

      {/* Навигация назад */}
      <Group mb={16} gap={8}>
        <ActionIcon variant="subtle" onClick={() => navigate('/stuffer/things')}>
          <IconArrowLeft size={16} />
        </ActionIcon>
        <Text size="xs" c="dimmed">Вещи</Text>
        <Text size="xs" c="dimmed">/</Text>
        <Text size="xs" c="dimmed" truncate>{thing.name}</Text>
      </Group>

      {/* Шапка */}
      <Paper withBorder p="md" mb={12}
        style={{ borderLeft: `4px solid ${category?.color || 'var(--mantine-color-gray-3)'}` }}>
        <Group justify="space-between" align="flex-start" mb={8}>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6}>
              <Badge size="xs" variant="dot" color={thing.entity_type === 'asset' ? 'blue' : 'violet'}>
                {thing.entity_type === 'asset' ? 'Asset' : 'Item'}
              </Badge>
              {status && <Badge size="xs" color={status.color} variant="light">{status.label}</Badge>}
              {category && (
                <Badge size="xs" variant="outline" style={{ borderColor: category.color, color: category.color }}>
                  {category.name}
                </Badge>
              )}
            </Group>
            <Text size="lg" fw={700}>{thing.name}</Text>
            {thing.description && <Text size="sm" c="dimmed">{thing.description}</Text>}
          </Stack>

          <Group gap={6} style={{ flexShrink: 0 }}>
            <Tooltip label="Добавить событие" withArrow>
              <Button size="xs" variant="light" leftSection={<IconPlus size={13} />}
                onClick={() => openRegister({ thing_id: thing.id })}>
                Событие
              </Button>
            </Tooltip>
            <Tooltip label="Редактировать" withArrow>
              <ActionIcon variant="default" onClick={() => openEditor({ id: thing.id })}>
                <IconEdit size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Метаданные */}
        <Divider mb={10} />
        <Group gap={20} wrap="wrap">
          {locationPath && (
            <Group gap={5}>
              <IconMapPin size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Text size="xs" c="dimmed">{locationPath}</Text>
            </Group>
          )}
          {price && (
            <Group gap={5}>
              <IconCurrencyRubel size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Text size="xs" c="dimmed">{price}</Text>
            </Group>
          )}
          {thing.purchase_date && (
            <Group gap={5}>
              <IconCalendar size={13} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Text size="xs" c="dimmed">
                {new Date(thing.purchase_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </Group>
          )}
          {thing.serial_no && (
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>S/N: {thing.serial_no}</Text>
          )}
          {thing.vendor && (
            <Text size="xs" c="dimmed">Продавец: {thing.vendor}</Text>
          )}
          {thing.url && (
            <Anchor href={thing.url} target="_blank" size="xs">
              <Group gap={4}>
                <IconExternalLink size={12} />
                <span>Ссылка на товар</span>
              </Group>
            </Anchor>
          )}
          {thing.lent_to && (
            <Group gap={5}>
              <IconUser size={13} style={{ color: 'var(--mantine-color-yellow-6)' }} />
              <Text size="xs" c="yellow.7">У {thing.lent_to} с {thing.lent_at}</Text>
            </Group>
          )}
          {thing.qty && (
            <Text size="xs" c="dimmed">{thing.qty} {thing.unit}</Text>
          )}
        </Group>
      </Paper>

      {/* Вложенные вещи (дети) */}
      {children.length > 0 && (
        <Paper withBorder p="md" mb={12}>
          <Text size="sm" fw={600} mb={10}>Состав / Компоненты</Text>
          <Stack gap={6}>
            {children.map((child) => {
              const cs = THING_STATUSES[child.current_status];
              return (
                <Group
                  key={child.id}
                  gap={8}
                  style={{ cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}
                  onClick={() => navigate(`/stuffer/things/${child.id}`)}
                >
                  <Badge size="xs" variant="dot" color={child.entity_type === 'asset' ? 'blue' : 'violet'}>
                    {child.entity_type}
                  </Badge>
                  <Text size="sm" style={{ flex: 1 }}>{child.name}</Text>
                  {cs && <Badge size="xs" color={cs.color} variant="light">{cs.label}</Badge>}
                </Group>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* История Register */}
      <Paper withBorder p="md">
        <Group justify="space-between" mb={14}>
          <Text size="sm" fw={600}>История событий</Text>
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />}
            onClick={() => openRegister({ thing_id: thing.id })}>
            Добавить
          </Button>
        </Group>

        {registers.length === 0 && (
          <Text size="xs" c="dimmed">Событий пока нет</Text>
        )}

        {registers.length > 0 && (
          <Timeline bulletSize={28} lineWidth={2}>
            {registers.map((reg) => {
              const et = REGISTER_EVENT_TYPES[reg.event_type];
              const fromLoc = getLocationPath(reg.from_location_id, MOCK_LOCATIONS);
              const toLoc = getLocationPath(reg.to_location_id, MOCK_LOCATIONS);
              return (
                <Timeline.Item
                  key={reg.id}
                  bullet={
                    <ThemeIcon size={24} radius="xl" color={et?.color || 'gray'} variant="light">
                      <EventIcon type={reg.event_type} />
                    </ThemeIcon>
                  }
                  title={
                    <Group gap={6}>
                      <Text size="sm" fw={500}>{et?.label || reg.event_type}</Text>
                      <Text size="xs" c="dimmed">
                        {new Date(reg.occurred_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </Group>
                  }
                >
                  {(fromLoc || toLoc) && (
                    <Group gap={4} mt={2}>
                      {fromLoc && <Text size="xs" c="dimmed">{fromLoc}</Text>}
                      {fromLoc && toLoc && <IconArrowRight size={11} style={{ color: 'var(--mantine-color-gray-5)' }} />}
                      {toLoc && <Text size="xs" c="dimmed">{toLoc}</Text>}
                    </Group>
                  )}
                  {reg.note && <Text size="xs" c="dimmed" mt={2}>{reg.note}</Text>}
                  {reg.lent_to && (
                    <Text size="xs" c="yellow.7" mt={2}>→ {reg.lent_to} (вернуть до {reg.return_expected})</Text>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Paper>
    </Box>
  );
};
