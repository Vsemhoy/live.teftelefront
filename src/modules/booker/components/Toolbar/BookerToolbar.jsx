import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';

export const BookerToolbar = () => {
  const { searchQuery, setSearchQuery, openBookEditor } = useBookerStore();

  return (
    <div className="content-toolbar">
      <Group gap="sm" px={16} py={8} justify="space-between">
        <TextInput
          placeholder="Search books..."
          leftSection={<IconSearch size={14} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          rightSection={
            searchQuery
              ? <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery('')}>
                  <IconX size={12} />
                </ActionIcon>
              : null
          }
          style={{ width: 260 }}
          size="sm"
        />
        <Button
          leftSection={<IconPlus size={14} />}
          size="sm"
          onClick={() => openBookEditor()}
        >
          New book
        </Button>
      </Group>
    </div>
  );
};
