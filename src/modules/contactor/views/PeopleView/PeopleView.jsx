import { Box, Center, SimpleGrid, Text } from '@mantine/core';
import { IconAddressBook } from '@tabler/icons-react';
import { useContacts } from '../../api/contactorApi';
import { ContactCard } from '../../components/ContactCard/ContactCard';

export const PeopleView = () => {
  const { data: contacts = [] } = useContacts();

  return (
    <Box className="content-scroll" p={16}>
      {contacts.length ? (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3, xl: 4 }} spacing="md">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </SimpleGrid>
      ) : (
        <Center h={300}>
          <Box ta="center">
            <IconAddressBook size={40} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" size="sm" mt={8}>No contacts found</Text>
          </Box>
        </Center>
      )}
    </Box>
  );
};
