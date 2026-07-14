import { Avatar, Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconEdit, IconMessagePlus, IconNetwork } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { DetailsSection } from '../DetailsSection/DetailsSection';
import { LogEntry } from '../LogEntry/LogEntry';
import { RelationBadge } from '../RelationBadge/RelationBadge';
import { formatLastContact, getInitials, getRelationPeerId } from '../../utils/contactorUtils';
import { useContactorStore } from '../../store/contactorStore';

export const ContactPage = ({ contact, logs = [], relations = [], contacts = [] }) => {
  const navigate = useNavigate();
  const { openContactEditor, openLogEditor, openRelationEditor } = useContactorStore();

  const relationContacts = relations.map((relation) => {
    const peerId = getRelationPeerId(relation, contact.id);
    return {
      relation,
      contact: contacts.find((item) => String(item.id) === String(peerId)),
    };
  });

  return (
    <Box className="content-scroll" p={16}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center" wrap="nowrap">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={14} />}
              onClick={() => navigate('/contactor')}
            >
              Back
            </Button>
            <Avatar src={contact.avatar} radius="xl" color="indigo" size={54}>
              {getInitials(contact.name)}
            </Avatar>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Title order={2} size="h3">
                {contact.name}
                {contact.nickname && (
                  <Text span size="sm" c="dimmed" fw={400}> / {contact.nickname}</Text>
                )}
              </Title>
              <Text size="sm" c="dimmed">
                {[contact.role, contact.company, contact.group].filter(Boolean).join(' / ')}
              </Text>
              {contact.met_context && (
                <Text size="xs" c="dimmed">
                  Met: {contact.met_context}
                  {contact.met_at ? ` / ${dayjs(contact.met_at).format('MMM YYYY')}` : ''}
                </Text>
              )}
              <Text size="xs" c="indigo.7">Last contact: {formatLastContact(contact.last_contact_at)}</Text>
            </Stack>
          </Group>
          <Group gap={6}>
            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<IconMessagePlus size={14} />}
              onClick={() => openLogEditor({ contact_id: contact.id })}
            >
              Log
            </Button>
            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<IconNetwork size={14} />}
              onClick={() => openRelationEditor({ contact_id: contact.id })}
            >
              Relation
            </Button>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconEdit size={14} />}
              onClick={() => openContactEditor({ id: contact.id })}
            >
              Edit
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <DetailsSection details={contact.details} />
          <Box className="cnt-panel" style={{ gridColumn: 'span 2' }}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>Relations</Text>
            <Group gap={6}>
              {relationContacts.length ? relationContacts.map(({ relation, contact: peer }) => (
                <RelationBadge key={relation.id} relation={relation} contact={peer} />
              )) : <Text size="sm" c="dimmed">No relations yet</Text>}
            </Group>
          </Box>
        </SimpleGrid>

        <Box className="cnt-panel">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>Log</Text>
          <Stack gap={0}>
            {logs.length ? logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            )) : <Text size="sm" c="dimmed">No log entries yet</Text>}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
