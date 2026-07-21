import { ActionIcon, Avatar, Divider, Group, NavLink, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle, IconBriefcase, IconCalendar, IconClockHour4,
  IconFileText, IconList, IconX,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '@/modules/projector/api/projectorApi';
import { useTaskerStore } from '../../store/taskerStore';

const NAV = [
  { path: '/tasker', icon: IconList, label: 'List', exact: true },
  { path: '/tasker/calendar', icon: IconCalendar, label: 'Calendar' },
  { path: '/tasker/log', icon: IconFileText, label: 'Log' },
  { path: '/tasker/time', icon: IconClockHour4, label: 'Time' },
  { path: '/tasker/blockers', icon: IconAlertTriangle, label: 'Blockers' },
];

export const TaskerSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectFilter = useTaskerStore((state) => state.projectFilter);
  const setProjectFilter = useTaskerStore((state) => state.setProjectFilter);
  const { data: projects = [] } = useProjects({
    filter: 'all',
    include_hidden: true,
    tasker_visible: true,
    limit: 500,
  });

  const sidebarClass = ['sections-sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '']
    .filter(Boolean).join(' ');

  const isActive = (item) => item.exact
    ? location.pathname === '/tasker' || location.pathname === '/tasker/'
    : location.pathname.startsWith(item.path);

  const handleProjectSelect = (projectId) => {
    setProjectFilter(projectId);
    if (!location.pathname.startsWith('/tasker')) {
      navigate('/tasker');
    }
  };

  return (
    <div className={sidebarClass}>
      {mobileOpen && !collapsed && (
        <Group px={8} py={6} justify="flex-end" style={{ flexShrink: 0 }}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onMobileClose}>
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}

      <Stack gap={2} px={collapsed ? 4 : 8} pt={collapsed ? 8 : 4} pb={4}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Tooltip key={item.path} label={item.label} position="right" disabled={!collapsed}>
              <NavLink
                component="button"
                label={!collapsed && <span className="sidebar-label">{item.label}</span>}
                leftSection={<Icon size={15} />}
                active={active}
                onClick={() => navigate(item.path)}
                styles={{ root: { borderRadius: 6, paddingTop: 6, paddingBottom: 6, fontWeight: active ? 600 : 400 } }}
              />
            </Tooltip>
          );
        })}
      </Stack>

      <Divider />

      <Stack gap={2} px={collapsed ? 4 : 8} pt={8} pb={4} style={{ minHeight: 0, overflow: 'auto' }}>
        {!collapsed && (
          <Group gap={4} px={2} mb={4}>
            <IconBriefcase size={11} color="var(--mantine-color-gray-5)" />
            <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
              Projects
            </Text>
          </Group>
        )}
        <Tooltip label="All projects" position="right" disabled={!collapsed}>
          <NavLink
            component="button"
            label={!collapsed && <span className="sidebar-label">All projects</span>}
            leftSection={<ProjectMark code="ALL" color="#64748b" />}
            active={projectFilter === 'all'}
            onClick={() => handleProjectSelect('all')}
            styles={{ root: { borderRadius: 6, paddingTop: 5, paddingBottom: 5 } }}
          />
        </Tooltip>
        {projects.map((project) => {
          const active = projectFilter === project.id;
          const label = project.code || project.title?.slice(0, 3) || 'PRJ';
          return (
            <Tooltip key={project.id} label={project.title} position="right" disabled={!collapsed}>
              <NavLink
                component="button"
                label={!collapsed && (
                  <Stack gap={0}>
                    <Text size="xs" fw={active ? 600 : 400} truncate lh={1.3}>{project.title}</Text>
                    <Text size="xs" c="dimmed" truncate lh={1.2} style={{ fontSize: 11 }}>{label.toUpperCase()}</Text>
                  </Stack>
                )}
                leftSection={<ProjectMark code={label} color={project.color || '#1d4ed8'} />}
                active={active}
                onClick={() => handleProjectSelect(project.id)}
                styles={{ root: { borderRadius: 6, paddingTop: 5, paddingBottom: 5, alignItems: 'center' } }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </div>
  );
};

const ProjectMark = ({ code, color }) => (
  <Avatar
    className="tasker-project-mark"
    size={24}
    radius={6}
    style={{ background: color, color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: 0 }}
  >
    {String(code || 'PRJ').slice(0, 3).toUpperCase()}
  </Avatar>
);
