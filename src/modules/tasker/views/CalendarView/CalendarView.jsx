import { useMemo, useRef, useState } from 'react';
import { ActionIcon, Badge, Box, Button, Group, Loader, Select, Text, Tooltip } from '@mantine/core';
import { IconClock, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDeleteTaskSpan, useSaveTaskSpan, useTaskSpans, useTasks } from '../../api/taskerApi';
import { useActiveTimer, useStartTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import {
  buildHourLabels, calcSpanSeconds, dateOffsetStr, formatDate, formatDayLabel,
  formatDuration, formatTime, getPriorityColors, isPast, isToday, timeToFraction,
} from '../../utils/taskerUtils';

const HOUR_OPTIONS = [
  { value: '0-23', label: '00:00-23:59 (full day)' },
  { value: '7-20', label: '07:00-20:00' },
  { value: '8-20', label: '08:00-20:00' },
  { value: '9-20', label: '09:00-20:00 (workday)' },
  { value: '9-18', label: '09:00-18:00' },
];

const DAYS_BACK = 7;
const DAYS_FORWARD = 14;

export const CalendarView = () => {
  const [hourRange, setHourRange] = useState('9-20');
  const [showFuture, setShowFuture] = useState(false);
  const [activeSpanId, setActiveSpanId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const { openReadModal, openTaskEditor } = useTaskerStore();
  const openSpanEditor = useTaskerStore((s) => s.openTimeEditor);

  const [startHour, endHour] = hourRange.split('-').map(Number);
  const hourLabels = buildHourLabels(startHour, endHour);

  const today = new Date().toISOString().slice(0, 10);
  const fromDate = dateOffsetStr(-DAYS_BACK);
  const toDate = showFuture ? dateOffsetStr(DAYS_FORWARD) : today;

  const { data: allSpans = [], isLoading: spansLoading } = useTaskSpans({
    from_date: fromDate,
    to_date: toDate,
    limit: 500,
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({
    filter: 'all',
    include_hidden: false,
    limit: 500,
  });

  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const saveSpan = useSaveTaskSpan();
  const deleteSpan = useDeleteTaskSpan();

  const isLoading = spansLoading || tasksLoading;

  // Build all dates in the current range.
  const dates = useMemo(() => {
    const result = [];
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toISOString().slice(0, 10));
    }
    return showFuture ? result : [...result].reverse();
  }, [fromDate, toDate, showFuture]);

  const taskMap = useMemo(() => {
    const m = {};
    allTasks.forEach((t) => { m[t.id] = t; });
    return m;
  }, [allTasks]);

  // Group only spans whose parent task is visible in the current task query.
  const spansByDateAndTask = useMemo(() => {
    const map = {};
    allSpans.forEach((span) => {
      const tid = span.task_id;
      if (!tid || !taskMap[tid]) return;
      const date = (span.started_at || span.planned_start_at || '').slice(0, 10);
      if (!date) return;
      if (!map[date]) map[date] = {};
      if (!map[date][tid]) map[date][tid] = [];
      map[date][tid].push(span);
    });
    return map;
  }, [allSpans, taskMap]);

  const handleStartTimer = (taskId) => {
    startTimer.mutate({ source_module: 'tasker', source_id: taskId, time_type: 'self' }, {
      onSuccess: () => notifications.show({ message: 'Timer started', color: 'teal' }),
      onError: () => notifications.show({ message: 'Could not start timer', color: 'red' }),
    });
  };

  // Click a day header to create a plan span for the selected task.
  const handleDayHeaderClick = (date) => {
    if (!detailTaskId) return;
    const task = taskMap[detailTaskId];
    if (!task) return;
    const start = `${date}T${String(startHour).padStart(2, '0')}:00:00`;
    const end = `${date}T${String(endHour).padStart(2, '0')}:00:00`;
    saveSpan.mutate({
      task_id: detailTaskId,
      kind: 'plan',
      planned_start_at: start,
      planned_end_at: end,
      title: null,
    }, {
      onSuccess: () => notifications.show({ message: `Plan slot added for ${formatDate(date)}`, color: 'blue' }),
    });
  };

  const handleSpanDblClick = (span) => {
    openSpanEditor({ ...span, task_id: span.task_id });
  };

  const handleSpanDelete = (span) => {
    if (!window.confirm('Delete this span?')) return;
    deleteSpan.mutate(span, {
      onSuccess: () => notifications.show({ message: 'Span deleted', color: 'red' }),
    });
  };

  const chartRef = useRef(null);

  return (
    <div className="tasker-shell tasker-calendar">
      <Group gap={8} mb={10} wrap="wrap">
        <Select
          size="xs"
          value={hourRange}
          onChange={(v) => setHourRange(v || '9-20')}
          data={HOUR_OPTIONS}
          style={{ width: 190 }}
        />
        <Button
          size="xs"
          variant={showFuture ? 'filled' : 'light'}
          onClick={() => setShowFuture((v) => !v)}
        >
          {showFuture ? 'Hide future' : 'Show future'}
        </Button>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={12} />}
          onClick={() => openTaskEditor()}
        >
          Task
        </Button>
        {detailTaskId && (
          <Text size="xs" c="dimmed">
            Click a day header to add a plan slot for the selected task
          </Text>
        )}
      </Group>

      <div className="tvc-wrap">
        <div className="tvc-layout">
          <div className="tvc-left">
            <div className="tvc-left-head">
              <Text size="10" fw={600} c="dimmed" tt="uppercase">Task</Text>
            </div>

            {isLoading ? (
              <Group justify="center" p="md"><Loader size="sm" /></Group>
            ) : dates.map((date) => {
              const tasksOnDay = spansByDateAndTask[date] ? Object.keys(spansByDateAndTask[date]) : [];
              const factSeconds = allSpans
                .filter((s) => s.kind === 'fact' && (s.started_at || '').slice(0, 10) === date)
                .reduce((acc, s) => acc + calcSpanSeconds(s), 0);

              return (
                <div key={date} className={`tvc-day-group ${isToday(date) ? 'is-today' : isPast(date) ? 'is-past' : 'is-future'}`}>
                  <div
                    className="tvc-day-header-left"
                    onClick={() => handleDayHeaderClick(date)}
                    title={detailTaskId ? 'Add a plan slot for the selected task' : 'Select a task to add a slot'}
                  >
                    <Text size="xs" fw={700}>{formatDayLabel(date)}</Text>
                    {factSeconds > 0 && (
                      <Text size="10" c="dimmed">{formatDuration(factSeconds)}</Text>
                    )}
                    {isToday(date) && <Badge size="xs" color="blue" variant="dot">today</Badge>}
                  </div>

                  {tasksOnDay.map((taskId) => {
                    const task = taskMap[taskId];
                    const spans = spansByDateAndTask[date][taskId] || [];
                    const factSecs = spans.filter((s) => s.kind === 'fact').reduce((a, s) => a + calcSpanSeconds(s), 0);
                    const planSpans = spans.filter((s) => s.kind === 'plan');
                    const isActive = activeTimer?.source_module === 'tasker' && activeTimer?.source_id === taskId;
                    const isSelected = detailTaskId === taskId;
                    const colors = getPriorityColors(task?.priority_id);

                    return (
                      <div
                        key={taskId}
                        className={`tvc-row-label ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setDetailTaskId(isSelected ? null : taskId)}
                        onDoubleClick={() => task && openReadModal(task)}
                        title="Click to select, double-click to open task"
                      >
                        <Group gap={5} wrap="nowrap">
                          <span className="tvc-task-dot" style={{ background: colors.border }} />
                          <Text size="12" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {task?.title || taskId.slice(0, 8)}
                          </Text>
                          {isActive && <span className="tvc-live-dot" title="Timer running" />}
                        </Group>
                        <Text size="10" c="dimmed" style={{ paddingLeft: 12 }}>
                          {factSecs > 0 ? `${formatDuration(factSecs)} fact` : ''}
                          {planSpans.length > 0 ? ` | ${planSpans.length} plan` : ''}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="tvc-right" ref={chartRef}>
            <div className="tvc-chart-inner">
              <div className="tvc-hours-row">
                {hourLabels.map((h) => (
                  <div key={h} className="tvc-hour-cell">
                    <Text size="10" c="dimmed">{String(h).padStart(2, '0')}:00</Text>
                  </div>
                ))}
              </div>

              {isLoading ? null : dates.map((date) => {
                const tasksOnDay = spansByDateAndTask[date] ? Object.keys(spansByDateAndTask[date]) : [];
                const isFuture = !isPast(date) && !isToday(date);

                return (
                  <div key={date} className={`tvc-day-group-right ${isToday(date) ? 'is-today' : isFuture ? 'is-future' : 'is-past'}`}>
                    <div className="tvc-day-header-right">
                      <HourGrid hourLabels={hourLabels} />
                    </div>

                    {tasksOnDay.map((taskId) => {
                      const task = taskMap[taskId];
                      const spans = spansByDateAndTask[date][taskId] || [];
                      const planSpans = spans.filter((s) => s.kind === 'plan');
                      const factSpans = spans.filter((s) => s.kind === 'fact');
                      const colors = getPriorityColors(task?.priority_id);
                      const isActive = activeTimer?.source_module === 'tasker' && activeTimer?.source_id === taskId;

                      return (
                        <div key={taskId} className="tvc-task-row-right">
                          <HourGrid hourLabels={hourLabels} />

                          {planSpans.map((span) => {
                            const left = timeToFraction(span.planned_start_at, startHour, endHour);
                            const right = timeToFraction(span.planned_end_at, startHour, endHour);
                            if (left === null || right === null) return null;
                            return (
                              <div
                                key={span.id}
                                className="tvc-span tvc-span-plan"
                                style={{
                                  left: `${left * 100}%`,
                                  width: `${(right - left) * 100}%`,
                                  borderColor: colors.planBorder,
                                  background: colors.plan,
                                }}
                                onDoubleClick={() => handleSpanDblClick(span)}
                                title={`Plan: ${formatTime(span.planned_start_at)}-${formatTime(span.planned_end_at)} | double-click to edit`}
                              />
                            );
                          })}

                          {factSpans.map((span) => {
                            const isLive = !span.ended_at && span.started_at;
                            const left = timeToFraction(span.started_at, startHour, endHour);
                            const right = isLive ? 1 : timeToFraction(span.ended_at, startHour, endHour);
                            if (left === null) return null;
                            const secs = calcSpanSeconds(span);

                            return (
                              <div
                                key={span.id}
                                className={`tvc-span tvc-span-fact ${isLive ? 'tvc-span-live' : ''} ${activeSpanId === span.id ? 'is-active' : ''}`}
                                style={{
                                  left: `${left * 100}%`,
                                  width: `${Math.max((right - left) * 100, 0.5)}%`,
                                  background: isLive
                                    ? `repeating-linear-gradient(90deg, ${colors.bg} 0, ${colors.bg} 7px, ${colors.border}44 7px, ${colors.border}44 14px)`
                                    : colors.bg,
                                  borderLeft: `2px solid ${colors.border}`,
                                }}
                                onClick={() => setActiveSpanId(activeSpanId === span.id ? null : span.id)}
                                onDoubleClick={() => handleSpanDblClick(span)}
                                title={`${formatTime(span.started_at)}-${isLive ? '...' : formatTime(span.ended_at)} | ${span.title || ''} | ${formatDuration(secs)}`}
                              >
                                <span className="tvc-span-label" style={{ color: colors.text }}>
                                  {formatTime(span.started_at)}{span.title ? ` ${span.title}` : ''}
                                </span>
                              </div>
                            );
                          })}

                          {detailTaskId === taskId && (
                            <div className="tvc-row-actions">
                              <Tooltip label="Start timer" withArrow>
                                <ActionIcon
                                  size="xs"
                                  variant={isActive ? 'filled' : 'light'}
                                  color="teal"
                                  onClick={() => handleStartTimer(taskId)}
                                >
                                  <IconClock size={11} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Add span" withArrow>
                                <ActionIcon
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  onClick={() => openSpanEditor({ task_id: taskId })}
                                >
                                  <IconPlus size={11} />
                                </ActionIcon>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {detailTaskId && <DetailPanel taskId={detailTaskId} allSpans={allSpans} taskMap={taskMap} onClose={() => setDetailTaskId(null)} />}
      </div>
    </div>
  );
};

const HourGrid = ({ hourLabels }) => (
  <div className="tvc-hour-grid" aria-hidden="true">
    {hourLabels.map((h) => <div key={h} className="tvc-hour-line" />)}
  </div>
);

const DetailPanel = ({ taskId, allSpans, taskMap, onClose }) => {
  const task = taskMap[taskId];
  const spans = allSpans.filter((s) => s.task_id === taskId && s.kind === 'fact' && s.started_at);
  const totalFact = spans.reduce((a, s) => a + calcSpanSeconds(s), 0);
  const planSpans = allSpans.filter((s) => s.task_id === taskId && s.kind === 'plan');
  const totalPlan = planSpans.reduce((a, s) => {
    if (!s.planned_start_at || !s.planned_end_at) return a;
    return a + Math.max(0, (new Date(s.planned_end_at) - new Date(s.planned_start_at)) / 1000);
  }, 0);

  const colors = getPriorityColors(task?.priority_id);

  return (
    <div className="tvc-detail-panel">
      <Group justify="space-between" mb={8}>
        <Group gap={6}>
          <span className="tvc-task-dot" style={{ background: colors.border, width: 10, height: 10 }} />
          <Text size="sm" fw={700}>{task?.title}</Text>
        </Group>
        <ActionIcon size="sm" variant="subtle" color="gray" onClick={onClose}>X</ActionIcon>
      </Group>

      <Group gap={20} mb={10}>
        <Box>
          <Text size="10" c="dimmed" tt="uppercase" fw={600}>Plan</Text>
          <Text size="lg" fw={800}>{totalPlan > 0 ? formatDuration(totalPlan) : '-'}</Text>
        </Box>
        <Box>
          <Text size="10" c="dimmed" tt="uppercase" fw={600}>Fact</Text>
          <Text size="lg" fw={800} c={totalFact > totalPlan && totalPlan > 0 ? 'red' : 'teal'}>
            {totalFact > 0 ? formatDuration(totalFact) : '-'}
          </Text>
        </Box>
        {totalPlan > 0 && totalFact > 0 && (
          <Box>
            <Text size="10" c="dimmed" tt="uppercase" fw={600}>Delta</Text>
            <Text size="lg" fw={800} c={totalFact > totalPlan ? 'red' : 'green'}>
              {totalFact > totalPlan ? '+' : '-'}{formatDuration(Math.abs(totalFact - totalPlan))}
            </Text>
          </Box>
        )}
      </Group>

      <div className="tvc-detail-chunks">
        {spans.length === 0 && <Text size="xs" c="dimmed">No fact spans</Text>}
        {spans.map((span) => (
          <div key={span.id} className="tvc-detail-chunk">
            <span className="tvc-task-dot" style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, marginTop: 3, flexShrink: 0 }} />
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="11" fw={600} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatTime(span.started_at)}-{span.ended_at ? formatTime(span.ended_at) : '...'}
                </Text>
                <Text size="10" c="dimmed">{formatDuration(calcSpanSeconds(span))}</Text>
                <Text size="12" fw={500}>{span.title || ''}</Text>
              </Group>
              {span.content && <Text size="11" c="dimmed" lineClamp={2}>{span.content}</Text>}
            </Box>
          </div>
        ))}
      </div>
    </div>
  );
};
