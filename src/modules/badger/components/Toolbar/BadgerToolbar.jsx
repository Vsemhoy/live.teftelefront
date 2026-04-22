import { ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconSun, IconLock, IconLockOpen } from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { BadgerRangePicker } from '../BadgerRangePicker/BadgerRangePicker';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

const C = 'green';

// Короткие названия месяцев для shown-month индикатора
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const BadgerToolbar = ({ visibleMonth, dragLocked, onToggleDragLock }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleToday = () => {
    const now = dayjs().format('YYYY-MM');
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('start', now);
      p.set('end', now);
      p.set('rangeMode', 'month');
      return p;
    }, { replace: true });
  };

  // Парсим visibleMonth (YYYY-MM) → короткое имя
  const monthLabel = visibleMonth
    ? SHORT_MONTHS[parseInt(visibleMonth.split('-')[1], 10) - 1]
    : null;

  return (
    <div className="content-toolbar bud-toolbar-grid">

      {/* Левый блок — текущий видимый месяц */}
      <div className="bud-toolbar-month">
        {monthLabel && (
          <Text size="sm" fw={700} c="green.6" style={{ letterSpacing: 0.5 }}>
            {monthLabel}
          </Text>
        )}
      </div>

      {/* Центр — навигация по датам + Today */}
      <div className="bud-toolbar-center">
        <BadgerRangePicker showModeSwitch />
        <Tooltip label="Back to current month">
          <ActionIcon variant="subtle" color={C} size="sm" onClick={handleToday}>
            <IconSun size={15} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Правый блок — Drag-Lock */}
      <div className="bud-toolbar-lock">
        <Tooltip label={dragLocked ? 'Drag locked — tap to unlock' : 'Drag unlocked'}>
          <ActionIcon
            variant={dragLocked ? 'subtle' : 'light'}
            color={dragLocked ? 'gray' : C}
            size="sm"
            onClick={onToggleDragLock}
          >
            {dragLocked ? <IconLock size={15} /> : <IconLockOpen size={15} />}
          </ActionIcon>
        </Tooltip>
      </div>

    </div>
  );
};
