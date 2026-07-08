import { Group, Button, ActionIcon, Tooltip, SegmentedControl, Popover, Modal, Stack, Text } from '@mantine/core';
import { MonthPicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

const C = 'green';

// ─── Утилиты ─────────────────────────────────────────────────────

function getCurrentPeriod(mode) {
  const now = dayjs();
  switch (mode) {
    case '3m': {
      const q = now.quarter();
      const start = now.startOf('year').add((q - 1) * 3, 'month');
      return { start: start.format('YYYY-MM'), end: start.add(2, 'month').format('YYYY-MM'), label: `Q${q} ${now.year()}` };
    }
    case '6m': {
      const half = now.month() < 6 ? 0 : 1;
      const start = now.startOf('year').add(half * 6, 'month');
      return { start: start.format('YYYY-MM'), end: start.add(5, 'month').format('YYYY-MM'), label: `H${half + 1} ${now.year()}` };
    }
    case '12m':
      return { start: now.startOf('year').format('YYYY-MM'), end: now.endOf('year').format('YYYY-MM'), label: String(now.year()) };
    default:
      return { start: now.format('YYYY-MM'), end: now.format('YYYY-MM'), label: now.format('MMMM YYYY') };
  }
}

function shiftPeriod(startParam, endParam, mode, dir) {
  const start = dayjs(startParam + '-01');
  switch (mode) {
    case '3m': {
      const newStart = start.add(dir * 3, 'month');
      const q = newStart.quarter();
      const snapped = newStart.startOf('year').add((q - 1) * 3, 'month');
      return { start: snapped.format('YYYY-MM'), end: snapped.add(2, 'month').format('YYYY-MM') };
    }
    case '6m': {
      const newStart = start.add(dir * 6, 'month');
      const half = newStart.month() < 6 ? 0 : 1;
      const snapped = newStart.startOf('year').add(half * 6, 'month');
      return { start: snapped.format('YYYY-MM'), end: snapped.add(5, 'month').format('YYYY-MM') };
    }
    case '12m': {
      const newYear = start.add(dir, 'year');
      return { start: newYear.startOf('year').format('YYYY-MM'), end: newYear.endOf('year').format('YYYY-MM') };
    }
    default: {
      const newStart = start.add(dir, 'month');
      return { start: newStart.format('YYYY-MM'), end: newStart.format('YYYY-MM') };
    }
  }
}

function getRangeLabel(startParam, endParam, mode) {
  const start = dayjs(startParam + '-01');
  const end   = dayjs(endParam   + '-01');
  if (mode === '3m')  return `Q${start.quarter()} ${start.year()}`;
  if (mode === '6m')  return `H${start.month() < 6 ? 1 : 2} ${start.year()}`;
  if (mode === '12m') return String(start.year());
  if (startParam === endParam) return start.format('MMMM YYYY');
  return `${start.format('MMM YYYY')} — ${end.format('MMM YYYY')}`;
}

// ─── MonthPicker с поповером (десктоп) ───────────────────────────

const RangePopover = ({ startParam, endParam, onConfirm, label }) => {
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState([new Date(startParam + '-01'), new Date(endParam + '-01')]);

  const handleChange = (val) => {
    setValue(val);
    if (val[0] && val[1]) {
      onConfirm(dayjs(val[0]).format('YYYY-MM'), dayjs(val[1]).format('YYYY-MM'));
      setOpened(false);
    }
  };

  return (
    <Popover
      opened={opened}
      onClose={() => { setOpened(false); setValue([new Date(startParam + '-01'), new Date(endParam + '-01')]); }}
      position="bottom" withArrow shadow="md" trapFocus={false}
    >
      <Popover.Target>
        <Button variant="light" color={C} size="compact-sm"
          style={{ minWidth: 200 }} onClick={() => setOpened((o) => !o)}>
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={8}>
        <MonthPicker type="range" value={value} onChange={handleChange} numberOfColumns={2} />
      </Popover.Dropdown>
    </Popover>
  );
};

// ─── MonthPicker в модалке (мобилка) ─────────────────────────────

const RangeModal = ({ startParam, endParam, onConfirm, label }) => {
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState([new Date(startParam + '-01'), new Date(endParam + '-01')]);

  const handleChange = (val) => {
    setValue(val);
    if (val[0] && val[1]) {
      onConfirm(dayjs(val[0]).format('YYYY-MM'), dayjs(val[1]).format('YYYY-MM'));
      setOpened(false);
    }
  };

  return (
    <>
      <Button variant="light" color={C} size="compact-sm"
        style={{ minWidth: 160 }} onClick={() => setOpened(true)}>
        {label}
      </Button>
      <Modal
        opened={opened}
        onClose={() => { setOpened(false); setValue([new Date(startParam + '-01'), new Date(endParam + '-01')]); }}
        fullScreen
        title={<Text fw={600} size="sm">Select range</Text>}
        styles={{ body: { display: 'flex', justifyContent: 'center', paddingTop: 16 } }}
      >
        <MonthPicker type="range" value={value} onChange={handleChange} numberOfColumns={1} size="md" />
      </Modal>
    </>
  );
};

// ─── Мобильный тулбар-кнопка ─────────────────────────────────────
// На мобилке показываем только режим + лейбл, тап → модалка с полным пикером

const MobileRangePicker = ({ startParam, endParam, mode, label, onRangeConfirm, onShiftBack, onShiftForward }) => {
  const [opened, setOpened] = useState(false);
  const [value, setValue]   = useState([new Date(startParam + '-01'), new Date(endParam + '-01')]);

  const handleChange = (val) => {
    setValue(val);
    if (val[0] && val[1]) {
      onRangeConfirm(dayjs(val[0]).format('YYYY-MM'), dayjs(val[1]).format('YYYY-MM'));
      setOpened(false);
    }
  };

  const modeLabel = { month: '1M', '3m': '3M', '6m': '6M', '12m': '1Y', custom: '⋯' }[mode] || '1M';

  return (
    <>
      <Group gap={2} wrap="nowrap" style={{ flex: 1 }}>
        <ActionIcon variant="subtle" color={C} size="sm" onClick={onShiftBack}>
          <IconChevronLeft size={16} />
        </ActionIcon>

        <Button
          variant="subtle" color={C} size="compact-sm"
          style={{ flex: 1, fontWeight: 600 }}
          leftSection={<IconCalendar size={13} />}
          onClick={() => setOpened(true)}
        >
          {modeLabel} · {label}
        </Button>

        <ActionIcon variant="subtle" color={C} size="sm" onClick={onShiftForward}>
          <IconChevronRight size={16} />
        </ActionIcon>
      </Group>

      <Modal
        opened={opened}
        onClose={() => { setOpened(false); setValue([new Date(startParam + '-01'), new Date(endParam + '-01')]); }}
        fullScreen
        title={<Text fw={600} size="sm">Select period</Text>}
        styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 16 } }}
      >
        <MonthPicker type="range" value={value} onChange={handleChange} numberOfColumns={1} size="md" />
      </Modal>
    </>
  );
};

