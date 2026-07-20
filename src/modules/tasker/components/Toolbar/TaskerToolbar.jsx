import { Button, Checkbox, Group, SegmentedControl, TextInput } from '@mantine/core';
import { IconClockPlus, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useTaskerStore } from '../../store/taskerStore';

export const TaskerToolbar = () => {
  const {
    taskFilter, setTaskFilter, searchQuery, setSearchQuery,
    projectFilter, showHidden, setShowHidden,
    openTaskEditor, openTimeEditor,
  } = useTaskerStore();

  return (
    <div className="content-toolbar tasker-toolbar">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <TextInput
          size="xs"
          placeholder="Search tasks"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          rightSection={searchQuery ? <IconX size={12} onClick={() => setSearchQuery('')} /> : null}
          style={{ width: 210, maxWidth: '36vw' }}
        />
        <SegmentedControl
          size="xs"
          value={taskFilter}
          onChange={setTaskFilter}
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
      <Group gap={8} wrap="nowrap">
        <Button size="xs" variant="light" color="blue" leftSection={<IconClockPlus size={14} />} onClick={() => openTimeEditor()}>
          Time
        </Button>
        <Button
          size="xs"
          color="blue"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={() => openTaskEditor(projectFilter !== 'all' ? { project_id: projectFilter } : {})}
        >
          Task
        </Button>
      </Group>
    </div>
  );
};
