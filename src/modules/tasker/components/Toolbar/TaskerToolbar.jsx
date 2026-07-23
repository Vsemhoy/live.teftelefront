import { useLocation } from 'react-router-dom';
import { Button, Group, Select, SegmentedControl, TextInput } from '@mantine/core';
import { IconClockHour4, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useTaskerStore } from '../../store/taskerStore';

const HOUR_OPTIONS = [
  { value: '0-23', label: '00:00-23:59' },
  { value: '7-20', label: '07:00-20:00' },
  { value: '8-20', label: '08:00-20:00' },
  { value: '9-20', label: '09:00-20:00' },
  { value: '9-18', label: '09:00-18:00' },
];

export const TaskerToolbar = () => {
  const location = useLocation();
  const {
    taskFilter, setTaskFilter,
    searchQuery, setSearchQuery,
    calendarHourRange, setCalendarHourRange,
    calendarShowFuture, setCalendarShowFuture,
    openTaskEditor, openTimeEditor,
  } = useTaskerStore();

  const isListView = location.pathname === '/tasker' || location.pathname === '/tasker/';
  const isCalendarView = location.pathname === '/tasker/calendar';

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
        {isCalendarView && (
          <>
            <Select
              size="xs"
              value={calendarHourRange}
              onChange={(value) => setCalendarHourRange(value || '9-20')}
              data={HOUR_OPTIONS}
              style={{ width: 150 }}
            />
            <Button
              size="xs"
              variant={calendarShowFuture ? 'filled' : 'light'}
              onClick={() => setCalendarShowFuture(!calendarShowFuture)}
            >
              {calendarShowFuture ? 'Hide future' : 'Show future'}
            </Button>
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