// ─── LedgerRangePicker — основной экспорт ────────────────────────

export const LedgerRangePicker = ({ showModeSwitch = true }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const startParam = searchParams.get('start')     || dayjs().format('YYYY-MM');
  const endParam   = searchParams.get('end')       || dayjs().format('YYYY-MM');
  const mode       = searchParams.get('rangeMode') || 'month';

  const setRange = (start, end, newMode) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('start', start);
      p.set('end',   end);
      if (newMode !== undefined) p.set('rangeMode', newMode);
      return p;
    }, { replace: true });
  };

  const handleModeChange = (newMode) => {
    if (newMode === 'custom') { setRange(startParam, endParam, 'custom'); return; }
    const period = getCurrentPeriod(newMode);
    setRange(period.start, period.end, newMode);
  };

  const handleShiftBack    = () => { const r = shiftPeriod(startParam, endParam, mode, -1); setRange(r.start, r.end); };
  const handleShiftForward = () => { const r = shiftPeriod(startParam, endParam, mode,  1); setRange(r.start, r.end); };
  const handleToday        = () => { const p = getCurrentPeriod(mode); setRange(p.start, p.end); };

  const expandBack    = () => setRange(dayjs(startParam + '-01').subtract(1, 'month').format('YYYY-MM'), endParam, 'month');
  const expandForward = () => setRange(startParam, dayjs(endParam + '-01').add(1, 'month').format('YYYY-MM'), 'month');

  const label = getRangeLabel(startParam, endParam, mode);
  const current = getCurrentPeriod(mode);
  const isCurrentPeriod = current.start === startParam && current.end === endParam;

  // ── Мобилка ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileRangePicker
        startParam={startParam}
        endParam={endParam}
        mode={mode}
        label={label}
        onRangeConfirm={(start, end) => setRange(start, end, 'custom')}
        onShiftBack={handleShiftBack}
        onShiftForward={handleShiftForward}
      />
    );
  }

  // ── Десктоп ───────────────────────────────────────────────────────
  return (
    <Group gap={4} wrap="nowrap">

      {showModeSwitch && (
        <SegmentedControl
          value={mode}
          onChange={handleModeChange}
          size="xs"
          data={[
            { label: '+month', value: 'month' },
            { label: '3M',     value: '3m' },
            { label: '6M',     value: '6m' },
            { label: '1Y',     value: '12m' },
            { label: 'Custom', value: 'custom' },
          ]}
          styles={{ root: { background: 'transparent' } }}
        />
      )}

      <Group gap={2} wrap="nowrap">
        <Tooltip label="Previous period">
          <ActionIcon variant="subtle" color={C} size="sm" onClick={handleShiftBack}>
            <IconChevronLeft size={16} />
          </ActionIcon>
        </Tooltip>

        {mode === 'custom' ? (
          <RangePopover
            startParam={startParam}
            endParam={endParam}
            label={label}
            onConfirm={(start, end) => setRange(start, end)}
          />
        ) : (
          <Button variant="subtle" color={C} size="compact-sm"
            style={{ minWidth: 130, fontWeight: 600 }} onClick={handleToday}>
            {label}
          </Button>
        )}

        <Tooltip label="Next period">
          <ActionIcon variant="subtle" color={C} size="sm" onClick={handleShiftForward}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {!isCurrentPeriod && mode !== 'custom' && (
        <Button variant="light" color={C} size="compact-xs" onClick={handleToday}>Today</Button>
      )}

      {mode === 'month' && startParam !== endParam && (
        <Group gap={2} wrap="nowrap">
          <Tooltip label="Add month to start">
            <Button size="compact-xs" variant="subtle" color="gray" onClick={expandBack}>← +mo</Button>
          </Tooltip>
          <Tooltip label="Add month to end">
            <Button size="compact-xs" variant="subtle" color="gray" onClick={expandForward}>+mo →</Button>
          </Tooltip>
        </Group>
      )}

    </Group>
  );
};
