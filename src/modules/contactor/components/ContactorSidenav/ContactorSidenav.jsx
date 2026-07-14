import { ActionIcon, Divider, Group, NavLink, Stack, Tooltip } from '@mantine/core';
import { IconAddressBook, IconNetwork, IconTimeline, IconX } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ContactorSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const nav = [
    { path: '/contactor', icon: IconAddressBook, label: 'People', exact: true },
    { path: '/contactor/feed', icon: IconTimeline, label: 'Feed' },
    { path: '/contactor/graph', icon: IconNetwork, label: 'Graph' },
  ];

  const isActive = (item) => (
    item.exact
      ? location.pathname === '/contactor' || location.pathname === '/contactor/'
      : location.pathname.startsWith(item.path)
  );

  return (
    <div className={sidebarClass}>
      {mobileOpen && !collapsed && (
        <Group px={8} py={6} justify="flex-end" style={{ flexShrink: 0 }}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onMobileClose}>
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}

      <Stack gap={2} px={collapsed ? 4 : 8} pt={collapsed ? 8 : 4} pb={4} style={{ flexShrink: 0 }}>
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

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

      <Divider style={{ flexShrink: 0 }} />
    </div>
  );
};
