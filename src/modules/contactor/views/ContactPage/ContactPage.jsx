import { Box, Center, Loader, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useContact, useContactLogs, useContactRelations } from '../../api/contactorApi';
import { useContactorStore } from '../../store/contactorStore';
import { ContactPage as ContactPageComponent } from '../../components/ContactPage/ContactPage';

export const ContactPageView = () => {
  const { id } = useParams();
  const { data: contact, isLoading } = useContact(id);
  const { data: logs = [] } = useContactLogs(id);
  const { data: relations = [] } = useContactRelations(id);
  const contacts = useContactorStore((state) => state.contacts);

  if (isLoading) return <Center h={300}><Loader size="sm" /></Center>;

  if (!contact) {
    return (
      <Box className="content-scroll" p={16}>
        <Text size="sm" c="dimmed">Contact not found</Text>
      </Box>
    );
  }

  return <ContactPageComponent contact={contact} logs={logs} relations={relations} contacts={contacts} />;
};
