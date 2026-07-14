import { Badge, Box, Group, Stack, Text } from '@mantine/core';
import {
  IconCalendarEvent, IconLink, IconNote, IconPhoneCall, IconPin, IconSparkles,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getLogKind } from '../../utils/contactorUtils';

const KIND_META = {
  fact: { icon: IconSparkles, color: 'grape' },
  meeting: { icon: IconCalendarEvent, color: 'indigo' },
  call: { icon: IconPhoneCall, color: 'green' },
  note: { icon: IconNote, color: 'gray' },
  reminder_done: { icon: IconPin, color: 'orange' },
};

const SATELLITE_LABELS = {
  eventor_event_id: 'Eventor',
  stuffer_register_id: 'Stuffer',
  exploiter_event_id: 'Exploiter',
};

export const LogEntry = ({ log, contact }) => {
  const kind = getLogKind(log);
  const meta = KIND_META[kind] || KIND_META.note;
  const Icon = meta.icon;

  const satellites = Object.entries(SATELLITE_LABELS)
    .filter(([key]) => log[key])
    .map(([, label]) => label);

  return (
    <Box className="cnt-log-entry">
      <Group align="flex-start" wrap="nowrap">
        <Box className={`cnt-log-icon ${meta.color}`}>
          <Icon size={15} />
        </Box>
        <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
          <Group gap={6} justify="space-between" wrap="nowrap">
            <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
              {log.is_pinned && <IconPin size={12} color="var(--mantine-color-indigo-5)" style={{ flexShrink: 0 }} />}
              {contact && <Text size="sm" fw={650} truncate>{contact.name}</Text>}
            </Group>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              {dayjs(log.occurred_at).format('MMM D')}
            </Text>
          </Group>
          {log.title && <Text size="sm" fw={650}>{log.title}</Text>}
          {log.content && <Text size="sm" c="gray.7">{log.content}</Text>}
          <Group gap={6}>
            <Badge size="xs" color={meta.color} variant="light">{kind}</Badge>
            {satellites.map((label) => (
              <Badge key={label} size="xs" variant="outline" color="gray" leftSection={<IconLink size={10} />}>
                {label}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Group>
    </Box>
  );
};
