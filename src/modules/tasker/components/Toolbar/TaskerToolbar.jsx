import { useLocation } from 'react-router-dom';
import { Button, Group, MultiSelect, Select, SegmentedControl, TextInput } from '@mantine/core';
import { IconLayoutRows, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useTasks } from '../../api/taskerApi';
import { useTaskerStore } from '../../store/taskerStore';

const HOUR_OPTIONS = [
  { value: '0-23', label: '00:00-23:59' },
  { value: '7-20', label: '07:00-20:00' },
  { value: '8-21', label: '08:00-21:00' },
  { value: '9-23', label: '09:00-23:00' },
  { value: '9-20', label: '09:00-20:00' },
  { value: '9-18', label: '09:00-18:00' },
];

const currentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const TaskerToolbar = () => {
  const location = useLocation();
  const {
    taskFilter, setTaskFilter,
    searchQuery, setSearchQuery,
    projectFilter,
    calendarHourRange, setCalendarHourRange,
    calendarShowFuture, setCalendarShowFuture,
    calendarMonth, setCalendarMonth,
    calendarMarkupMode, setCalendarMarkupMode,
    calendarMarkupTaskIds, setCalendarMarkupTaskIds, clearCalendarMarkup,
    openTaskEditor,
  } = useTaskerStore();
  const { data: tasks = [] } = useTasks({ filter: 'open', include_hidden: false, limit: 500 });

  const isListView = location.pathname === '/tasker' || location.pathname === '/tasker/';
  const isCalendarView = location.pathname === '/tasker/calendar';
  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.title || task.id,
  }));

  const handleCalendarMonthChange = (event) => {
    const nextMonth = event.currentTarget.value || currentMonthKey();
    setCalendarMonth(nextMonth);
    if (nextMonth > currentMonthKey()) {
      setCalendarShowFuture(true);
    }
  };

  const handleAddTask = () => {
    openTaskEditor(projectFilter && projectFilter !== 'all' ? { project_id: projectFilter } : {});
  };

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
        {isCalendarView && calendarMarkupMode && (
          <>
            <MultiSelect
              size="xs"
              searchable
              clearable
              placeholder="Add layout task"
              value={calendarMarkupTaskIds}
              onChange={setCalendarMarkupTaskIds}
              data={taskOptions}
              maxDropdownHeight={280}
              style={{ width: 320, maxWidth: '42vw' }}
            />
            {calendarMarkupTaskIds.length > 0 && (
              <Button
                size="xs"
                variant="light"
                color="gray"
                onClick={clearCalendarMarkup}
              >
                Clear empty rows
              </Button>
            )}
          </>
        )}
        {isCalendarView && !calendarMarkupMode && (
          <>
            <Select
              size="xs"
              value={calendarHourRange}
              onChange={(value) => setCalendarHourRange(value || '9-20')}
              data={HOUR_OPTIONS}
              style={{ width: 150 }}
            />
            <TextInput
              size="xs"
              type="month"
              value={calendarMonth || currentMonthKey()}
              onChange={handleCalendarMonthChange}
              style={{ width: 145 }}
            />
            <Button
              size="xs"
              variant={calendarShowFuture ? 'filled' : 'light'}
              color="blue"
              onClick={() => setCalendarShowFuture(!calendarShowFuture)}
            >
              {calendarShowFuture ? 'Hide future' : 'Show future'}
            </Button>
          </>
        )}
      </Group>
      {isListView && (
        <Group gap={6} wrap="nowrap" style={{ marginLeft: 'auto' }}>
          <Button
            size="xs"
            color="blue"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddTask}
          >
            Task
          </Button>
        </Group>
      )}
      {isCalendarView && (
        <Group gap={6} wrap="nowrap">
          <Button
            size="xs"
            variant={calendarMarkupMode ? 'filled' : 'light'}
            color="blue"
            leftSection={<IconLayoutRows size={13} />}
            onClick={() => setCalendarMarkupMode(!calendarMarkupMode)}
          >
            Markup
          </Button>
        </Group>
      )}
    </div>
  );
};
