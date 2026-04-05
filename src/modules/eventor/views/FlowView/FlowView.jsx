import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Stack, Text, Box, Center, Loader, Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useEventorStore } from '../../store/eventorStore';
import { useEvents } from '../../api/eventorApi';
import { EventCard } from '../../components/EventCard/EventCard';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Дни недели коротко
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Заголовок месяца — sticky
const MonthHeader = ({ date }) => (
  <div className="flow-month-header">
    {date.format('MMMM YYYY')}
  </div>
);

// Строка одного дня
const DayRow = ({ date, events, onAddClick, isToday }) => {
  const dayNum = date.date();
  const dayName = WEEKDAYS[date.day()];
  const isWeekend = date.day() === 0 || date.day() === 6;

  return (
    <div
      className="flow-date-row"
      id={isToday ? 'today_row' : undefined}
      style={{ background: isToday ? 'var(--mantine-color-blue-0)' : undefined }}
    >
      {/* Метка дня */}
      <div className={`flow-date-label ${isToday ? 'today' : ''}`}>
        {isToday ? (
          <div className="flow-day-num" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{
              background: 'var(--mantine-color-blue-6)', color: 'white',
              borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 13,
            }}>
              {dayNum}
            </div>
            <div className="flow-day-name">{dayName}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div className="flow-day-num" style={{
              color: isWeekend ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-7)',
            }}>
              {dayNum}
            </div>
            <div className="flow-day-name" style={{
              color: isWeekend ? 'var(--mantine-color-gray-4)' : undefined,
            }}>
              {dayName}
            </div>
          </div>
        )}
      </div>

      {/* Карточки событий */}
      <div className="flow-events-col">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* Кнопка добавить — появляется при ховере */}
        <Box
          className="flow-add-btn"
          mt={events.length > 0 ? 4 : 0}
        >
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
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
  const {
    activeSection, flowDirection,
    startMonth, endMonth,
    openEditor,
  } = useEventorStore();

  const todayRef = useRef(null);

  // Даты из стора
  const start = startMonth ? dayjs(startMonth) : dayjs().startOf('month');
  const end   = endMonth   ? dayjs(endMonth)   : dayjs().endOf('month');

  const { data: events, isLoading, isError } = useEvents({
    start: start.format('YYYY-MM-DD'),
    end:   end.format('YYYY-MM-DD'),
    section: activeSection,
  });

  // Скролл к сегодня при загрузке
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        const el = document.getElementById('today_row');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isLoading]);

  // Строим массив дней с учётом направления
  const dateArray = useMemo(() => {
    const days = [];
    let current = flowDirection === 'DESC' ? end.clone() : start.clone();
    const limit = flowDirection === 'DESC' ? start : end;
    const max = 1200; // защита от бесконечного цикла
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

  // Индекс событий по дате для быстрого доступа
  const eventsByDate = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const key = dayjs(ev.setdate).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const handleAddClick = useCallback((dateStr) => {
    openEditor({ id: null, date: dateStr, section_id: activeSection });
  }, [openEditor, activeSection]);

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h={200}>
        <Text c="red" size="sm">Failed to load events</Text>
      </Center>
    );
  }

  const today = dayjs().format('YYYY-MM-DD');
  let lastMonth = null;

  return (
    <div className="content-scroll" style={{ paddingBottom: 80 }}>
      {dateArray.map((date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const isToday = dateStr === today;
        const dayEvents = eventsByDate[dateStr] || [];

        // Вставляем заголовок при смене месяца
        const monthKey = date.format('YYYY-MM');
        const showMonthHeader = monthKey !== lastMonth;
        lastMonth = monthKey;

        return (
          <div key={dateStr}>
            {showMonthHeader && <MonthHeader date={date} />}
            <DayRow
              date={date}
              events={dayEvents}
              onAddClick={handleAddClick}
              isToday={isToday}
            />
          </div>
        );
      })}

      {/* Нижний отступ */}
      <Box h={40} />
    </div>
  );
};
