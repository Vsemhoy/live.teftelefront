import { useState } from 'react';
import {
  Stack, NavLink, Text, Group, ActionIcon, Divider,
  Skeleton, Badge, Tooltip, Button,
} from '@mantine/core';
import {
  IconCalendar, IconSearch, IconLayoutList,
  IconPlus, IconFolder, IconFolderOpen,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEventorStore } from '../../store/eventorStore';
import { useSections } from '../../api/eventorApi';
import db from '@/shared/utils/db';

const VIEW_ITEMS = [
  { id: 'flow',     label: 'Flow',     icon: IconLayoutList },
  { id: 'calendar', label: 'Calendar', icon: IconCalendar },
  { id: 'search',   label: 'Search',   icon: IconSearch },
];

export const SectionsSidenav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: sections, isLoading } = useSections();

  const draftsCount = useLiveQuery(
    () => db.drafts.where('syncStatus').anyOf(['pending', 'error']).count(),
    []
  ) ?? 0;

  // Текущий вид — последний сегмент пути (/eventor/flow → 'flow')
  const currentView = location.pathname.split('/').filter(Boolean).pop();

  // Активная секция из URL
  const activeSection = searchParams.get('section') || 'ALL';

  const handleViewClick = (viewId) => {
    // Переходим на вид, сохраняя секцию в параметрах
    const section = searchParams.get('section') || 'ALL';
    const params = section !== 'ALL' ? `?section=${section}` : '';
    navigate(`/eventor/${viewId}${params}`);
  };

  const handleSectionClick = (sectionId) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('section', sectionId);
        return p;
      },
      { replace: true }
    );
  };

  return (
    <div className="sections-sidebar">
      {/* Заголовок */}
      <Group px={12} py={10} justify="space-between">
        <Text size="sm" fw={600} c="blue.7">Eventor</Text>
        <Tooltip label="New event" position="right">
          <ActionIcon
            variant="light"
            color="blue"
            size="sm"
            onClick={() => useEventorStore.getState().openEditor({ id: null })}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Переключатели вида */}
      <Stack gap={2} px={8} pb={8}>
        {VIEW_ITEMS.map(({ id, label, icon: Icon }) => (
          <NavLink
            key={id}
            label={label}
            leftSection={<Icon size={16} />}
            active={currentView === id}
            onClick={() => handleViewClick(id)}
            styles={{ root: { borderRadius: 4, fontSize: 13 } }}
          />
        ))}

        {/* Черновики */}
        <NavLink
          label={
            <Group justify="space-between">
              <span>Drafts</span>
              {draftsCount > 0 && (
                <Badge size="xs" color="orange" variant="filled">
                  {draftsCount}
                </Badge>
              )}
            </Group>
          }
          leftSection={<IconAlertCircle size={16} />}
          active={currentView === 'drafts'}
          onClick={() => navigate('/eventor/drafts')}
          color={draftsCount > 0 ? 'orange' : 'gray'}
          styles={{ root: { borderRadius: 4, fontSize: 13 } }}
        />
      </Stack>

      <Divider />

      {/* Секции */}
      <Text size="xs" c="dimmed" px={12} pt={10} pb={4} tt="uppercase" fw={600} style={{ letterSpacing: '0.06em' }}>
        Sections
      </Text>

      <Stack gap={2} px={8} pb={8} style={{ flex: 1, overflowY: 'auto' }}>
        <NavLink
          label="All sections"
          active={activeSection === 'ALL'}
          onClick={() => handleSectionClick('ALL')}
          styles={{ root: { borderRadius: 4, fontSize: 13 } }}
        />
        <NavLink
          label="No section"
          active={activeSection === 'NULL'}
          onClick={() => handleSectionClick('NULL')}
          styles={{ root: { borderRadius: 4, fontSize: 13 } }}
        />

        {isLoading
          ? [1, 2, 3].map((i) => <Skeleton key={i} height={28} radius="sm" />)
          : sections?.map((section) => (
              <NavLink
                key={section.id}
                label={section.name}
                leftSection={
                  activeSection === section.id
                    ? <IconFolderOpen size={15} />
                    : <IconFolder size={15} />
                }
                active={activeSection === section.id}
                onClick={() => handleSectionClick(section.id)}
                styles={{
                  root: {
                    borderRadius: 4,
                    fontSize: 13,
                    ...(section.color && {
                      borderLeft: `3px solid ${section.color}`,
                      paddingLeft: 9,
                    }),
                  },
                }}
              />
            ))}
      </Stack>

      <Divider />
      <Group px={12} py={8}>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconPlus size={13} />}
          color="gray"
          fullWidth
          justify="start"
        >
          New section
        </Button>
      </Group>
    </div>
  );
};
