import { Group, Button, ActionIcon, SegmentedControl, Tooltip, Text } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import {
  IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight,
  IconSortAscending, IconSortDescending,
  IconPlus, IconSun,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEventorStore } from '../../store/eventorStore';

export const EventorToolbar = ({ onScrollToday }) => {
  const {
    viewMode,
    flowDirection, setFlowDirection,
    startMonth, endMonth, setDateRange,
    openEditor, activeSection,
  } = useEventorStore();

  // Парсим даты из стора (ISO string → dayjs)
  const start = startMonth ? dayjs(startMonth) : dayjs().startOf('month');
  const end   = endMonth   ? dayjs(endMonth)   : dayjs().endOf('month');

  const moveMonth = (delta) => {
    setDateRange(
      start.add(delta, 'month').startOf('month'),
      end.add(delta, 'month').endOf('month'),
    );
  };

  const expandStart = () => setDateRange(start.subtract(1, 'month').startOf('month'), end);
  const expandEnd   = () => setDateRange(start, end.add(1, 'month').endOf('month'));

  const goToday = () => {
    setDateRange(dayjs().startOf('month'), dayjs().endOf('month'));
    if (onScrollToday) onScrollToday();
  };

  // Показываем навигацию только в flow и grid
  const showNav = viewMode === 'flow' || viewMode === 'grid';

  return (
    <div className="content-toolbar">
      {showNav && (
        <>
          {/* Расширить диапазон влево */}
          <Tooltip label="Expand left" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={expandStart}>
              <IconChevronsLeft size={15} />
            </ActionIcon>
          </Tooltip>

          {/* Назад на месяц */}
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveMonth(-1)}>
            <IconChevronLeft size={15} />
          </ActionIcon>

          {/* Выбор диапазона — кастомное отображение */}
          <MonthPickerInput
            type="range"
            value={[start.toDate(), end.toDate()]}
            onChange={([s, e]) => {
              if (s && e) setDateRange(dayjs(s).startOf('month'), dayjs(e).endOf('month'));
            }}
            size="xs"
            style={{ width: 200 }}
            valueFormat="MMM YYYY"
            placeholder="Select range"
          />

          {/* Вперёд на месяц */}
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveMonth(1)}>
            <IconChevronRight size={15} />
          </ActionIcon>

          {/* Расширить диапазон вправо */}
          <Tooltip label="Expand right" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={expandEnd}>
              <IconChevronsRight size={15} />
            </ActionIcon>
          </Tooltip>

          {/* Кнопка "сегодня" */}
          <Tooltip label="Jump to today" withArrow>
            <ActionIcon variant="subtle" color="blue" size="sm" onClick={goToday}>
              <IconSun size={15} />
            </ActionIcon>
          </Tooltip>

          {/* Направление сортировки — только для flow */}
          {viewMode === 'flow' && (
            <Tooltip label={flowDirection === 'DESC' ? 'Newest first' : 'Oldest first'} withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setFlowDirection(flowDirection === 'DESC' ? 'ASC' : 'DESC')}
              >
                {flowDirection === 'DESC'
                  ? <IconSortDescending size={15} />
                  : <IconSortAscending size={15} />
                }
              </ActionIcon>
            </Tooltip>
          )}
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Кнопка создания — только если залогинен */}
      <Button
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={() => openEditor({ id: null, section_id: activeSection })}
      >
        New event
      </Button>
    </div>
  );
};
