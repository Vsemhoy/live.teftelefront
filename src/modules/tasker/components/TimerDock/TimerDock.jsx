import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Box, Button, Group, Popover, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { IconClockPlay, IconPlayerStopFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useActiveTimer, useStopTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { formatDuration } from '../../utils/taskerUtils';

// Keep the report draft alive across component remounts.
const reportDraftRef = { value: '' };

export const TimerDock = ({ blockingOverlayOpen = false }) => {
  const { data: activeTimer } = useActiveTimer();
  const stopTimer = useStopTimer();
  const { timerPanelOpen, setTimerPanelOpen } = useTaskerStore();
  const [content, setContent] = useState(reportDraftRef.value);
  const [now, setNow] = useState(Date.now());
  const prevTimerIdRef = useRef(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeTimer) {
      reportDraftRef.value = '';
      setContent('');
      prevTimerIdRef.current = null;
      return;
    }
    if (activeTimer.id !== prevTimerIdRef.current) {
      reportDraftRef.value = '';
      setContent('');
      prevTimerIdRef.current = activeTimer.id;
    }
  }, [activeTimer?.id]);

  const handleContentChange = (val) => {
    reportDraftRef.value = val;
    setContent(val);
  };

  const elapsedSeconds = useMemo(() => {
    if (!activeTimer?.started_at) return 0;
    if (activeTimer.ended_at) return activeTimer.elapsed_seconds || 0;
    return Math.max(0, Math.floor((now - new Date(activeTimer.started_at).getTime()) / 1000));
  }, [activeTimer, now]);

  if (!activeTimer || activeTimer.source_module !== 'tasker' || blockingOverlayOpen) return null;

  const handleStop = () => {
    stopTimer.mutate({
      timer_entry_id: activeTimer.id,
      content: content.trim() || null,
    }, {
      onSuccess: () => {
        notifications.show({ message: 'Timer stopped', color: 'blue' });
        setTimerPanelOpen(false);
      },
      onError: () => notifications.show({ message: 'Could not stop timer', color: 'red' }),
    });
  };

  const taskTitle = activeTimer.source?.title || 'Active timer';

  return (
    <Popover opened={timerPanelOpen} onChange={setTimerPanelOpen} position="top-end" width={360} shadow="md" withArrow>
      <Popover.Target>
        <Tooltip label={taskTitle} withArrow position="top-end" disabled={timerPanelOpen}>
          <button type="button" className="timer-dock-button" onClick={() => setTimerPanelOpen(!timerPanelOpen)}>
            <IconClockPlay size={18} />
            <Box className="timer-dock-info">
              <span className="timer-dock-task">{taskTitle}</span>
              <span className="timer-dock-time">{formatDuration(elapsedSeconds)}</span>
            </Box>
          </button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Active session</Text>
            <Text size="sm" fw={650}>{taskTitle}</Text>
            <Text size="xs" c="teal.6" fw={600}>{formatDuration(elapsedSeconds)}</Text>
          </Stack>
          <Textarea
            label="What are you doing right now?"
            description="Saved as session report when you stop"
            placeholder="Fixing the legacy migration script..."
            value={content}
            onChange={(event) => handleContentChange(event.currentTarget.value)}
            minRows={4}
            autosize
          />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Text is preserved while timer runs</Text>
            <Group gap={8}>
              <ActionIcon variant="light" color="red" size="lg" onClick={handleStop} loading={stopTimer.isPending}>
                <IconPlayerStopFilled size={17} />
              </ActionIcon>
              <Button color="red" variant="light" size="xs" onClick={handleStop} loading={stopTimer.isPending}>
                Stop & save
              </Button>
            </Group>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
