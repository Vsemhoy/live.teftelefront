import { ActionIcon, Button, Group, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconLayoutGrid, IconLayoutList, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { CONTACT_GROUPS } from '../../api/contactorMocks';
import { useContactorStore } from '../../store/contactorStore';

export const ContactorToolbar = () => {
  const {
    groupFilter, setGroupFilter,
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    openContactEditor,
  } = useContactorStore();

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="content-toolbar">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <TextInput
          size="xs"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          rightSection={searchQuery
            ? <IconX size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            : null}
          style={{ width: 180, maxWidth: '38vw' }}
        />
        <SegmentedControl
          size="xs"
          value={groupFilter}
          onChange={setGroupFilter}
          data={CONTACT_GROUPS.map(({ value, label }) => ({
            value,
            label: value === 'all' ? 'All' : label,
          }))}
          className="cnt-group-filter"
        />
      </Group>

      <Group gap={6} wrap="nowrap">
        {!isMobile && (
          <Group gap={2}>
            <Tooltip label="Table" withArrow>
              <ActionIcon
                size="sm"
                variant={viewMode === 'table' ? 'filled' : 'subtle'}
                color={viewMode === 'table' ? 'indigo' : 'gray'}
                onClick={() => setViewMode('table')}
              >
                <IconLayoutList size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Cards" withArrow>
              <ActionIcon
                size="sm"
                variant={viewMode === 'cards' ? 'filled' : 'subtle'}
                color={viewMode === 'cards' ? 'indigo' : 'gray'}
                onClick={() => setViewMode('cards')}
              >
                <IconLayoutGrid size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
        <Button
          size="xs"
          color="indigo"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={() => openContactEditor()}
        >
          {isMobile ? null : 'Contact'}
        </Button>
      </Group>
    </div>
  );
};
