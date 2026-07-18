import { useState } from 'react';
import { ActionIcon, Avatar, Badge, Box, Button, Collapse, Group, Stack, Text, Title } from '@mantine/core';
import {
  IconArrowLeft, IconChevronDown, IconChevronUp, IconEdit, IconMessagePlus, IconNetwork, IconPin,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { DetailsSection } from '../DetailsSection/DetailsSection';
import { LogEntry } from '../LogEntry/LogEntry';
import { RelationBadge } from '../RelationBadge/RelationBadge';
import {
  formatLastContact, formatPartialDate, getInitials, getRelationPeerId,
} from '../../utils/contactorUtils';
import { useContactorStore } from '../../store/contactorStore';

export const ContactPage = ({ contact, logs = [], relations = [], contacts = [] }) => {
  const navigate = useNavigate();
  const { openContactEditor, openLogEditor, openRelationEditor } = useContactorStore();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const relationContacts = relations.map((relation) => {
    const peerId = getRelationPeerId(relation, contact.id);
    const relationPeer = String(relation.contact_a_id) === String(peerId)
      ? relation.contact_a
      : relation.contact_b;
    return {
      relation,
      contact: relationPeer || contacts.find((item) => String(item.id) === String(peerId)),
    };
  });
  const pinnedLogsCount = logs.filter((log) => log.is_pinned).length;

  return (
    <Box className="content-scroll cnt-contact-page" p={16}>
      <Group justify="space-between" align="flex-start" className="cnt-contact-header">
        <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => navigate('/contactor')}
            aria-label="Back to contacts"
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Avatar src={contact.avatar} radius="xl" color="indigo" size={56}>
            {getInitials(contact.name)}
          </Avatar>
          <Stack gap={3} style={{ minWidth: 0 }}>
            <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
              <Title order={2} size="h3" truncate>
                {contact.name}
              </Title>
              <Badge size="xs" variant="light" color="indigo">{contact.group}</Badge>
              {pinnedLogsCount > 0 && (
                <Badge size="xs" variant="outline" color="indigo" leftSection={<IconPin size={10} />}>
                  {pinnedLogsCount} pinned
                </Badge>
              )}
            </Group>
            {contact.nickname && <Text size="xs" c="dimmed">{contact.nickname}</Text>}
            <Text size="sm" c="dimmed" truncate>
              {[contact.role, contact.company].filter(Boolean).join(' / ') || 'Contact'}
            </Text>
            <Text size="xs" c="indigo.7">Last contact: {formatLastContact(contact.last_contact_at)}</Text>
          </Stack>
        </Group>

        <Group gap={6} className="cnt-contact-actions">
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
            variant="subtle"
            color="indigo"
            leftSection={<IconNetwork size={14} />}
            onClick={() => openRelationEditor({ contact_id: contact.id })}
          >
            Relation
          </Button>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => openContactEditor({ id: contact.id })}
            aria-label="Edit contact"
          >
            <IconEdit size={15} />
          </ActionIcon>
        </Group>
      </Group>

      <div className="cnt-contact-layout">
        <Box className="cnt-panel cnt-log-panel">
          <Group justify="space-between" mb={6}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Life stream</Text>
            <Text size="xs" c="dimmed">{logs.length} entries</Text>
          </Group>
          <Stack gap={0}>
            {logs.length ? logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            )) : <Text size="sm" c="dimmed">No log entries yet</Text>}
          </Stack>
        </Box>

        <Stack gap="sm" className="cnt-contact-aside">
          <Box className="cnt-panel">
            <Group justify="space-between" mb={8}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">Context</Text>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                rightSection={detailsOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                onClick={() => setDetailsOpen((value) => !value)}
              >
                Details
              </Button>
            </Group>
            <Stack gap={4}>
              {contact.met_context && (
                <Text size="sm">
                  Met: {contact.met_context}
                  {contact.met_at ? ` / ${formatPartialDate(contact.met_at, contact.met_precision)}` : ''}
                </Text>
              )}
              {!contact.met_context && <Text size="sm" c="dimmed">No meeting context yet</Text>}
            </Stack>
          </Box>

          <Collapse in={detailsOpen}>
            <DetailsSection details={contact.details} />
          </Collapse>

          <Box className="cnt-panel">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>Relations</Text>
            <Group gap={6}>
              {relationContacts.length ? relationContacts.map(({ relation, contact: peer }) => (
                <RelationBadge key={relation.id} relation={relation} contact={peer} />
              )) : <Text size="sm" c="dimmed">No relations yet</Text>}
            </Group>
          </Box>
        </Stack>
      </div>
    </Box>
  );
};
