Да, бро. Ниже даю **готовые файлы под замену**.
Логика будет такая:

* **первый визит с этого браузера** → показываем **full-screen login wall**
* **если когда-то уже логинился в этом браузере** → больше стену не видит
* **если сессия слетела сама** → просто обычный интерфейс + кнопка входа
* **если нажал logout** → удаляем метку “свой браузер”, и снова будет стена

---

# 1) Полностью замени `src/modules/auth/authStore.js`

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/shared/utils/api';

const KNOWN_BROWSER_KEY = 'teftele-known-browser';

const readKnownBrowser = () => {
  try {
    return localStorage.getItem(KNOWN_BROWSER_KEY) === '1';
  } catch {
    return false;
  }
};

const writeKnownBrowser = (value) => {
  try {
    if (value) {
      localStorage.setItem(KNOWN_BROWSER_KEY, '1');
    } else {
      localStorage.removeItem(KNOWN_BROWSER_KEY);
    }
  } catch {
    // ignore
  }
};

/**
 * Стор авторизации.
 * JWT живёт в httpOnly cookie на сервере — здесь храним только публичные данные юзера.
 * persist сохраняет профиль в localStorage — чтобы UI не мигал при перезагрузке.
 *
 * known browser:
 * - ставим после успешного логина
 * - НЕ удаляем, если сессия просто умерла сама
 * - удаляем только при явном logout
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isChecked: false,
      isKnownBrowser: readKnownBrowser(),

      setKnownBrowser: (value) => {
        writeKnownBrowser(value);
        set({ isKnownBrowser: value });
      },

      /**
       * Логин — сервер устанавливает httpOnly cookies (access + refresh)
       */
      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user } = res.data;

        get().setKnownBrowser(true);
        set({
          user,
          isChecked: true,
        });

        return user;
      },

      /**
       * Проверка сессии при старте приложения — тихая, без редиректов
       */
      checkAuth: async () => {
        try {
          const res = await api.post('/auth/me');
          set({
            user: res.data.user,
            isChecked: true,
          });
        } catch {
          // Сессии нет — это нормально
          // ВАЖНО: known browser тут НЕ трогаем
          set({
            user: null,
            isChecked: true,
          });
        }
      },

      /**
       * Серверный logout + сброс метки знакомого браузера
       */
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Даже если сервер не ответил — локально всё равно чистим
        }

        get().setKnownBrowser(false);
        set({
          user: null,
          isChecked: true,
        });
      },

      /**
       * Локальный forced logout (например, refresh умер)
       * ВАЖНО: known browser НЕ трогаем
       */
      forceLogout: () => {
        set({
          user: null,
          isChecked: true,
        });
      },
    }),
    {
      name: 'teftele-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

// Если refresh токена умер — просто снимаем user,
// но НЕ удаляем метку "знакомый браузер"
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().forceLogout();
});
```

---

# 2) Полностью замени `src/modules/auth/AuthModal.jsx`

```jsx
import { useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Alert,
  Group,
  Divider,
  Paper,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconBrandWindows } from '@tabler/icons-react';
import { useAuthStore } from './authStore';
import { notifications } from '@mantine/notifications';

function LoginForm({ onSuccess }) {
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      await login(email, password);

      notifications.show({
        title: 'Welcome back',
        message: 'Signed in successfully',
        color: 'green',
      });

      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="sm"
            py={8}
          >
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          autoFocus
          required
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" fullWidth loading={loading} mt={4}>
          Sign in
        </Button>

        <Divider />

        <Text size="xs" c="dimmed" ta="center">
          No account yet?{' '}
          <Anchor size="xs" href="mailto:admin@teftele.com">
            Contact admin
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}

/**
 * Обычная модалка для "знакомого браузера"
 */
export const AuthModal = ({ opened, onClose }) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconBrandWindows size={18} color="var(--mantine-color-blue-6)" />
          <Text fw={600} size="sm">Sign in to Teftele</Text>
        </Group>
      }
      size="sm"
      overlayProps={{ blur: 2 }}
      transitionProps={{ transition: 'fade', duration: 120 }}
    >
      <LoginForm onSuccess={onClose} />
    </Modal>
  );
};

/**
 * Жёсткая стена логина для совсем нового браузера
 */
