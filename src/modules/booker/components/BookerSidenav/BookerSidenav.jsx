import { Box, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconBooks, IconBookmark, IconTag, IconHash,
} from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { MOCK_THEMES } from '@/modules/booker/api/bookerMocks';

const POPULAR_TAGS = ['react', 'ux', 'design', 'finance', 'laravel', 'physics', 'games'];

export const BookerSidenav = ({ collapsed, mobileOpen, onMobileClose }) => {
  const { filterTab, filterTheme, filterTag, setFilterTab, setFilterTheme, setFilterTag } =
    useBookerStore();

  const isCollapsed = collapsed && !mobileOpen;

  return (
    <Box
      className={`sections-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
    >
      <Stack gap={0} pt={8}>
        {/* Основные вкладки */}
        <NavLink
          label={!isCollapsed && 'All books'}
          leftSection={<IconBooks size={16} />}
          active={filterTab === 'all'}
          onClick={() => { setFilterTab('all'); onMobileClose?.(); }}
        />
        <NavLink
          label={!isCollapsed && 'My books'}
          leftSection={<IconBookmark size={16} />}
          active={filterTab === 'my'}
          onClick={() => { setFilterTab('my'); onMobileClose?.(); }}
        />
        <NavLink
          label={!isCollapsed && 'Subscriptions'}
          leftSection={<IconBookmark size={16} />}
          active={filterTab === 'subscriptions'}
          onClick={() => { setFilterTab('subscriptions'); onMobileClose?.(); }}
        />

        {!isCollapsed && (
          <>
            {/* Темы */}
            <Text size="xs" c="dimmed" px={12} pt={16} pb={4} tt="uppercase" fw={500}>
              Themes
            </Text>
            {MOCK_THEMES.map((theme) => (
              <NavLink
                key={theme.id}
                label={theme.name}
                leftSection={<IconTag size={14} />}
                active={filterTheme === theme.id}
                onClick={() => setFilterTheme(filterTheme === theme.id ? null : theme.id)}
              />
            ))}

            {/* Теги */}
            <Text size="xs" c="dimmed" px={12} pt={16} pb={4} tt="uppercase" fw={500}>
              Tags
            </Text>
            {POPULAR_TAGS.map((tag) => (
              <NavLink
                key={tag}
                label={`#${tag}`}
                leftSection={<IconHash size={14} />}
                active={filterTag === tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              />
            ))}
          </>
        )}
      </Stack>
    </Box>
  );
};
