import { useMediaQuery } from '@mantine/hooks';
import { Box, Center, SimpleGrid, Text } from '@mantine/core';
import { IconAddressBook } from '@tabler/icons-react';
import { useContacts } from '../../api/contactorApi';
import { ContactCard } from '../../components/ContactCard/ContactCard';
import { ContactTable } from '../../components/ContactTable/ContactTable';
import { useContactorStore } from '../../store/contactorStore';

export const PeopleView = () => {
  const { data: contacts = [] } = useContacts();
  const viewMode = useContactorStore((s) => s.viewMode);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const showTable = !isMobile && viewMode === 'table';

  if (!contacts.length) {
    return (
      <Center h={300} className="content-scroll">
        <Box ta="center">
          <IconAddressBook size={40} color="var(--mantine-color-dimmed)" />
          <Text c="dimmed" size="sm" mt={8}>No contacts found</Text>
        </Box>
      </Center>
    );
  }

  if (showTable) {
    return (
      <Box className="content-scroll" p={16}>
        <ContactTable contacts={contacts} />
      </Box>
    );
  }

  return (
    <Box className="content-scroll" p={16}>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 3, xl: 4 }} spacing="md">
        {contacts.map((contact) => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </SimpleGrid>
    </Box>
  );
};
