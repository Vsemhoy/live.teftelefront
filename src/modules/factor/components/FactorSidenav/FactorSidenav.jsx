import { ActionIcon, Divider, NavLink, Stack, Text, Tooltip, Group } from '@mantine/core';
import { IconDatabase, IconPin, IconX } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePinnedFacts } from '../../api/factorApi';

const NAV = [
  { path: '/factor', icon: IconDatabase, label: 'Facts', exact: true },
  { path: '/factor/pinned', icon: IconPin, label: 'Pinned' },
];

export const FactorSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: pinned = [] } = usePinnedFacts();

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const isActive = (item) => (
    item.exact
      ? location.pathname === '/factor' || location.pathname === '/factor/'
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
          {pinned.slice(0, 8).map((fact) => (
            <Tooltip key={fact.id} label={fact.label} position="right" disabled={!collapsed}>
              <NavLink
                component="button"
                label={!collapsed && (
                  <Stack gap={0}>
                    <Text size="xs" truncate lh={1.3}>{fact.label}</Text>
                    <Text size="xs" c="dimmed" truncate lh={1.2} style={{ fontSize: 11 }}>{fact.value}</Text>
                  </Stack>
                )}
                leftSection={<IconDatabase size={15} />}
                onClick={() => navigate(`/factor?q=${encodeURIComponent(fact.label)}`)}
                styles={{ root: { borderRadius: 6, paddingTop: 5, paddingBottom: 5 } }}
              />
            </Tooltip>
          ))}
        </Stack>
      )}
    </div>
  );
};
