import { useMemo, useRef, useState } from 'react';
import { ActionIcon, Badge, Box, Group, Loader, Text, Tooltip } from '@mantine/core';
import { IconClock, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useSaveTaskSpan, useTaskSpans, useTasks } from '../../api/taskerApi';
import { useActiveTimer, useStartTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import {
  buildHourLabels, calcSpanSeconds, formatDate, formatDayLabel,
  formatDuration, formatTime, getPriorityColors, isPast, isToday, localDateKey, timeToFraction,
} from '../../utils/taskerUtils';

const RESIZE_STEP_MINUTES = 5;
const MIN_SPAN_MINUTES = 15;
const DEFAULT_CELL_SPAN_MINUTES = 120;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const snapToStep = (minutes) => Math.round(minutes / RESIZE_STEP_MINUTES) * RESIZE_STEP_MINUTES;
const minutesOfDay = (value) => {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};
const dateWithMinutes = (base, minutes) => {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};
const formatLocalDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};
const secondsBetween = (start, end) => Math.max(0, Math.floor((new Date(end) - new Date(start)) / 1000));
const currentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const monthBounds = (monthKey) => {
  const [year, month] = String(monthKey || currentMonthKey()).split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { fromDate: localDateKey(first), toDate: localDateKey(last) };
};
const getResizeFields = (span) => {
  if (span.kind === 'plan') {
    return {
      startField: 'planned_start_at',
      endField: 'planned_end_at',
      startValue: span.planned_start_at,
      endValue: span.planned_end_at,
    };
  }

  return {
    startField: 'started_at',
    endField: 'ended_at',
    startValue: span.started_at,
    endValue: span.ended_at,
  };
};

const spanRangeMinutes = (span) => {
  const fields = getResizeFields(span);
  if (!fields.startValue || !fields.endValue) return null;
  return {
    start: minutesOfDay(fields.startValue),
    end: minutesOfDay(fields.endValue),
  };
};

