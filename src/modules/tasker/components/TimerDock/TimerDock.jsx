import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Group, Popover, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useActiveTimer, useStopTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import { formatDuration } from '../../utils/taskerUtils';

export const TimerDock = ({ blockingOverlayOpen = false }) => {
  const { data: activeTimer } = useActiveTimer();
  const stopTimer = useStopTimer();
  const { timerPanelOpen, setTimerPanelOpen } = useTaskerStore();
  const [content, setContent] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeTimer) setContent('');
  }, [activeTimer]);

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

  return (
    <Popover opened={timerPanelOpen} onChange={setTimerPanelOpen} position="top-end" width={330} shadow="md" withArrow>
      <Popover.Target>
        <Tooltip label="Active timer" withArrow>
          <button type="button" className="timer-dock-button" onClick={() => setTimerPanelOpen(!timerPanelOpen)}>
            <IconPlayerPlayFilled size={18} />
            <span>{formatDuration(elapsedSeconds)}</span>
          </button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">{activeTimer.source_module}</Text>
            <Text size="sm" fw={650}>{activeTimer.source?.title || 'Active timer'}</Text>
            <Text size="xs" c="dimmed">{formatDuration(elapsedSeconds)}</Text>
          </Stack>
          <Textarea
            label="Session report"
            placeholder="What was done in this session"
            value={content}
            onChange={(event) => setContent(event.currentTarget.value)}
            minRows={4}
          />
          <Group justify="space-between">
            <ActionIcon variant="light" color="red" size="lg" onClick={handleStop} loading={stopTimer.isPending}>
              <IconPlayerStopFilled size={17} />
            </ActionIcon>
            <Button color="red" variant="light" size="xs" onClick={handleStop} loading={stopTimer.isPending}>
              Stop
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
