import { Box, Text, Paper, Group, Badge, Stack, ThemeIcon, Timeline } from '@mantine/core';
import {
  IconShoppingCart, IconTransfer, IconTool,
  IconUser, IconArrowRight, IconAlertTriangle,
  IconTrash, IconPackage, IconCurrencyRubel,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../../api/stufferApi';
import { REGISTER_EVENT_TYPES } from '../../api/stufferMocks';
import { getLocationPath } from '../../utils/stufferUtils';
import { MOCK_LOCATIONS } from '../../api/stufferMocks';

const EventIcon = ({ type, size = 14 }) => {
  const icons = {
    bought:    <IconShoppingCart size={size} />,
    ordered:   <IconShoppingCart size={size} />,
    moved:     <IconTransfer size={size} />,
    installed: <IconTool size={size} />,
    lent:      <IconUser size={size} />,
    returned:  <IconArrowRight size={size} />,
    sold:      <IconCurrencyRubel size={size} />,
    lost:      <IconAlertTriangle size={size} />,
    stolen:    <IconAlertTriangle size={size} />,
    disposed:  <IconTrash size={size} />,
    repaired:  <IconTool size={size} />,
    received:  <IconPackage size={size} />,
  };
  return icons[type] || <IconArrowRight size={size} />;
};

export const FeedView = () => {
  const navigate = useNavigate();
  const { data: registers = [], isLoading } = useRegister({ limit: 100 });

  const sorted = [...registers].sort(
    (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)
  );

  return (
    <div className="content-scroll" style={{ padding: '12px' }}>
      <Box style={{ maxWidth: 640, margin: '0 auto' }}>
        <Text size="sm" fw={600} c="dimmed" mb={16} tt="uppercase" style={{ letterSpacing: '0.07em' }}>
          Лента событий
        </Text>

        <Timeline bulletSize={28} lineWidth={2}>
          {sorted.map((reg) => {
            const thing = MOCK_THINGS.find((t) => t.id === reg.thing_id);
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
                  <Group gap={8} wrap="wrap">
                    <Badge size="xs" color={et?.color || 'gray'} variant="light">
                      {et?.label || reg.event_type}
                    </Badge>
                    {reg.thing && (
                      <Text
                        size="sm" fw={500}
                        style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                        onClick={() => navigate(`/stuffer/things/${reg.thing.id}`)}
                      >
                        {reg.thing.name}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {new Date(reg.occurred_at).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </Group>
                }
              >
                <Stack gap={2} mt={2}>
                  {(fromLoc || toLoc) && (
                    <Group gap={4}>
                      {fromLoc && <Text size="xs" c="dimmed">{fromLoc}</Text>}
                      {fromLoc && toLoc && <IconArrowRight size={10} style={{ color: 'var(--mantine-color-gray-4)' }} />}
                      {toLoc && <Text size="xs" c="dimmed">{toLoc}</Text>}
                    </Group>
                  )}
                  {reg.note && <Text size="xs" c="dimmed">{reg.note}</Text>}
                  {reg.lent_to && (
                    <Text size="xs" c="yellow.7">→ {reg.lent_to} (до {reg.return_expected})</Text>
                  )}
                </Stack>
              </Timeline.Item>
            );
          })}
        </Timeline>

        {sorted.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" mt={40}>Событий пока нет</Text>
        )}
      </Box>
    </div>
  );
};
