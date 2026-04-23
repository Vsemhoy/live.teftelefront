import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ActionIcon, Avatar, Drawer, Group, Menu, Stack,
  Text, TextInput, Tooltip, Divider, Box, UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconCalendarEvent, IconPackage, IconCurrencyDollar,
  IconChecklist, IconBriefcase, IconSettings,
  IconUser, IconLogout, IconLogin, IconSearch,
  IconLayoutSidebar, IconX, IconApps,
} from '@tabler/icons-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { getModuleTheme } from './moduleThemes';

const MODULES = [
  { id: 'eventor',   label: 'Eventor',   icon: IconCalendarEvent,  path: '/eventor/flow',   desc: 'Calendar & notes' },
  { id: 'stuffer',   label: 'Stuffer',   icon: IconPackage,        path: '/stuffer/things', desc: 'Stuff & locations' },
  { id: 'badger',    label: 'Badger',    icon: IconCurrencyDollar, path: '/badger',         desc: 'Budget & expenses' },
  { id: 'tasker',    label: 'Tasker',    icon: IconChecklist,      path: '/tasker',         desc: 'Tasks & kanban' },
  { id: 'pm',        label: 'PM',        icon: IconBriefcase,      path: '/pm',             desc: 'Project management' },
];

const ConnectDot = ({ isOnline }) => (
  <Tooltip label={isOnline ? 'Connected' : 'Offline'} withArrow>
    <Box style={{
      width: 10, height: 10, borderRadius: '50%',
      background: isOnline ? '#22c55e' : '#f97316',
      boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 0 0 3px rgba(249,115,22,0.2)',
      flexShrink: 0, transition: 'background 0.3s',
    }} />
  </Tooltip>
);

export const AppHeader = ({ onToggleSidebar, authModalOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useOnlineStatus();

  const [appsOpened, { open: openApps, close: closeApps }] = useDisclosure(false);
  // Локальное значение строки хедера — очищается после отправки
  const [headerSearch, setHeaderSearch] = useState('');
  const searchRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Активный модуль по URL
  const activeModuleId = MODULES.find((m) => location.pathname.startsWith('/' + m.id))?.id || 'eventor';
  const theme = getModuleTheme(activeModuleId);
  const activeModule = MODULES.find((m) => m.id === activeModuleId);

  // Поиск — только по Enter, после чего строка хедера очищается
  // Текст переезжает в SearchPanel через URL (?q=...)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (!q) return;

    if (location.pathname.startsWith('/eventor')) {
      navigate(`/eventor/search?q=${encodeURIComponent(q)}`);
    }
    setHeaderSearch(''); // очищаем хедер — текст уже в URL/SearchPanel
    searchRef.current?.blur();
  };

  return (
    <>
      <header className="app-header" style={{ background: theme.gradient }}>

        {/* ЛЕВЫЙ БЛОК */}
        <div className="header-left">
          <Tooltip label="Toggle sidebar" withArrow>
            <ActionIcon variant="subtle" size="md" onClick={onToggleSidebar}
              style={{ color: theme.textColor, opacity: 0.7 }}>
              <IconLayoutSidebar size={18} />
            </ActionIcon>
          </Tooltip>
          {!isMobile && activeModule && (
            <Group gap={6} style={{ cursor: 'default' }}>
              <activeModule.icon size={15} style={{ color: theme.textColor, opacity: 0.75 }} />
              <Text size="sm" fw={600} style={{ color: theme.textColor, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                {theme.label}
              </Text>
            </Group>
          )}
        </div>

        {/* ЦЕНТР — поиск растягивается */}
        <div className="header-center">
          <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
            <TextInput
              ref={searchRef}
              placeholder="Search… (Enter)"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              size="xs"
              radius="xl"
              leftSection={<IconSearch size={13} style={{ color: theme.textColor, opacity: 0.5 }} />}
              rightSection={
                headerSearch ? (
                  <ActionIcon size="xs" variant="subtle" onClick={() => setHeaderSearch('')}
                    style={{ color: theme.textColor, opacity: 0.5 }}>
                    <IconX size={11} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  color: theme.textColor,
                },
              }}
            />
          </form>
        </div>

        {/* ПРАВЫЙ БЛОК — прижат к краю */}
        <div className="header-right">
          <ConnectDot isOnline={isOnline} />

          {user ? (
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <Tooltip label={user.name || user.email} withArrow>
                  <Avatar size={26} radius="xl"
                    style={{ cursor: 'pointer', background: theme.accent, color: 'white', fontSize: 11, fontWeight: 600 }}>
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </Avatar>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.name || user.email}</Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={logout}>Sign out</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Tooltip label="Sign in" withArrow>
              <ActionIcon variant="subtle" size="sm" onClick={authModalOpen}
                style={{ color: theme.textColor, opacity: 0.8 }}>
                <IconLogin size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Apps" withArrow>
            <ActionIcon variant="subtle" size="md" onClick={openApps}
              style={{ color: theme.textColor, opacity: 0.7 }}>
              <IconApps size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
      </header>

      {/* Offcanvas — меню приложений */}
      <Drawer opened={appsOpened} onClose={closeApps} position="right"
        size={isMobile ? '85%' : 280} title={<Text fw={600} size="sm">Applications</Text>}
        styles={{ body: { display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', padding: '8px 0' } }}>
        <Stack gap={2} style={{ flex: 1 }} px={8}>
          {MODULES.map((mod) => {
            const mTheme = getModuleTheme(mod.id);
            const isActive = activeModuleId === mod.id;
            return (
              <UnstyledButton key={mod.id}
                onClick={() => { navigate(mod.path); closeApps(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: isActive ? mTheme.gradient : 'transparent',
                  border: isActive ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--mantine-color-gray-0)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                <Box style={{ width: 36, height: 36, borderRadius: 8, background: mTheme.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <mod.icon size={18} style={{ color: mTheme.textColor }} />
                </Box>
                <Stack gap={0}>
                  <Text size="sm" fw={isActive ? 600 : 400} style={{ color: isActive ? mTheme.textColor : undefined }}>{mod.label}</Text>
                  <Text size="xs" c="dimmed">{mod.desc}</Text>
                </Stack>
              </UnstyledButton>
            );
          })}
        </Stack>
        <Divider />
        <Box px={8} py={8}>
          <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, width: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--mantine-color-gray-0)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <IconSettings size={18} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed">Settings</Text>
          </UnstyledButton>
        </Box>
      </Drawer>
    </>
  );
};
