import { ActionIcon, Divider, Group, NavLink, Stack, Text, Tooltip } from '@mantine/core';
import { IconBriefcase, IconChecklist, IconEyeOff, IconX } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { path: '/projector', icon: IconBriefcase, label: 'Projects', exact: true },
  { path: '/projector/tasks', icon: IconChecklist, label: 'Linked tasks' },
  { path: '/projector/hidden', icon: IconEyeOff, label: 'Hidden' },
];

export const ProjectorSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarClass = ['sections-sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '']
    .filter(Boolean)
    .join(' ');

  const isActive = (item) => item.exact
    ? location.pathname === '/projector' || location.pathname === '/projector/'
    : location.pathname.startsWith(item.path);

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
      {!collapsed && (
        <Stack gap={4} px={10} py={10}>
          <Text size="xs" c="dimmed" fw={600}>Scope</Text>
          <Text size="xs" c="dimmed" lh={1.4}>Projects collect tasks, time and future context.</Text>
        </Stack>
      )}
    </div>
  );
};
