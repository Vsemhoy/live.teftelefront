import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconMessagePlus } from '@tabler/icons-react';
import { useContactLogs } from '../../api/contactorApi';
import { LogEntry } from '../../components/LogEntry/LogEntry';
import { useContactorStore } from '../../store/contactorStore';

export const FeedView = () => {
  const { data: logs = [] } = useContactLogs();
  const contacts = useContactorStore((state) => state.contacts);
  const openLogEditor = useContactorStore((state) => state.openLogEditor);

  return (
    <Box className="content-scroll" p={16}>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={700}>Contact log</Text>
        <Button size="xs" color="indigo" variant="light" leftSection={<IconMessagePlus size={14} />} onClick={() => openLogEditor()}>
          Log
        </Button>
      </Group>
      <Stack gap={0} className="cnt-panel">
        {logs.map((log) => (
          <LogEntry
            key={log.id}
            log={log}
            contact={contacts.find((contact) => contact.id === log.contact_id)}
          />
        ))}
      </Stack>
    </Box>
  );
};
