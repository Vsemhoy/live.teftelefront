import { ActionIcon, Badge, Divider, Group, Menu, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconArrowRight, IconClockPlay, IconDotsVertical, IconEdit, IconEyeOff,
  IconFilePlus, IconFlag,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useSaveTask } from '../../api/taskerApi';
import { useActiveTimer, useStartTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import {
  TASK_STATUSES, formatDate, formatDuration, priorityColor, priorityLabel, statusColor, statusLabel,
} from '../../utils/taskerUtils';

const WORKFLOW_STATUSES = ['20', '21', '23'];
const DONE_STATUSES = ['22', '24'];

export const TaskCard = ({ task }) => {
  const openReadModal = useTaskerStore((state) => state.openReadModal);
  const openTaskEditor = useTaskerStore((state) => state.openTaskEditor);
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);
  const saveTask = useSaveTask();
  const startTimer = useStartTimer();
  const { data: activeTimer } = useActiveTimer();

  const isActiveTask = activeTimer?.source_module === 'tasker' && activeTimer?.source_id === task.id;

  const handleStart = () => {
    startTimer.mutate({ source_module: 'tasker', source_id: task.id, time_type: 'self' }, {
      onSuccess: () => notifications.show({ message: 'Timer started', color: 'blue' }),
      onError: () => notifications.show({ message: 'Could not start timer', color: 'red' }),
    });
  };

  const handleStatusChange = (statusId) => {
    if (Number(task.status_id) === Number(statusId)) return;
    saveTask.mutate({ ...task, status_id: Number(statusId) });
  };

  const workflowItems = TASK_STATUSES.filter((s) => WORKFLOW_STATUSES.includes(s.value) && s.value !== String(task.status_id));
  const doneItems = TASK_STATUSES.filter((s) => DONE_STATUSES.includes(s.value) && s.value !== String(task.status_id));

  return (
    <article
      className={[
        'task-card',
        task.is_hidden ? 'is-hidden' : '',
        task.is_expert ? 'is-expert' : '',
        isActiveTask ? 'is-active-timer' : '',
      ].filter(Boolean).join(' ')}
      onDoubleClick={() => openReadModal(task)}
    >
      <div className="task-card-main">
        <Group gap={6} wrap="wrap">
          <Menu position="bottom-start" withArrow>
            <Menu.Target>
              <Badge
                size="xs"
                color={statusColor(task.status_id)}
                variant="light"
                style={{ cursor: 'pointer' }}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
              >
                {statusLabel(task.status_id)}
              </Badge>
            </Menu.Target>
            <Menu.Dropdown
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            >
              {workflowItems.map((s) => (
                <Menu.Item key={s.value} onClick={() => handleStatusChange(s.value)}>
                  <Badge size="xs" color={statusColor(s.value)} variant="light">{s.label}</Badge>
                </Menu.Item>
              ))}
              {workflowItems.length > 0 && doneItems.length > 0 && <Divider />}
              {doneItems.map((s) => (
                <Menu.Item key={s.value} onClick={() => handleStatusChange(s.value)}>
                  <Badge size="xs" color={statusColor(s.value)} variant="light">{s.label}</Badge>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          <Badge size="xs" color={priorityColor(task.priority_id)} variant="light" leftSection={<IconFlag size={10} />}>
            {priorityLabel(task.priority_id)}
          </Badge>
          {task.project?.title && (
            <Badge
              size="xs"
              variant={task.project?.color ? 'filled' : 'outline'}
              color="pink"
              style={task.project?.color ? { background: task.project.color } : undefined}
            >
              {task.project.code || task.project.title}
            </Badge>
          )}
          {isActiveTask && <Badge size="xs" color="teal" variant="dot">timer running</Badge>}
          {task.is_expert && <Badge size="xs" color="indigo" variant="light">expert</Badge>}
          {task.is_hidden && <Badge size="xs" color="gray" variant="light" leftSection={<IconEyeOff size={10} />}>hidden</Badge>}
        </Group>

        <Stack gap={3}>
          <Text size="sm" fw={650} lh={1.25}>{task.title}</Text>
          {task.description && <Text size="xs" c="dimmed" lineClamp={2}>{task.description}</Text>}
        </Stack>

        <Group gap={12} wrap="wrap">
          {task.due_at && <Text size="xs" c="dimmed">Due {formatDate(task.due_at)}</Text>}
          {task.assignee?.name && <Text size="xs" c="dimmed">Assignee: {task.assignee.name}</Text>}
          {task.tracked_seconds > 0 && <Text size="xs" c="dimmed">Time {formatDuration(task.tracked_seconds)}</Text>}
          {task.logs_count > 0 && <Text size="xs" c="dimmed">log {task.logs_count}</Text>}
        </Group>
      </div>

      <Group
        gap={4}
        wrap="nowrap"
        className="task-card-actions"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Tooltip label={isActiveTask ? 'Timer running' : 'Start timer'} withArrow>
          <ActionIcon
            size="sm"
            variant={isActiveTask ? 'filled' : 'subtle'}
            color="teal"
            onClick={handleStart}
            loading={startTimer.isPending}
          >
            <IconClockPlay size={15} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Add note" withArrow>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openLogEditor({ task_id: task.id, kind: 'note', lockTask: true })}>
            <IconFilePlus size={15} />
          </ActionIcon>
        </Tooltip>

        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <ActionIcon size="sm" variant="subtle" color="gray">
              <IconDotsVertical size={15} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconArrowRight size={14} />} onClick={() => openReadModal(task)}>
              Open
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openTaskEditor(task)}>
              Edit
            </Menu.Item>
            <Divider />
            {workflowItems.map((s) => (
              <Menu.Item key={s.value} onClick={() => handleStatusChange(s.value)}>
                <Badge size="xs" color={statusColor(s.value)} variant="light">{s.label}</Badge>
              </Menu.Item>
            ))}
            {workflowItems.length > 0 && doneItems.length > 0 && <Divider />}
            {doneItems.map((s) => (
              <Menu.Item key={s.value} onClick={() => handleStatusChange(s.value)}>
                <Badge size="xs" color={statusColor(s.value)} variant="light">{s.label}</Badge>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </article>
  );
};
