import { ActionIcon, Badge, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { IconEdit, IconEyeOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../api/projectorApi';
import { useProjectorStore } from '../../store/projectorStore';
import {
  formatDate, formatDuration, priorityColor, priorityLabel, statusColor, statusLabel,
} from '@/modules/tasker/utils/taskerUtils';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const openProjectEditor = useProjectorStore((state) => state.openProjectEditor);
  const taskSeconds = (project.tasks || []).reduce((sum, task) => sum + Number(task.tracked_seconds || 0), 0);

  return (
    <article className={`project-card ${project.is_hidden ? 'is-hidden' : ''} ${project.is_expert ? 'is-expert' : ''}`} onDoubleClick={() => navigate(`/projector/${project.id}`)}>
      <Group justify="space-between" align="flex-start" gap={8}>
        <Stack gap={6} style={{ minWidth: 0 }}>
          <Group gap={6} wrap="wrap">
            {project.code && <Badge size="xs" variant="filled" style={{ background: project.color || undefined }}>{project.code}</Badge>}
            <Badge size="xs" color={statusColor(project.status_id)} variant="light">{statusLabel(project.status_id)}</Badge>
            <Badge size="xs" color={priorityColor(project.priority_id)} variant="light">{priorityLabel(project.priority_id)}</Badge>
            {project.is_expert && <Badge size="xs" color="indigo" variant="light">expert</Badge>}
            {project.is_hidden && <Badge size="xs" color="gray" variant="light" leftSection={<IconEyeOff size={10} />}>hidden</Badge>}
            {project.show_in_tasker === false && <Badge size="xs" color="gray" variant="outline">not in Tasker</Badge>}
          </Group>
          <Text size="sm" fw={700}>{project.title}</Text>
          {project.description && <Text size="xs" c="dimmed" lineClamp={2}>{project.description}</Text>}
          <Group gap={12}>
            {project.due_at && <Text size="xs" c="dimmed">Due {formatDate(project.due_at)}</Text>}
            <Text size="xs" c="dimmed">{project.tasks_count ?? 0} tasks</Text>
            {taskSeconds > 0 && <Text size="xs" c="dimmed">{formatDuration(taskSeconds)}</Text>}
          </Group>
        </Stack>
        <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openProjectEditor(project)}>
          <IconEdit size={15} />
        </ActionIcon>
      </Group>
    </article>
  );
};

export const ProjectsView = ({ hiddenOnly = false }) => {
  const { data: projects = [], isLoading } = useProjects({ include_hidden: hiddenOnly || undefined });
  const rows = hiddenOnly ? projects.filter((project) => project.is_hidden) : projects;

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <div className="projector-shell">
      {rows.length ? (
        <div className="project-list">
          {rows.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      ) : (
        <Center h={260}><Text size="sm" c="dimmed">No projects found</Text></Center>
      )}
    </div>
  );
};
