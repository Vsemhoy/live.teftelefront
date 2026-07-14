import { useState } from 'react';
import {
  Modal, TextInput, PasswordInput, Button, Stack,
  Text, Anchor, Alert, Group, Divider,
  Paper, Title,
} from '@mantine/core';
import { IconAlertCircle, IconBrandWindows, IconEye } from '@tabler/icons-react';
import { useAuthStore } from './authStore';
import { notifications } from '@mantine/notifications';

function LoginForm({ onSuccess }) {
  const login = useAuthStore((s) => s.login);
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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

  const handleDemo = async () => {
    setDemoLoading(true);
    setError(null);

    try {
      await demoLogin();
      notifications.show({
        title: 'Demo sandbox',
        message: 'You can explore and create data. Demo changes expire automatically.',
        color: 'orange',
      });
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Demo is unavailable';
      setError(msg);
    } finally {
      setDemoLoading(false);
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
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <Button type="submit" fullWidth loading={loading} mt={4}>
          Sign in
        </Button>

        <Divider label="or" labelPosition="center" />

        <Button
          fullWidth
          variant="light"
          color="orange"
          leftSection={<IconEye size={16} />}
          loading={demoLoading}
          onClick={handleDemo}
        >
          Try demo
        </Button>

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

export const DemoBanner = () => {
  const user = useAuthStore((s) => s.user);
  if (!user?.is_demo) return null;

  return (
    <div style={{
      background: 'var(--mantine-color-orange-1)',
      borderBottom: '1px solid var(--mantine-color-orange-3)',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: 'var(--mantine-color-orange-9)',
    }}>
      <IconEye size={15} />
      <span>Demo sandbox. Changes are temporary and may be cleaned up automatically.</span>
    </div>
  );
};

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
