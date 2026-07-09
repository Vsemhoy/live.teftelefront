import { useCallback, useEffect, useMemo } from 'react';
import { Text, Box, Center, Loader, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useEventorStore } from '../../store/eventorStore';
import { useEvents } from '../../api/eventorApi';
import { EventCard } from '../../components/EventCard/EventCard';
import { useMasonryColumns } from '@/shared/hooks/useMasonryColumns';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthHeader = ({ date }) => (
  <div className="flow-month-header">{date.format('MMMM YYYY')}</div>
);

const DayRow = ({ date, events, onAddClick, isToday, stripe, masonryColumns }) => {
  const dayNum = date.date();
  const dayName = WEEKDAYS[date.day()];
  const isWeekend = date.day() === 0 || date.day() === 6;

  let rowBg;
  if (isToday) {
    rowBg = 'var(--mantine-color-blue-0)';
  } else if (isWeekend) {
    rowBg = stripe ? 'rgba(255,200,200,0.32)' : 'rgba(255,200,200,0.16)';
  } else {
    rowBg = stripe ? 'rgba(0,0,0,0.018)' : 'transparent';
  }

  // Breakpoints для react-masonry-css — используем вычисленное число колонок
  const breakpoints = { default: masonryColumns };

  return (
    <div
      className="flow-date-row"
      id={isToday ? 'today_row' : undefined}
      style={{ background: rowBg }}
    >
      {/* Колонка даты — двойной клик добавляет событие */}
      <div
        className={`flow-date-label ${isToday ? 'today' : ''}`}
        onDoubleClick={() => onAddClick(date.format('YYYY-MM-DD'))}
        title="Double-click to add event"
        style={{ cursor: 'pointer' }}
      >
        {isToday ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{
              background: 'var(--mantine-color-blue-6)', color: 'white',
              borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 13,
            }}>{dayNum}</div>
            <div className="flow-day-name">{dayName}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div className="flow-day-num" style={{
              color: isWeekend ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-gray-7)',
            }}>{dayNum}</div>
            <div className="flow-day-name" style={{
              color: isWeekend ? 'var(--mantine-color-red-3)' : undefined,
            }}>{dayName}</div>
          </div>
        )}
      </div>

      <div
        className="flow-events-col"
        onDoubleClick={(e) => {
          // Если клик был внутри карточки — не открываем редактор
          if (e.target.closest('.event-card')) return;
          onAddClick(date.format('YYYY-MM-DD'));
        }}
      >
        {events.length > 0 ? (
          // Масонри для карточек — если одна колонка, просто стак
          masonryColumns === 1 ? (
            events.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <Masonry
              breakpointCols={breakpoints}
              className="masonry-grid"
              columnClassName="masonry-grid-col"
            >
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Masonry>
          )
        ) : null}

        {/* Кнопка Add — видна при ховере */}
        <Box className="flow-add-btn" mt={events.length > 0 ? 4 : 0}>
          <Button
            variant="subtle" color="gray" size="compact-xs"
            leftSection={<IconPlus size={11} />}
            onClick={() => onAddClick(date.format('YYYY-MM-DD'))}
            styles={{ root: { fontSize: 11 } }}
          >
            Add
          </Button>
        </Box>
      </div>
    </div>
  );
};

export const FlowView = () => {
  const [searchParams] = useSearchParams();
  const { openEditor } = useEventorStore();

  // Для строк Flow держим более компактную целевую ширину колонки,
  // чтобы masonry включался раньше и события раскладывались по колонкам.
  const { ref: containerRef, columns: masonryColumns } = useMasonryColumns(500);

  const startParam    = searchParams.get('start');
  const endParam      = searchParams.get('end');
  const activeSection = searchParams.get('section') || 'ALL';
  const flowDirection = searchParams.get('dir') || 'DESC';

  const start = startParam ? dayjs(startParam + '-01').startOf('month') : dayjs().startOf('month');
  const end   = endParam   ? dayjs(endParam   + '-01').endOf('month')   : dayjs().endOf('month');

  const { data: events, isLoading, isError } = useEvents({
    start: start.format('YYYY-MM-DD'),
    end:   end.format('YYYY-MM-DD'),
    section: activeSection,
  });

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        const el = document.getElementById('today_row');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isLoading]);

  const dateArray = useMemo(() => {
    const days = [];
    let current = flowDirection === 'DESC' ? end.clone() : start.clone();
    const limit = flowDirection === 'DESC' ? start : end;
    const max = 1200;
    let i = 0;
    while (i < max) {
      days.push(current.clone());
      current = flowDirection === 'DESC'
        ? current.subtract(1, 'day')
        : current.add(1, 'day');
      if (flowDirection === 'DESC' && current.isBefore(limit, 'day')) break;
      if (flowDirection === 'ASC'  && current.isAfter(limit, 'day'))  break;
      i++;
    }
    return days;
  }, [start, end, flowDirection]);

  const eventsByDate = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const key = dayjs(ev.occurred_at).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const handleAddClick = useCallback((dateStr) => {
    openEditor({ id: null, date: dateStr, section_id: activeSection });
  }, [openEditor, activeSection]);

  if (isLoading) return <Center h={200}><Loader size="sm" /></Center>;
  if (isError) return <Center h={200}><Text c="red" size="sm">Failed to load events</Text></Center>;

  const today = dayjs().format('YYYY-MM-DD');
  let lastMonth = null;
  let rowIndex = 0;

  return (
    <div className="content-scroll" style={{ paddingBottom: 80 }} ref={containerRef}>
      {dateArray.map((date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const isToday = dateStr === today;
        const dayEvents = eventsByDate[dateStr] || [];

        const monthKey = date.format('YYYY-MM');
        const showMonthHeader = monthKey !== lastMonth;
        lastMonth = monthKey;

        const stripe = rowIndex % 2 === 1;
        rowIndex++;

        return (
          <div key={dateStr}>
            {showMonthHeader && <MonthHeader date={date} />}
            <DayRow
              date={date}
              events={dayEvents}
              onAddClick={handleAddClick}
              isToday={isToday}
              stripe={stripe}
              masonryColumns={masonryColumns}
            />
          </div>
        );
      })}
      <Box h={40} />
    </div>
  );
};



