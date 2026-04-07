import { Group, Button, ActionIcon, Tooltip } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import {
  IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight,
  IconSortAscending, IconSortDescending,
  IconPlus, IconSun,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useEventorStore } from '../../store/eventorStore';

export const EventorToolbar = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openEditor } = useEventorStore();

  // Текущий вид из URL
  const currentView = location.pathname.split('/').filter(Boolean).pop();
  const showNav = currentView === 'flow' || currentView === 'calendar';

  // Параметры из URL
  const startParam = searchParams.get('start'); // 'YYYY-MM'
  const endParam   = searchParams.get('end');
  const dirParam   = searchParams.get('dir') || 'DESC';
  const activeSection = searchParams.get('section') || 'ALL';

  const start = startParam ? dayjs(startParam + '-01').startOf('month') : dayjs().startOf('month');
  const end   = endParam   ? dayjs(endParam   + '-01').endOf('month')   : dayjs().endOf('month');

  const updateParams = (updates) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v != null) p.set(k, v);
          else p.delete(k);
        });
        return p;
      },
      { replace: true }
    );
  };

  const setDateRange = (s, e) => updateParams({
    start: s.format('YYYY-MM'),
    end:   e.format('YYYY-MM'),
  });

  const moveMonth = (delta) => setDateRange(
    start.add(delta, 'month').startOf('month'),
    end.add(delta, 'month').endOf('month'),
  );

  const expandStart = () => setDateRange(start.subtract(1, 'month').startOf('month'), end);
  const expandEnd   = () => setDateRange(start, end.add(1, 'month').endOf('month'));

  const goToday = () => setDateRange(dayjs().startOf('month'), dayjs().endOf('month'));

  const toggleDir = () => updateParams({ dir: dirParam === 'DESC' ? 'ASC' : 'DESC' });

  return (
    <div className="content-toolbar">
      {showNav && (
        <>
          <Tooltip label="Expand left" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={expandStart}>
              <IconChevronsLeft size={15} />
            </ActionIcon>
          </Tooltip>

          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveMonth(-1)}>
            <IconChevronLeft size={15} />
          </ActionIcon>

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

          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveMonth(1)}>
            <IconChevronRight size={15} />
          </ActionIcon>

          <Tooltip label="Expand right" withArrow>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={expandEnd}>
              <IconChevronsRight size={15} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Jump to today" withArrow>
            <ActionIcon variant="subtle" color="blue" size="sm" onClick={goToday}>
              <IconSun size={15} />
            </ActionIcon>
          </Tooltip>

          {currentView === 'flow' && (
            <Tooltip label={dirParam === 'DESC' ? 'Newest first' : 'Oldest first'} withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={toggleDir}>
                {dirParam === 'DESC'
                  ? <IconSortDescending size={15} />
                  : <IconSortAscending size={15} />
                }
              </ActionIcon>
            </Tooltip>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

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
