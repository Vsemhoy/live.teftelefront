import { Center, Loader, Text } from '@mantine/core';
import { useTasks } from '../../api/taskerApi';
import { TaskCard } from '../../components/TaskCard/TaskCard';

export const TasksView = () => {
  const { data: tasks = [], isLoading } = useTasks();

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="tasker-shell">
      {tasks.length ? (
        <div className="task-list">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      ) : (
        <Center h={260}>
          <Text size="sm" c="dimmed">No tasks found</Text>
        </Center>
      )}
    </div>
  );
};
