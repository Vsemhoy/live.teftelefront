import { Avatar, Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconAt, IconBrandTelegram, IconHome, IconPhone } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { formatLastContact, getInitials, normalizeDetails } from '../../utils/contactorUtils';

const DETAIL_ICONS = {
  phone: IconPhone,
  tg: IconBrandTelegram,
  email: IconAt,
  address: IconHome,
};

export const ContactCard = ({ contact }) => {
  const navigate = useNavigate();
  const presentKinds = [...new Set(normalizeDetails(contact.details).map((detail) => detail.kind))]
    .filter((kind) => DETAIL_ICONS[kind]);

  return (
    <Card
      withBorder
      radius={8}
      p="sm"
      className="cnt-card"
      onClick={() => navigate(`/contactor/${contact.id}`)}
    >
      <Group align="flex-start" wrap="nowrap">
        <Avatar src={contact.avatar} radius="xl" color="indigo" size={42}>
          {getInitials(contact.name)}
        </Avatar>
        <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
          <Group justify="space-between" gap={6} wrap="nowrap">
            <Text size="sm" fw={700} truncate>
              {contact.name}
              {contact.nickname ? (
                <Text span size="xs" c="dimmed" fw={400}> / {contact.nickname}</Text>
              ) : null}
            </Text>
            <Badge size="xs" variant="light" color="indigo">{contact.group}</Badge>
          </Group>
          <Text size="xs" c="dimmed" truncate>
            {[contact.role, contact.company].filter(Boolean).join(' / ') || 'Contact'}
          </Text>
          <Text size="xs" c="indigo.7">{formatLastContact(contact.last_contact_at)}</Text>
          {presentKinds.length > 0 && (
            <Group gap={8} mt={4}>
              {presentKinds.map((kind) => {
                const Icon = DETAIL_ICONS[kind];
                return <Icon key={kind} size={13} color="var(--mantine-color-gray-5)" />;
              })}
            </Group>
          )}
        </Stack>
      </Group>
    </Card>
  );
};
