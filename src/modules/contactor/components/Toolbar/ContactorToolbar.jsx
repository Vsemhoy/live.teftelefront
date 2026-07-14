import { Button, Group, TextInput, SegmentedControl } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { CONTACT_GROUPS } from '../../api/contactorMocks';
import { useContactorStore } from '../../store/contactorStore';

export const ContactorToolbar = () => {
  const {
    groupFilter, setGroupFilter, searchQuery, setSearchQuery, openContactEditor,
  } = useContactorStore();

  return (
    <div className="content-toolbar">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <TextInput
          size="xs"
          placeholder="Search contacts"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          rightSection={searchQuery ? (
            <IconX size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
          ) : null}
          style={{ width: 220, maxWidth: '45vw' }}
        />
        <SegmentedControl
          size="xs"
          value={groupFilter}
          onChange={setGroupFilter}
          data={CONTACT_GROUPS.map(({ value, label }) => ({ value, label: label.replace(' groups', '') }))}
          className="cnt-group-filter"
        />
      </Group>
      <Button
        size="xs"
        color="indigo"
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={() => openContactEditor()}
      >
        Contact
      </Button>
    </div>
  );
};