export const AuthWall = () => {
  return (
    <div className="auth-wall">
      <div className="auth-wall__bg" />

      <Paper
        className="auth-wall__card"
        radius="lg"
        shadow="xl"
        p="xl"
        withBorder
      >
        <Stack gap="md">
          <Group gap={10}>
            <IconBrandWindows size={22} color="var(--mantine-color-blue-6)" />
            <Title order={3} fw={700}>
              Sign in to Teftele
            </Title>
          </Group>

          <Text size="sm" c="dimmed">
            This workspace is available only for authorized users.
          </Text>

          <LoginForm />
        </Stack>
      </Paper>
    </div>
  );
};
```

---

# 3) Полностью замени `src/app/App.jsx`

```jsx
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, ActionIcon, Text, Avatar, Menu, Box, Divider, Center, Loader } from '@mantine/core';
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

const ComingSoon = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Text c="dimmed" size="sm">{name} — coming soon</Text>
  </div>
);

const MODULES = [
  { id: 'eventor',   label: 'Eventor',   icon: IconCalendarEvent, path: '/eventor' },
  { id: 'exploiter', label: 'Exploiter', icon: IconPackage,        path: '/exploiter' },
  { id: 'badger',    label: 'Badger',    icon: IconCurrencyDollar, path: '/badger' },
  { id: 'tasker',    label: 'Tasker',    icon: IconChecklist,      path: '/tasker' },
  { id: 'pm',        label: 'PM',        icon: IconBriefcase,      path: '/pm' },
];

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

  const activeModule = MODULES.find((m) => location.pathname.startsWith(m.path))?.id || 'eventor';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/eventor', { replace: true });
    }
  }, [location.pathname, navigate]);

  const EventorContent = () => {
    switch (viewMode) {
      case 'flow':    return <FlowView />;
      case 'grid':    return <GridCalendar />;
      case 'search':  return <SearchPanel />;
      case 'drafts':  return <DraftsView />;
      default:        return <FlowView />;
    }
  };

  if (!isChecked) {
    return (
      <Center style={{ width: '100vw', height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Совсем новый браузер: никакого сайта, только стена логина
  if (!user && !isKnownBrowser) {
    return <AuthWall />;
  }

  return (
    <div className="app-shell">
      {/* === Левый рейл модулей (48px) === */}
      <div className="module-rail">
        <Box mb={8} mt={2}>
          <Text size="xs" fw={900} c="white" ta="center" style={{ lineHeight: 1, letterSpacing: '-0.03em' }}>
            TF
          </Text>
        </Box>

        <Divider color="rgba(255,255,255,0.15)" my={4} style={{ width: '100%' }} />

        {MODULES.map((mod) => (
          <ModuleIcon
            key={mod.id}
            module={mod}
            isActive={activeModule === mod.id}
            onClick={() => navigate(mod.path)}
          />
        ))}

        <div style={{ flex: 1 }} />

        <Divider color="rgba(255,255,255,0.15)" my={4} style={{ width: '100%' }} />

        <Tooltip label="Settings" position="right" withArrow>
          <ActionIcon variant="subtle" size={36} style={{ color: 'rgba(255,255,255,0.6)' }}>
            <IconSettings size={18} />
          </ActionIcon>
        </Tooltip>

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

      <Routes>
        <Route
          path="/eventor/*"
          element={
            <>
              <SectionsSidenav />
              <div className="main-content">
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

        <Route path="/exploiter/*" element={<div className="main-content"><ComingSoon name="Exploiter" /></div>} />
        <Route path="/badger/*"    element={<div className="main-content"><ComingSoon name="Badger" /></div>} />
        <Route path="/tasker/*"    element={<div className="main-content"><ComingSoon name="Tasker" /></div>} />
        <Route path="/pm/*"        element={<div className="main-content"><ComingSoon name="Project Manager" /></div>} />
      </Routes>

      <AuthModal opened={authOpened} onClose={closeAuth} />
      <EventEditor />
    </div>
  );
}
```

---

# 4) В `src/app/global.css` просто **добавь в конец файла** вот это

```css
/* === Hard auth wall for first-time browser === */

.auth-wall {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(37,99,235,0.14), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
}

.auth-wall__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.55;
  background-image:
    linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
}

.auth-wall__card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  margin: 24px;
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(6px);
}
```

---

## Что получится

Теперь поведение будет такое:

### 1. Новый браузер

Нет `teftele-known-browser` в localStorage, и нет сессии →
показывается только `AuthWall`.

### 2. Уже логинился раньше, но сессия умерла

`teftele-known-browser=1`, но `user=null` →
сайт открывается, можно нажать Sign in и войти через модалку.

### 3. Нажал Sign out

Уходит `/auth/logout`, потом:

* `user = null`
* `isKnownBrowser = false`
* localStorage метка удаляется

Следующий заход снова упрётся в стену.

---

## Важная ремарка

