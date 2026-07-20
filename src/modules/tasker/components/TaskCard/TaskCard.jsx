import { ActionIcon, Badge, Group, Menu, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconClockPlay, IconDotsVertical, IconEdit, IconEyeOff, IconFilePlus, IconFlag, IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDeleteTask } from '../../api/taskerApi';
import { useStartTimer } from '../../api/timerApi';
import { useTaskerStore } from '../../store/taskerStore';
import {
  formatDate, formatDuration, priorityColor, priorityLabel, statusColor, statusLabel,
} from '../../utils/taskerUtils';

export const TaskCard = ({ task }) => {
  const openTaskEditor = useTaskerStore((state) => state.openTaskEditor);
  const openLogEditor = useTaskerStore((state) => state.openLogEditor);
  const deleteTask = useDeleteTask();
  const startTimer = useStartTimer();

  const handleDelete = () => {
    if (!window.confirm('Delete this task?')) return;
    deleteTask.mutate(task, {
      onSuccess: () => notifications.show({ message: 'Task deleted', color: 'red' }),
    });
  };

  const handleStart = () => {
    startTimer.mutate({
      source_module: 'tasker',
      source_id: task.id,
      time_type: 'self',
    }, {
      onSuccess: () => notifications.show({ message: 'Timer started', color: 'blue' }),
      onError: () => notifications.show({ message: 'Could not start timer', color: 'red' }),
    });
  };

  return (
    <article
      className={`task-card ${task.is_hidden ? 'is-hidden' : ''} ${task.is_expert ? 'is-expert' : ''}`}
      onDoubleClick={() => openTaskEditor(task)}
    >
      <div className="task-card-main">
        <Group gap={6} wrap="wrap">
          <Badge size="xs" color={statusColor(task.status_id)} variant="light">{statusLabel(task.status_id)}</Badge>
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
          {task.is_expert && <Badge size="xs" color="indigo" variant="light">expert</Badge>}
          {task.is_hidden && <Badge size="xs" color="gray" variant="light" leftSection={<IconEyeOff size={10} />}>hidden</Badge>}
        </Group>

        <Stack gap={3}>
          <Text size="sm" fw={650} lh={1.25}>{task.title}</Text>
          {task.description && <Text size="xs" c="dimmed" lineClamp={2}>{task.description}</Text>}
        </Stack>

        <Group gap={12} wrap="wrap">
          {task.due_at && <Text size="xs" c="dimmed">Due {formatDate(task.due_at)}</Text>}
          {task.assignee?.name && <Text size="xs" c="dimmed">Assignee {task.assignee.name}</Text>}
          <Text size="xs" c="dimmed">Time {formatDuration(task.tracked_seconds)}</Text>
        </Group>
      </div>

      <Group gap={4} wrap="nowrap" className="task-card-actions" onDoubleClick={(event) => event.stopPropagation()}>
        <Tooltip label="Start timer" withArrow>
          <ActionIcon size="sm" variant="subtle" color="blue" onClick={handleStart} loading={startTimer.isPending}>
            <IconClockPlay size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Add log" withArrow>
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openLogEditor({ task_id: task.id })}>
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
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openTaskEditor(task)}>Edit</Menu.Item>
            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={handleDelete}>Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </article>
  );
};
