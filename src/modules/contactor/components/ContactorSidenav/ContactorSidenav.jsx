import { ActionIcon, Avatar, Divider, Group, NavLink, Stack, Text, Tooltip } from '@mantine/core';
import {
  IconAddressBook, IconNetwork, IconPin, IconTimeline, IconX,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePinnedContacts } from '../../api/contactorApi';
import { getInitials } from '../../utils/contactorUtils';

const NAV = [
  { path: '/contactor', icon: IconAddressBook, label: 'People', exact: true },
  { path: '/contactor/feed', icon: IconTimeline, label: 'Feed' },
  { path: '/contactor/graph', icon: IconNetwork, label: 'Graph' },
];

export const ContactorSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pinned = usePinnedContacts();

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const isActive = (item) => (
    item.exact
      ? location.pathname === '/contactor' || location.pathname === '/contactor/'
      : location.pathname.startsWith(item.path)
  );

  const isContactActive = (id) => location.pathname === `/contactor/${id}`;

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
        {NAV.map((item) => {
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
                styles={{
                  root: { borderRadius: 6, paddingTop: 6, paddingBottom: 6, fontWeight: active ? 600 : 400 },
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>

      <Divider style={{ flexShrink: 0 }} />

      {pinned.length > 0 && (
        <Stack gap={0} px={collapsed ? 4 : 8} pt={8} pb={4} style={{ flexShrink: 0 }}>
          {!collapsed && (
            <Group gap={4} px={2} mb={4}>
              <IconPin size={11} color="var(--mantine-color-gray-5)" />
              <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
                Pinned
              </Text>
            </Group>
          )}
          {pinned.map((contact) => {
            const active = isContactActive(contact.id);
            return (
              <Tooltip key={contact.id} label={contact.name} position="right" disabled={!collapsed}>
                <NavLink
                  component="button"
                  label={!collapsed && (
                    <Stack gap={0}>
                      <Text size="xs" fw={active ? 600 : 400} truncate lh={1.3}>
                        {contact.name}
                      </Text>
                      {contact.role && (
                        <Text size="xs" c="dimmed" truncate lh={1.2} style={{ fontSize: 11 }}>
                          {contact.role}
                        </Text>
                      )}
                    </Stack>
                  )}
                  leftSection={
                    <Avatar size={22} radius="xl" color="indigo" src={contact.avatar || null}>
                      {getInitials(contact.name)}
                    </Avatar>
                  }
                  active={active}
                  onClick={() => navigate(`/contactor/${contact.id}`)}
                  styles={{
                    root: {
                      borderRadius: 6,
                      paddingTop: 5,
                      paddingBottom: 5,
                      alignItems: 'center',
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>
      )}
    </div>
  );
};
