import { Badge, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useProject } from '../../api/projectorApi';
import { useTaskerStore } from '@/modules/tasker/store/taskerStore';
import { TaskCard } from '@/modules/tasker/components/TaskCard/TaskCard';
import { formatDate, statusColor, statusLabel } from '@/modules/tasker/utils/taskerUtils';

export const ProjectPage = () => {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id, { include_hidden: true });
  const openTaskEditor = useTaskerStore((state) => state.openTaskEditor);

  if (isLoading) return <Center h={300}><Loader /></Center>;
  if (!project) return <Center h={260}><Text size="sm" c="dimmed">Project not found</Text></Center>;

  return (
    <div className="projector-shell">
      <Stack gap={12}>
        <section className="project-page-head">
          <Group justify="space-between" align="flex-start">
            <Stack gap={6}>
              <Group gap={6}>
                {project.code && <Badge size="xs" variant="filled" style={{ background: project.color || undefined }}>{project.code}</Badge>}
                <Badge size="xs" color={statusColor(project.status_id)} variant="light">{statusLabel(project.status_id)}</Badge>
                {project.due_at && <Text size="xs" c="dimmed">Due {formatDate(project.due_at)}</Text>}
              </Group>
              <Text size="lg" fw={750}>{project.title}</Text>
              {project.description && <Text size="sm" c="dimmed">{project.description}</Text>}
            </Stack>
            <Button size="xs" color="blue" variant="light" leftSection={<IconPlus size={14} />} onClick={() => openTaskEditor({ project_id: project.id })}>
              Task
            </Button>
          </Group>
        </section>
        <div className="task-list">
          {(project.tasks || []).length ? project.tasks.map((task) => <TaskCard key={task.id} task={{ ...task, project }} />) : (
            <Center h={220}><Text size="sm" c="dimmed">No linked tasks</Text></Center>
          )}
        </div>
      </Stack>
    </div>
  );
};