export const CalendarView = () => {
  const [activeSpanId, setActiveSpanId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const {
    calendarHourRange: hourRange,
    calendarShowFuture,
    calendarMonth,
    calendarMarkupMode,
    calendarMarkupTaskIds,
    openReadModal,
  } = useTaskerStore();
  const openSpanEditor = useTaskerStore((s) => s.openTimeEditor);

  const [startHour, endHour] = hourRange.split('-').map(Number);
  const hourLabels = buildHourLabels(startHour, endHour);

  const selectedMonth = calendarMonth || currentMonthKey();
  const { fromDate, toDate } = monthBounds(selectedMonth);

  const [selectedSpanId, setSelectedSpanId] = useState(null); 
  const [resizeDraft, setResizeDraft] = useState(null);
  const resizeDraftRef = useRef(null);

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

  const isLoading = spansLoading || tasksLoading;

  // Build visible dates in the selected month, newest first.
  const dates = useMemo(() => {
    const result = [];
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T00:00:00');
    const todayKey = localDateKey(new Date());
    const allowFuture = calendarShowFuture || selectedMonth > currentMonthKey();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = localDateKey(d);
      if (!allowFuture && dateKey > todayKey) continue;
      result.push(dateKey);
    }
    return result.reverse();
  }, [calendarShowFuture, fromDate, selectedMonth, toDate]);

  const taskMap = useMemo(() => {
    const m = {};
    allTasks.forEach((t) => { m[t.id] = t; });
    return m;
  }, [allTasks]);

  const visibleMarkupTaskIds = useMemo(
    () => calendarMarkupTaskIds.filter((taskId) => taskMap[taskId]),
    [calendarMarkupTaskIds, taskMap],
  );

  // Group only spans whose parent task is visible in the current task query.
  const spansByDateAndTask = useMemo(() => {
    const map = {};
    allSpans.forEach((span) => {
      const tid = span.task_id;
      if (!tid || !taskMap[tid]) return;
      const spanDate = span.started_at || span.planned_start_at;
      const date = spanDate ? localDateKey(spanDate) : '';
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

  const handleCalendarCellDblClick = (event, date, taskId) => {
    if (event.target.closest('.tvc-span, .tvc-row-actions')) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const rowStartMinutes = startHour * 60;
    const rowEndMinutes = endHour * 60;
    const fraction = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pointerMinutes = snapToStep(rowStartMinutes + fraction * (rowEndMinutes - rowStartMinutes));
    const maxStartMinutes = Math.max(rowStartMinutes, rowEndMinutes - MIN_SPAN_MINUTES);
    const startMinutes = clamp(pointerMinutes, rowStartMinutes, maxStartMinutes);
    const endMinutes = Math.min(rowEndMinutes, startMinutes + DEFAULT_CELL_SPAN_MINUTES);
    const finalStartMinutes = Math.min(startMinutes, endMinutes - MIN_SPAN_MINUTES);
    const start = dateWithMinutes(`${date}T00:00:00`, finalStartMinutes);
    const end = dateWithMinutes(`${date}T00:00:00`, endMinutes);

    if (calendarMarkupMode || event.ctrlKey) {
      openSpanEditor({
        task_id: taskId,
        kind: 'plan',
        planned_start_at: start.toISOString(),
        planned_end_at: end.toISOString(),
      });
      return;
    }

    openSpanEditor({
      task_id: taskId,
      kind: 'fact',
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    });
  };

  const handleResizeStart = (event, span, edge, rowSpans = []) => {
    const fields = getResizeFields(span);
    if (!fields.startValue || !fields.endValue || saveSpan.isPending) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedSpanId(span.id);

    const row = event.currentTarget.closest('.tvc-right--task');
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const originalStart = new Date(fields.startValue);
    const originalEnd = new Date(fields.endValue);
    const originalStartMinutes = minutesOfDay(originalStart);
    const originalEndMinutes = minutesOfDay(originalEnd);
    const neighborRanges = rowSpans
      .filter((item) => item.id !== span.id)
      .map(spanRangeMinutes)
      .filter(Boolean)
      .filter((range) => range.end > range.start);
    const previousEndMinutes = neighborRanges
      .filter((range) => range.end <= originalStartMinutes)
      .reduce((max, range) => Math.max(max, range.end), startHour * 60);
    const nextStartMinutes = neighborRanges
      .filter((range) => range.start >= originalEndMinutes)
      .reduce((min, range) => Math.min(min, range.start), endHour * 60);

    const initialDraft = {
      spanId: span.id,
      span,
      edge,
      startField: fields.startField,
      endField: fields.endField,
      rowLeft: rect.left,
      rowWidth: rect.width,
      originalStart,
      originalEnd,
      previousEndMinutes,
      nextStartMinutes,
      nextStart: originalStart,
      nextEnd: originalEnd,
    };
    resizeDraftRef.current = initialDraft;
    setResizeDraft(initialDraft);
    document.body.classList.add('tvc-resize-active');

    const getNextDraft = (draft, clientX) => {
      const rowStartMinutes = startHour * 60;
      const rowEndMinutes = endHour * 60;
      const originalStartMinutes = minutesOfDay(draft.originalStart);
      const originalEndMinutes = minutesOfDay(draft.originalEnd);
      const fraction = clamp((clientX - draft.rowLeft) / draft.rowWidth, 0, 1);
      const pointerMinutes = snapToStep(rowStartMinutes + fraction * (rowEndMinutes - rowStartMinutes));

      if (draft.edge === 'start') {
        const maxStartMinutes = Math.max(
          draft.previousEndMinutes,
          Math.min(rowEndMinutes - MIN_SPAN_MINUTES, originalEndMinutes - MIN_SPAN_MINUTES),
        );
        const nextStartMinutes = clamp(
          pointerMinutes,
          draft.previousEndMinutes,
          maxStartMinutes,
        );

        return {
          ...draft,
          nextStart: dateWithMinutes(draft.originalStart, nextStartMinutes),
          nextEnd: draft.originalEnd,
        };
      }

      const minEndMinutes = Math.min(
        draft.nextStartMinutes,
        Math.max(rowStartMinutes + MIN_SPAN_MINUTES, originalStartMinutes + MIN_SPAN_MINUTES),
      );
      const nextEndMinutes = clamp(
        pointerMinutes,
        minEndMinutes,
        draft.nextStartMinutes,
      );

      return {
        ...draft,
        nextStart: draft.originalStart,
        nextEnd: dateWithMinutes(draft.originalEnd, nextEndMinutes),
      };
    };

    const handlePointerMove = (event) => {
      if (!resizeDraftRef.current) return;
      const nextDraft = getNextDraft(resizeDraftRef.current, event.clientX);
      resizeDraftRef.current = nextDraft;
      setResizeDraft(nextDraft);
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('tvc-resize-active');
    };

    const cancelResize = () => {
      resizeDraftRef.current = null;
      setResizeDraft(null);
      cleanup();
    };

    const handlePointerUp = (pointerEvent) => {
      if (!resizeDraftRef.current) return;
      const finalDraft = getNextDraft(resizeDraftRef.current, pointerEvent.clientX);
      resizeDraftRef.current = null;
      setResizeDraft(null);
      cleanup();

      const nextStartedAt = finalDraft.nextStart.toISOString();
      const nextEndedAt = finalDraft.nextEnd.toISOString();
      const oldStartedAt = finalDraft.originalStart.toISOString();
      const oldEndedAt = finalDraft.originalEnd.toISOString();

      if (nextStartedAt === oldStartedAt && nextEndedAt === oldEndedAt) return;

      saveSpan.mutate({
        ...finalDraft.span,
        [finalDraft.startField]: nextStartedAt,
        [finalDraft.endField]: nextEndedAt,
      }, {
        onSuccess: () => notifications.show({
          message: `Span updated: ${formatTime(nextStartedAt)}-${formatTime(nextEndedAt)}`,
          color: 'blue',
        }),
        onError: () => notifications.show({ message: 'Could not update span time', color: 'red' }),
      });
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      cancelResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
  };

  const stateClass = (date) =>
    isToday(date) ? 'is-today' : isPast(date) ? 'is-past' : 'is-future';

  return (
    <div className="tasker-shell tasker-calendar">
      {detailTaskId && (
        <Text size="xs" c="dimmed" mb={10}>
          Click a day header to add a plan slot for the selected task
        </Text>
      )}

      <div className="tvc-wrap">
        {/* One horizontal scroll owner. Every row is [sticky left | chart], so the
            two columns can never drift out of vertical alignment. */}
        <div className="tvc-scroll">
          <div className="tvc-grid">
            {/* Header row. */}
            <div className="tvc-row tvc-row--head">
              <div className="tvc-left tvc-left--head">
                <Text size="10" fw={600} c="dimmed" tt="uppercase">Task</Text>
              </div>
              <div className="tvc-right tvc-right--head">
                {hourLabels.map((h) => (
                  <div key={h} className="tvc-hour-cell">
                    <Text size="10" c="dimmed">{String(h).padStart(2, '0')}:00</Text>
                  </div>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="tvc-loading"><Loader size="sm" /></div>
            ) : dates.map((date) => {
              const tasksOnDay = Array.from(new Set([
                ...(spansByDateAndTask[date] ? Object.keys(spansByDateAndTask[date]) : []),
                ...visibleMarkupTaskIds,
              ]));
              const factSeconds = allSpans
                .filter((s) => s.kind === 'fact' && s.started_at && localDateKey(s.started_at) === date)
                .reduce((acc, s) => acc + calcSpanSeconds(s), 0);
              const cls = stateClass(date);

              return (
                <div key={date} className={`tvc-daygroup ${cls}`}>
                  {/* Day header row. */}
                  <div className="tvc-row tvc-row--day">
                    <div
                      className="tvc-left tvc-left--day"
                      onClick={() => handleDayHeaderClick(date)}
                      title={detailTaskId ? 'Add a plan slot for the selected task' : 'Select a task to add a slot'}
                    >
                      <div className="tvc-day-title">
                        <Text size="xs" fw={700} className="tvc-day-name">{formatDayLabel(date)}</Text>
                        {isToday(date) && <Badge size="xs" color="blue" variant="dot">today</Badge>}
                      </div>
                      {factSeconds > 0 && (
                        <Text className="tvc-day-title-time" size="10" c="dimmed">{formatDuration(factSeconds)}</Text>
                      )}
                    </div>
                    <div className="tvc-right tvc-right--day">
                      <HourGrid hourLabels={hourLabels} />
                    </div>
                  </div>

                  {/* Task rows. */}
                  {tasksOnDay.map((taskId) => {
                    const task = taskMap[taskId];
                    const spans = spansByDateAndTask[date]?.[taskId] || [];
                    const isMarkupRow = visibleMarkupTaskIds.includes(taskId) && spans.length === 0;
                    const factSecs = spans.filter((s) => s.kind === 'fact').reduce((a, s) => a + calcSpanSeconds(s), 0);
                    const planSpans = spans.filter((s) => s.kind === 'plan');
                    const factSpans = spans.filter((s) => s.kind === 'fact');
                    const isActive = activeTimer?.source_module === 'tasker' && activeTimer?.source_id === taskId;
                    const isSelected = detailTaskId === taskId;
                    const colors = getPriorityColors(task?.priority_id);

                    return (
                      <div key={taskId} className={`tvc-row tvc-row--task ${isSelected ? 'is-selected' : ''} ${isMarkupRow ? 'is-markup-row' : ''}`}>
                        <div
                          className="tvc-left tvc-left--task"
                          onClick={() => task && openReadModal(task)}
                          onDoubleClick={() => task && openReadModal(task)}
                          title="Open task"
                        >
                          <div className="tvc-task-title">
                            <span className="tvc-task-dot" style={{ background: colors.border }} />
                            <Text size="12" fw={500} className="tvc-task-name">
                              {task?.title || taskId.slice(0, 8)}
                            </Text>
                            {isActive && <span className="tvc-live-dot" title="Timer running" />}
                          </div>
                          {(factSecs > 0 || planSpans.length > 0) && (
                            <Text size="10" c="dimmed" className="tvc-task-meta">
                              {factSecs > 0 ? `${formatDuration(factSecs)} fact` : ''}
                              {planSpans.length > 0 ? `${factSecs > 0 ? ' | ' : ''}${planSpans.length} plan` : ''}
                            </Text>
                          )}
                          {isMarkupRow && (
                            <Text size="10" c="dimmed" className="tvc-task-meta">
                              Layout row
                            </Text>
                          )}
                        </div>

                        <div
                          className="tvc-right tvc-right--task"
                          onDoubleClick={(event) => handleCalendarCellDblClick(event, date, taskId)}
                        >
                          <HourGrid hourLabels={hourLabels} />

                          {planSpans.map((span) => {
                            const draft = resizeDraft?.spanId === span.id ? resizeDraft : null;
                            const plannedStartAt = draft ? formatLocalDateTime(draft.nextStart) : span.planned_start_at;
                            const plannedEndAt = draft ? formatLocalDateTime(draft.nextEnd) : span.planned_end_at;
                            const left = timeToFraction(plannedStartAt, startHour, endHour);
                            const right = timeToFraction(plannedEndAt, startHour, endHour);
                            if (left === null || right === null) return null;
                            const isResizable = selectedSpanId === span.id;
                            return (
                              <div
                                key={span.id}
                                className={`tvc-span tvc-span-plan ${isResizable ? 'span-selected' : ''} ${draft ? 'is-resizing' : ''}`}
                                style={{
                                  left: `${left * 100}%`,
                                  width: `${Math.max((right - left) * 100, 0.5)}%`,
                                  borderColor: colors.planBorder,
                                  background: colors.plan,
                                }}
                                onClick={(event)=> {
                                  event.stopPropagation();
                                  setSelectedSpanId(span.id);
                                }}
                                onDoubleClick={(event) => {
                                  event.stopPropagation();
                                  handleSpanDblClick(span);
                                }}
                                title={`Plan: ${formatTime(plannedStartAt)}-${formatTime(plannedEndAt)} | double-click to edit`}
                              >
                                {isResizable && (
                                  <Tooltip
                                    label={formatTime(plannedStartAt)}
                                    opened={draft?.edge === 'start' || undefined}
                                    withArrow
                                  >
                                    <div
                                      className='tvc-span-handle-left'
                                      onPointerDown={(event) => handleResizeStart(event, span, 'start', spans)}
                                    ><span style={{opacity: 0.4}}>|</span>|<span style={{opacity: 0.4}}>|</span></div>
                                  </Tooltip>
                                )}
                                {isResizable && (
                                  <Tooltip
                                    label={formatTime(plannedEndAt)}
                                    opened={draft?.edge === 'end' || undefined}
                                    withArrow
                                  >
                                    <div
                                      className='tvc-span-handle-right'
                                      onPointerDown={(event) => handleResizeStart(event, span, 'end', spans)}
                                    ><span style={{opacity: 0.4}}>|</span>|<span style={{opacity: 0.4}}>|</span></div>
                                  </Tooltip>
                                )}
                              </div>
                            );
                          })}

                          {factSpans.map((span) => {
                            const isLive = !span.ended_at && span.started_at;
                            const draft = resizeDraft?.spanId === span.id ? resizeDraft : null;
                            const startedAt = draft ? formatLocalDateTime(draft.nextStart) : span.started_at;
                            const endedAt = draft ? formatLocalDateTime(draft.nextEnd) : span.ended_at;
                            const left = timeToFraction(startedAt, startHour, endHour);
                            const right = isLive ? 1 : timeToFraction(endedAt, startHour, endHour);
                            if (left === null) return null;
                            const secs = draft ? secondsBetween(startedAt, endedAt) : calcSpanSeconds(span);
                            const isResizable = selectedSpanId === span.id && !isLive;

                            return (
                              <div
                                key={span.id}
                                className={`tvc-span tvc-span-fact ${isLive ? 'tvc-span-live' : ''} ${activeSpanId === span.id ? 'is-active' : ''} ${selectedSpanId === span.id ? 'span-selected' : ''} ${draft ? 'is-resizing' : ''}`}
                                style={{
                                  left: `${left * 100}%`,
                                  width: `${Math.max((right - left) * 100, 0.5)}%`,
                                  background: isLive
                                    ? `repeating-linear-gradient(90deg, ${colors.bg} 0, ${colors.bg} 7px, ${colors.border}44 7px, ${colors.border}44 14px)`
                                    : colors.bg,
                                  borderLeft: `2px solid ${colors.border}`,
                                }}
                                onClick={(event)=> {
                                  event.stopPropagation();
                                  setSelectedSpanId(span.id);
                                }}
                                // onClick={() => setActiveSpanId(activeSpanId === span.id ? null : span.id)}
                                onDoubleClick={(event) => {
                                  event.stopPropagation();
                                  handleSpanDblClick(span);
                                }}
                                title={`${formatTime(startedAt)}-${isLive ? '...' : formatTime(endedAt)} | ${span.title || ''} | ${formatDuration(secs)}`}
                              >
                                {isResizable && (
                                  <Tooltip
                                    label={formatTime(startedAt)}
                                    opened={draft?.edge === 'start' || undefined}
                                    withArrow
                                  >
                                    
                                  <div
                                    className='tvc-span-handle-left'
                                    onPointerDown={(event) => handleResizeStart(event, span, 'start', spans)}
                                  >
                                    <span style={{opacity: 0.4}}>|</span>|<span style={{opacity: 0.4}}>|</span></div>
                                  </Tooltip>
                                )}
                                {span.content ? (
                                <Tooltip label={span.content}>
                                  <span className="tvc-span-label" style={{ color: colors.text, width: '100%' }}>
                                    {formatTime(startedAt)}{span.title ? ` ${span.title}` : ''}
                                  </span>
                                </Tooltip>

                                ):(
                                  <span className="tvc-span-label" style={{ color: colors.text, width: '100%' }}>
                                    {formatTime(startedAt)}{span.title ? ` ${span.title}` : ''}
                                  </span>
                                )}
                                {isResizable && (
                                <Tooltip
                                    label={formatTime(endedAt)}
                                    opened={draft?.edge === 'end' || undefined}
                                    withArrow
                                  >
                                <div
                                    className='tvc-span-handle-right'
                                    onPointerDown={(event) => handleResizeStart(event, span, 'end', spans)}
                                  ><span style={{opacity: 0.4}}>|</span>|<span style={{opacity: 0.4}}>|</span></div></Tooltip>
                                )}
                              </div>
                            );
                          })}

                          {isSelected && (
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
                      </div>
                    );
                  })}
                </div>
              );
            })}
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
