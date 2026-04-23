import { useDroppable } from '@dnd-kit/core';
import { Text, Group, Box, ThemeIcon } from '@mantine/core';
import {
  IconMapPin, IconUser, IconCurrencyRubel,
  IconTool, IconTrash,
} from '@tabler/icons-react';

const DROP_ZONES = [
  {
    id: 'drop-location',
    label: 'Локация',
    sublabel: 'выбор из дерева',
    icon: IconMapPin,
    color: '#0f6e56',
    bg: '#e1f5ee',
    borderColor: '#1d9e75',
    data: { type: 'location-picker' },
    flex: 2,
  },
  {
    id: 'drop-lent',
    label: 'Одолжить',
    sublabel: 'кому?',
    icon: IconUser,
    color: '#854f0b',
    bg: '#faeeda',
    borderColor: '#ef9f27',
    data: { type: 'status', status: 'lent', event_type: 'lent' },
    flex: 1,
  },
  {
    id: 'drop-sold',
    label: 'Продать',
    sublabel: 'почём?',
    icon: IconCurrencyRubel,
    color: '#3b6d11',
    bg: '#eaf3de',
    borderColor: '#639922',
    data: { type: 'status', status: 'sold', event_type: 'sold' },
    flex: 1,
  },
  {
    id: 'drop-broken',
    label: 'Сломалось',
    sublabel: 'заметка',
    icon: IconTool,
    color: '#993c1d',
    bg: '#faece7',
    borderColor: '#d85a30',
    data: { type: 'status', status: 'disposed', event_type: 'repaired' },
    flex: 1,
  },
  {
    id: 'drop-disposed',
    label: 'Выбросить',
    sublabel: 'подтвердить',
    icon: IconTrash,
    color: '#5f5e5a',
    bg: '#f1efe8',
    borderColor: '#888780',
    data: { type: 'status', status: 'disposed', event_type: 'disposed' },
    flex: 1,
  },
];

const DropZone = ({ zone }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: zone.data,
  });

  const Icon = zone.icon;

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: zone.flex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 8px',
        borderRadius: 10,
        background: isOver ? zone.borderColor : zone.bg,
        border: `2px ${isOver ? 'solid' : 'dashed'} ${zone.borderColor}`,
        transition: 'all 0.15s',
        cursor: 'copy',
        minHeight: 80,
        transform: isOver ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      <ThemeIcon
        size={isOver ? 32 : 28}
        radius="xl"
        style={{
          background: isOver ? 'rgba(255,255,255,0.3)' : zone.borderColor + '22',
          color: isOver ? '#fff' : zone.color,
          transition: 'all 0.15s',
        }}
      >
        <Icon size={isOver ? 18 : 15} />
      </ThemeIcon>
      <Box ta="center">
        <Text
          size="xs"
          fw={600}
          style={{ color: isOver ? '#fff' : zone.color, lineHeight: 1.2 }}
        >
          {zone.label}
        </Text>
        <Text
          size="xs"
          style={{
            color: isOver ? 'rgba(255,255,255,0.8)' : zone.color,
            opacity: 0.7,
            lineHeight: 1.2,
          }}
        >
          {zone.sublabel}
        </Text>
      </Box>
    </div>
  );
};

export const DropPanel = ({ visible }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        padding: '10px 12px 16px',
        background: 'var(--mantine-color-white)',
        borderTop: '1px solid var(--mantine-color-gray-2)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Text size="xs" c="dimmed" ta="center" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10 }}>
        Перетащи сюда
      </Text>
      <Group gap={8} grow>
        {DROP_ZONES.map((zone) => (
          <DropZone key={zone.id} zone={zone} />
        ))}
      </Group>
    </div>
  );
};
