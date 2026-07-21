import { useLocation } from 'react-router-dom';
import { Button, Group, SegmentedControl, TextInput } from '@mantine/core';
import { IconClockHour4, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useTaskerStore } from '../../store/taskerStore';

export const TaskerToolbar = () => {
  const location = useLocation();
  const {
    taskFilter, setTaskFilter,
    searchQuery, setSearchQuery,
    openTaskEditor, openTimeEditor,
  } = useTaskerStore();

  const isListView = location.pathname === '/tasker' || location.pathname === '/tasker/';

  return (
    <div className="content-toolbar tasker-toolbar">
      <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        {isListView && (
          <>
            <TextInput
              size="xs"
              placeholder="Search tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={13} />}
              rightSection={searchQuery ? (
                <IconX size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              ) : null}
              style={{ width: 180, maxWidth: '25vw' }}
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
          </>
        )}
      </Group>
      <Group gap={6} wrap="nowrap">
        <Button
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconClockHour4 size={13} />}
          onClick={() => openTimeEditor()}
        >
          Span
        </Button>
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconPlus size={13} />}
          onClick={() => openTaskEditor()}
        >
          Task
        </Button>
      </Group>
    </div>
  );
};
