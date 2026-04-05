import { useState } from 'react';
import {
  Modal, TextInput, PasswordInput, Button, Stack,
  Text, Anchor, Alert, Group, Divider,
} from '@mantine/core';
import { IconAlertCircle, IconBrandWindows } from '@tabler/icons-react';
import { useAuthStore } from './authStore';
import { notifications } from '@mantine/notifications';

export const AuthModal = ({ opened, onClose }) => {
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
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
    >
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
    </Modal>
  );
};
