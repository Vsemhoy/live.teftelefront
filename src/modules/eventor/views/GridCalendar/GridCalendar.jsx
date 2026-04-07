import { useState, useMemo } from 'react';
import {
  Box, Text, Group, Paper, Stack, Popover,
  ActionIcon, Divider, Button, Center, Loader,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import { useEventorStore } from '../../store/eventorStore';
import { useEvents } from '../../api/eventorApi';
import { EventCard } from '../../components/EventCard/EventCard';

const WEEKDAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EventPill = ({ event, onOpen }) => {
  const color = event.type_bgcolor
    ? event.type_bgcolor.substring(0, 7)
    : 'var(--mantine-color-blue-5)';

  return (
    <Box
      onClick={(e) => { e.stopPropagation(); onOpen(event); }}
      style={{
        background: color + '22',
        borderLeft: `2px solid ${color}`,
        borderRadius: 2, padding: '1px 5px',
        fontSize: 11, cursor: 'pointer',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        color: 'var(--mantine-color-gray-8)', lineHeight: '16px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = color + '44'}
      onMouseLeave={(e) => e.currentTarget.style.background = color + '22'}
    >
      {event.name || '—'}
    </Box>
  );
};

const DayPopover = ({ date, events, onAdd }) => {
  const { openReader } = useEventorStore();
  return (
    <Stack gap={6} style={{ maxWidth: 320, minWidth: 260 }}>
      <Group justify="space-between">
        <Text size="sm" fw={600}>{date.format('D MMMM YYYY')}</Text>
        <ActionIcon size="xs" variant="light" onClick={() => onAdd(date.format('YYYY-MM-DD'))}>
          <IconPlus size={12} />
        </ActionIcon>
      </Group>
      <Divider />
      {events.length === 0
        ? <Text size="xs" c="dimmed">No events</Text>
        : events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))
      }
    </Stack>
  );
};

export const GridCalendar = () => {
  const [searchParams] = useSearchParams();
  const { openEditor, openReader } = useEventorStore();

  const activeSection = searchParams.get('section') || 'ALL';

  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [popoverDay, setPopoverDay] = useState(null);

  const monthStart = currentMonth.startOf('month');
  const monthEnd   = currentMonth.endOf('month');

  const { data: events, isLoading } = useEvents({
    start: monthStart.format('YYYY-MM-DD'),
    end:   monthEnd.format('YYYY-MM-DD'),
    section: activeSection,
  });

  const eventsByDate = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const key = dayjs(ev.setdate).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const startDow = monthStart.day();
    const offset = startDow === 0 ? -6 : 1 - startDow;
    const gridFrom = monthStart.add(offset, 'day');
    const days = [];
    let cur = gridFrom.clone();
    for (let i = 0; i < 42; i++) {
      days.push(cur.clone());
      cur = cur.add(1, 'day');
    }
    return days;
  }, [currentMonth]);

  const today = dayjs().format('YYYY-MM-DD');

  const handleAdd = (dateStr) => {
    setPopoverDay(null);
    openEditor({ id: null, date: dateStr, section_id: activeSection });
  };

  return (
    <div className="content-scroll">
      <Group px={16} py={10} justify="space-between">
        <ActionIcon variant="subtle" onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}>
          <IconChevronLeft size={16} />
        </ActionIcon>
        <Text fw={600} size="sm">{currentMonth.format('MMMM YYYY')}</Text>
        <ActionIcon variant="subtle" onClick={() => setCurrentMonth(m => m.add(1, 'month'))}>
          <IconChevronRight size={16} />
        </ActionIcon>
      </Group>

      {isLoading ? (
        <Center h={200}><Loader size="sm" /></Center>
      ) : (
        <Box px={12} pb={24}>
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS_HEADER.map((d) => (
              <Text key={d} size="xs" ta="center"
                c={d === 'Sat' || d === 'Sun' ? 'red.3' : 'gray.6'}
                fw={600} style={{ letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 0' }}
              >{d}</Text>
            ))}
          </Box>

          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {gridDays.map((date) => {
              const dateStr = date.format('YYYY-MM-DD');
              const isCurrentMonth = date.month() === currentMonth.month();
              const isToday = dateStr === today;
              const isWeekend = date.day() === 0 || date.day() === 6;
              const dayEvents = eventsByDate[dateStr] || [];
              const isOpen = popoverDay === dateStr;

              return (
                <Popover key={dateStr} opened={isOpen} onClose={() => setPopoverDay(null)}
                  position="bottom" withArrow shadow="md" radius="md" withinPortal>
                  <Popover.Target>
                    <Paper
                      onClick={() => setPopoverDay(isOpen ? null : dateStr)}
                      radius="xs"
                      style={{
                        minHeight: 80, padding: '4px 5px', cursor: 'pointer',
                        background: isToday ? 'var(--mantine-color-blue-0)' : isOpen ? 'var(--mantine-color-gray-1)' : 'white',
                        opacity: isCurrentMonth ? 1 : 0.4,
                        border: isToday ? '1px solid var(--mantine-color-blue-3)' : '1px solid var(--mantine-color-gray-2)',
                        transition: 'background 0.1s',
                      }}
                    >
                      <Box mb={3}>
                        {isToday ? (
                          <Box style={{
                            background: 'var(--mantine-color-blue-6)', color: 'white',
                            borderRadius: '50%', width: 22, height: 22,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600,
                          }}>{date.date()}</Box>
                        ) : (
                          <Text size="xs" fw={400}
                            c={isWeekend && isCurrentMonth ? 'red.3' : isCurrentMonth ? 'gray.8' : 'gray.4'}
                          >{date.date()}</Text>
                        )}
                      </Box>
                      <Stack gap={2}>
                        {dayEvents.slice(0, 3).map((ev) => (
                          <EventPill key={ev.id} event={ev} onOpen={(e) => openReader({ id: e.id, event: e })} />
                        ))}
                        {dayEvents.length > 3 && (
                          <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>+{dayEvents.length - 3} more</Text>
                        )}
                      </Stack>
                    </Paper>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <DayPopover date={date} events={dayEvents} onAdd={handleAdd} />
                  </Popover.Dropdown>
                </Popover>
              );
            })}
          </Box>
        </Box>
      )}
    </div>
  );
};
