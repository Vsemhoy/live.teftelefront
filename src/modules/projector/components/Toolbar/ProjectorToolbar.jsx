import { Button, Checkbox, Group, SegmentedControl, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useProjectorStore } from '../../store/projectorStore';

export const ProjectorToolbar = () => {
  const {
    projectFilter, setProjectFilter, searchQuery, setSearchQuery,
    showHidden, setShowHidden, openProjectEditor,
  } = useProjectorStore();

  return (
    <div className="content-toolbar projector-toolbar">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <TextInput
          size="xs"
          placeholder="Search projects"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          rightSection={searchQuery ? <IconX size={12} onClick={() => setSearchQuery('')} /> : null}
          style={{ width: 240, maxWidth: '42vw' }}
        />
        <SegmentedControl
          size="xs"
          value={projectFilter}
          onChange={setProjectFilter}
          data={[
            { value: 'open', label: 'Open' },
            { value: 'all', label: 'All' },
          ]}
        />
        <Checkbox
          size="xs"
          label="Hidden"
          checked={showHidden}
          onChange={(event) => setShowHidden(event.currentTarget.checked)}
        />
      </Group>
      <Button size="xs" color="pink" variant="light" leftSection={<IconPlus size={14} />} onClick={() => openProjectEditor()}>
        Project
      </Button>
    </div>
  );
};
