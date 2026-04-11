import { Group, Button, ActionIcon, Text, Tooltip, Popover, Stack } from '@mantine/core';
import {
  IconChevronLeft, IconChevronRight, IconPlus,
  IconLayoutColumns, IconCalendarStats,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { MonthPickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useBadgerStore } from '../../store/badgerStore';

// Цвет темы Badger
const C = 'green';

export const BadgerToolbar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openEditor, balanceMode, toggleBalanceMode, activeAccounts } = useBadgerStore();

  // Читаем start/end из URL (или дефолт — текущий месяц)
  const startParam = searchParams.get('start') || dayjs().format('YYYY-MM');
  const endParam   = searchParams.get('end')   || dayjs().format('YYYY-MM');

  const startDate = dayjs(startParam + '-01');
  const endDate   = dayjs(endParam   + '-01');

  const isSingleMonth = startParam === endParam;
  const isCurrentMonth = isSingleMonth && startParam === dayjs().format('YYYY-MM');

  const setRange = (start, end) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('start', start);
      p.set('end',   end);
      return p;
    }, { replace: true });
  };

  // Навигация: сдвиг на месяц вперёд/назад
  const shiftBack = () => {
    const months = endDate.diff(startDate, 'month') + 1;
    setRange(
      startDate.subtract(months, 'month').format('YYYY-MM'),
      endDate.subtract(months, 'month').format('YYYY-MM'),
    );
  };
  const shiftForward = () => {
    const months = endDate.diff(startDate, 'month') + 1;
    setRange(
      startDate.add(months, 'month').format('YYYY-MM'),
      endDate.add(months, 'month').format('YYYY-MM'),
    );
  };

  // Расширение: добавить месяц к началу или концу
  const expandBack    = () => setRange(startDate.subtract(1, 'month').format('YYYY-MM'), endParam);
  const expandForward = () => setRange(startParam, endDate.add(1, 'month').format('YYYY-MM'));
  const shrinkBack    = () => {
    if (startParam === endParam) return; // минимум 1 месяц
    setRange(startDate.add(1, 'month').format('YYYY-MM'), endParam);
  };
  const shrinkForward = () => {
    if (startParam === endParam) return;
    setRange(startParam, endDate.subtract(1, 'month').format('YYYY-MM'));
  };

  const goToday = () => {
    const now = dayjs().format('YYYY-MM');
    setRange(now, now);
  };

  // Лейбл диапазона
  const rangeLabel = isSingleMonth
    ? startDate.format('MMMM YYYY')
    : `${startDate.format('MMM YYYY')} — ${endDate.format('MMM YYYY')}`;

  return (
    <div className="content-toolbar">
      <Group px={12} py={6} gap={6} justify="space-between" wrap="nowrap">

        {/* Левая часть — навигация */}
        <Group gap={2} wrap="nowrap">

          {/* ← сдвиг назад */}
          <Tooltip label="Previous period">
            <ActionIcon variant="subtle" color={C} size="sm" onClick={shiftBack}>
              <IconChevronLeft size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Лейбл диапазона + расширение */}
          <Popover position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Button
                variant={isSingleMonth ? 'subtle' : 'light'}
                color={C}
                size="compact-sm"
                style={{ minWidth: 140 }}
              >
                {rangeLabel}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap={8}>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Expand range
                </Text>
                <Group gap={6}>
                  <Tooltip label="Add month to start">
                    <Button size="compact-xs" variant="light" color={C} onClick={expandBack}>
                      ← +month
                    </Button>
                  </Tooltip>
                  <Tooltip label="Remove month from start">
                    <Button size="compact-xs" variant="subtle" color="gray"
                      onClick={shrinkBack} disabled={isSingleMonth}>
                      → −month
                    </Button>
                  </Tooltip>
                </Group>
                <Group gap={6}>
                  <Tooltip label="Remove month from end">
                    <Button size="compact-xs" variant="subtle" color="gray"
                      onClick={shrinkForward} disabled={isSingleMonth}>
                      ← −month
                    </Button>
                  </Tooltip>
                  <Tooltip label="Add month to end">
                    <Button size="compact-xs" variant="light" color={C} onClick={expandForward}>
                      +month →
                    </Button>
                  </Tooltip>
                </Group>
                {/* Быстрые пресеты */}
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Presets
                </Text>
                <Group gap={6}>
                  {[
                    { label: '1M', months: 1 },
                    { label: '3M', months: 3 },
                    { label: '6M', months: 6 },
                    { label: '1Y', months: 12 },
                  ].map(({ label, months }) => (
                    <Button key={label} size="compact-xs" variant="light" color={C}
                      onClick={() => setRange(
                        dayjs().subtract(months - 1, 'month').format('YYYY-MM'),
                        dayjs().format('YYYY-MM'),
                      )}>
                      {label}
                    </Button>
                  ))}
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* → сдвиг вперёд */}
          <Tooltip label="Next period">
            <ActionIcon variant="subtle" color={C} size="sm" onClick={shiftForward}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Today */}
          {!isCurrentMonth && (
            <Button variant="light" color={C} size="compact-xs" onClick={goToday}>
              Today
            </Button>
          )}

          {/* Индикатор диапазона */}
          {!isSingleMonth && (
            <Text size="xs" c="dimmed">
              {endDate.diff(startDate, 'month') + 1} mo
            </Text>
          )}
        </Group>

        {/* Правая часть */}
        <Group gap={6} wrap="nowrap">
          <Tooltip label={balanceMode === 'basic' ? 'Extended balance' : 'Basic balance'}>
            <ActionIcon
              variant={balanceMode === 'extended' ? 'light' : 'subtle'}
              color={C}
              size="sm"
              onClick={toggleBalanceMode}
            >
              <IconLayoutColumns size={15} />
            </ActionIcon>
          </Tooltip>

          <Button
            size="compact-sm"
            variant="filled"
            color={C}
            leftSection={<IconPlus size={13} />}
            onClick={() => openEditor({ date: dayjs().format('YYYY-MM-DD') })}
            disabled={activeAccounts.length === 0}
          >
            New
          </Button>
        </Group>

      </Group>
    </div>
  );
};
