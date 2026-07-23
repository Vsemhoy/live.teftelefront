import { ActionIcon, Badge, Box, Group, Menu, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconBriefcase,
  IconCalendarEvent,
  IconDots,
  IconEye,
  IconLink,
  IconMessageCircle,
  IconNote,
  IconPhoneCall,
  IconPin,
  IconSparkles,
  IconTool,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { MdPreview } from '@/shared/components/MdRenderer';
import { useDeleteLog } from '../../api/contactorApi';
import { getLogKind } from '../../utils/contactorUtils';

const KIND_META = {
  fact: { icon: IconSparkles, color: 'grape' },
  meeting: { icon: IconCalendarEvent, color: 'indigo' },
  call: { icon: IconPhoneCall, color: 'green' },
  message: { icon: IconMessageCircle, color: 'cyan' },
  incident: { icon: IconAlertTriangle, color: 'red' },
  rumor: { icon: IconEye, color: 'violet' },
  family: { icon: IconUsers, color: 'pink' },
  work: { icon: IconBriefcase, color: 'blue' },
  service: { icon: IconTool, color: 'teal' },
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
  const deleteLog = useDeleteLog();

  const satellites = Object.entries(SATELLITE_LABELS)
    .filter(([key]) => log[key])
    .map(([, label]) => label);
  const content = log.body_md || log.content || '';
  const tags = Array.isArray(log.tags) ? log.tags : [];
  const mentions = Array.isArray(log.mentions) ? log.mentions : [];

  const handleDelete = () => {
    if (!window.confirm('Delete this stream entry?')) return;

    deleteLog.mutate(log.id, {
      onSuccess: () => notifications.show({ message: 'Stream entry deleted', color: 'gray' }),
      onError: () => notifications.show({ message: 'Failed to delete stream entry', color: 'red' }),
    });
  };

  return (
    <Box className={`cnt-log-entry${log.is_expert ? ' expert' : ''}`}>
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
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  loading={deleteLog.isPending}
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconDots size={13} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={13} />}
                  onClick={handleDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          {log.title && <Text size="sm" fw={650}>{log.title}</Text>}
          {content && (
            <Box className="cnt-log-md">
              <MdPreview content={content} />
            </Box>
          )}
          <Group gap={6}>
            <Badge size="xs" color={meta.color} variant="light">{kind}</Badge>
            {log.is_expert && (
              <Badge size="xs" variant="dot" color="indigo" leftSection={<IconEye size={9} />}>
                expert
              </Badge>
            )}
            {satellites.map((label) => (
              <Badge key={label} size="xs" variant="outline" color="gray" leftSection={<IconLink size={10} />}>
                {label}
              </Badge>
            ))}
            {tags.map((tag) => (
              <Badge
                key={tag.id || tag.name}
                size="xs"
                variant="light"
                color="gray"
                style={{
                  background: tag.bgcolor || undefined,
                  color: tag.color || undefined,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {mentions.map((mention) => {
              const contactName = mention.contact?.name || mention.name || mention.contact_name;
              if (!contactName) return null;
              return (
                <Badge key={mention.id || mention.contact_id || contactName} size="xs" variant="outline" color="indigo">
                  {contactName}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      </Group>
    </Box>
  );
};
