import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Tooltip, ActionIcon, Text, Avatar, Menu, Box, Divider,
  Center, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent, IconPackage, IconCurrencyDollar,
  IconChecklist, IconBriefcase, IconSettings,
  IconUser, IconLogout, IconLogin,
} from '@tabler/icons-react';

import { useAuthStore } from '@/modules/auth/authStore';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { AuthModal, AuthWall } from '@/modules/auth/AuthModal';

// Eventor
import { SectionsSidenav } from '@/modules/eventor/components/SectionsSidenav/SectionsSidenav';
import { EventorToolbar } from '@/modules/eventor/components/Toolbar/EventorToolbar';
import { EventEditor } from '@/modules/eventor/components/EventEditor/EventEditor';
import { FlowView } from '@/modules/eventor/views/FlowView/FlowView';
import { GridCalendar } from '@/modules/eventor/views/GridCalendar/GridCalendar';
import { SearchPanel } from '@/modules/eventor/views/SearchPanel/SearchPanel';
import { DraftsView } from '@/modules/eventor/views/DraftsView/DraftsView';
import { useEventorStore } from '@/modules/eventor/store/eventorStore';

// Заглушки будущих модулей
const ComingSoon = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Text c="dimmed" size="sm">{name} — coming soon</Text>
  </div>
);

// Модули в левом рейле
const MODULES = [
  { id: 'eventor',   label: 'Eventor',   icon: IconCalendarEvent, path: '/eventor' },
  { id: 'exploiter', label: 'Exploiter', icon: IconPackage,        path: '/exploiter' },
  { id: 'badger',    label: 'Badger',    icon: IconCurrencyDollar, path: '/badger' },
  { id: 'tasker',    label: 'Tasker',    icon: IconChecklist,      path: '/tasker' },
  { id: 'pm',        label: 'PM',        icon: IconBriefcase,      path: '/pm' },
];

// Иконка модуля в рейле
const ModuleIcon = ({ module, isActive, onClick }) => (
  <Tooltip label={module.label} position="right" withArrow>
    <ActionIcon
      variant={isActive ? 'filled' : 'subtle'}
      color="white"
      size={36}
      onClick={onClick}
      style={{
        color: isActive ? 'var(--mantine-color-blue-7)' : 'rgba(255,255,255,0.75)',
        background: isActive ? 'white' : 'transparent',
        borderRadius: 6,
        transition: 'all 0.15s',
      }}
    >
      <module.icon size={20} />
    </ActionIcon>
  </Tooltip>
);

export default function App() {
  const user = useAuthStore((s) => s.user);
  const isChecked = useAuthStore((s) => s.isChecked);
  const isKnownBrowser = useAuthStore((s) => s.isKnownBrowser);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const logout = useAuthStore((s) => s.logout);

  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpened, { open: openAuth, close: closeAuth }] = useDisclosure(false);
  const { viewMode } = useEventorStore();

  // Определяем активный модуль по пути
  const activeModule = MODULES.find((m) => location.pathname.startsWith(m.path))?.id || 'eventor';

  // Проверяем сессию при старте
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Редирект на eventor по умолчанию
  useEffect(() => {
    if (location.pathname === '/') navigate('/eventor', { replace: true });
  }, [location.pathname, navigate]);

  // Текущий вид Eventor'а
  const EventorContent = () => {
    switch (viewMode) {
      case 'flow':    return <FlowView />;
      case 'grid':    return <GridCalendar />;
      case 'search':  return <SearchPanel />;
      case 'drafts':  return <DraftsView />;
      default:        return <FlowView />;
    }
  };

  // Ждём результата checkAuth
  if (!isChecked) {
    return (
      <Center style={{ width: '100vw', height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Совсем новый браузер — жёсткая стена, никакого сайта сзади
  if (!user && !isKnownBrowser) {
    return <AuthWall />;
  }

  return (
    <div className="app-shell">

      {/* === Левый рейл модулей (48px) === */}
      <div className="module-rail">
        {/* Логотип */}
        <Box mb={8} mt={2}>
          <Text size="xs" fw={900} c="white" ta="center" style={{ lineHeight: 1, letterSpacing: '-0.03em' }}>
            TF
          </Text>
        </Box>

        <Divider color="rgba(255,255,255,0.15)" my={4} style={{ width: '100%' }} />

        {/* Иконки модулей */}
        {MODULES.map((mod) => (
          <ModuleIcon
            key={mod.id}
            module={mod}
            isActive={activeModule === mod.id}
            onClick={() => navigate(mod.path)}
          />
        ))}

        {/* Спейсер */}
        <div style={{ flex: 1 }} />

        <Divider color="rgba(255,255,255,0.15)" my={4} style={{ width: '100%' }} />

        {/* Настройки */}
        <Tooltip label="Settings" position="right" withArrow>
          <ActionIcon variant="subtle" size={36} style={{ color: 'rgba(255,255,255,0.6)' }}>
            <IconSettings size={18} />
          </ActionIcon>
        </Tooltip>

        {/* Аватар / вход */}
        {user ? (
          <Menu position="right-end" withArrow>
            <Menu.Target>
              <Tooltip label={user.name || user.email} position="right" withArrow>
                <Avatar
                  size={32}
                  radius="xl"
                  color="blue"
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                >
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </Avatar>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.name || user.email}</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                color="red"
                onClick={logout}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Tooltip label="Sign in" position="right" withArrow>
            <ActionIcon
              variant="subtle"
              size={36}
              style={{ color: 'rgba(255,255,255,0.75)' }}
              onClick={openAuth}
            >
              <IconLogin size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>

      {/* === Роутер === */}
      <Routes>
        {/* Eventor */}
        <Route
          path="/eventor/*"
          element={
            <>
              <SectionsSidenav />
              <div className="main-content">
                {/* Оффлайн-баннер */}
                {!isOnline && (
                  <div className="offline-banner">
                    <span>●</span>
                    No internet connection — events will be saved as local drafts
                  </div>
                )}
                <EventorToolbar />
                <EventorContent />
              </div>
            </>
          }
        />

        {/* Заглушки */}
        <Route path="/exploiter/*" element={<div className="main-content"><ComingSoon name="Exploiter" /></div>} />
        <Route path="/badger/*"    element={<div className="main-content"><ComingSoon name="Badger" /></div>} />
        <Route path="/tasker/*"    element={<div className="main-content"><ComingSoon name="Tasker" /></div>} />
        <Route path="/pm/*"        element={<div className="main-content"><ComingSoon name="Project Manager" /></div>} />
      </Routes>

      {/* === Глобальные оверлеи === */}
      <AuthModal opened={authOpened} onClose={closeAuth} />
      <EventEditor />
    </div>
  );
}
