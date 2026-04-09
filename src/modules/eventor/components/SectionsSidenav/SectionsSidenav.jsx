import {
  Stack, NavLink, Text, Group, ActionIcon, Divider,
  Skeleton, Badge, Tooltip, Button,
} from '@mantine/core';
import {
  IconCalendar, IconSearch, IconLayoutList,
  IconPlus, IconFolder, IconFolderOpen,
  IconAlertCircle, IconX, IconSettings,
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

export const SectionsSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { openSectionsManager } = useEventorStore();
  const { data: sections, isLoading } = useSections();

  const draftsCount = useLiveQuery(
    () => db.drafts.where('syncStatus').anyOf(['pending', 'error']).count(),
    []
  ) ?? 0;

  const currentView = location.pathname.split('/').filter(Boolean).pop();
  const activeSection = searchParams.get('section') || 'ALL';

  const handleViewClick = (viewId) => {
    const section = searchParams.get('section') || 'ALL';
    const params = section !== 'ALL' ? `?section=${section}` : '';
    navigate(`/eventor/${viewId}${params}`);
    onMobileClose?.();
  };

  const handleSectionClick = (sectionId) => {
    setSearchParams(
      (prev) => { const p = new URLSearchParams(prev); p.set('section', sectionId); return p; },
      { replace: true }
    );
  };

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={sidebarClass}>
      {/* Заголовок */}
      <Group px={collapsed ? 4 : 12} py={10} justify="space-between" style={{ flexShrink: 0 }}>
        {!collapsed && <Text size="sm" fw={600} c="blue.7" className="sidebar-label">Eventor</Text>}
        <Group gap={4} ml={collapsed ? 'auto' : undefined} mr={collapsed ? 'auto' : undefined}>
          <Tooltip label="New event" position="right">
            <ActionIcon variant="light" color="blue" size="sm"
              onClick={() => useEventorStore.getState().openEditor({ id: null })}>
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
          {mobileOpen && (
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={onMobileClose}>
              <IconX size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Переключатели вида */}
      <Stack gap={2} px={collapsed ? 4 : 8} pb={8} style={{ flexShrink: 0 }}>
        {VIEW_ITEMS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id} label={collapsed ? label : ''} position="right" disabled={!collapsed}>
            <NavLink
              label={collapsed ? '' : <span className="sidebar-label">{label}</span>}
              leftSection={<Icon size={16} />}
              active={currentView === id}
              onClick={() => handleViewClick(id)}
              styles={{ root: { borderRadius: 4, fontSize: 13, justifyContent: collapsed ? 'center' : undefined } }}
            />
          </Tooltip>
        ))}

        {/* Черновики */}
        <Tooltip label={collapsed ? 'Drafts' : ''} position="right" disabled={!collapsed}>
          <NavLink
            label={collapsed ? '' : (
              <Group justify="space-between">
                <span className="sidebar-label">Drafts</span>
                {draftsCount > 0 && <Badge size="xs" color="orange" variant="filled">{draftsCount}</Badge>}
              </Group>
            )}
            leftSection={
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <IconAlertCircle size={16} />
                {draftsCount > 0 && collapsed && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-orange-6)' }} />
                )}
              </span>
            }
            active={currentView === 'drafts'}
            onClick={() => { navigate('/eventor/drafts'); onMobileClose?.(); }}
            color={draftsCount > 0 ? 'orange' : 'gray'}
            styles={{ root: { borderRadius: 4, fontSize: 13, justifyContent: collapsed ? 'center' : undefined } }}
          />
        </Tooltip>
      </Stack>

      <Divider style={{ flexShrink: 0 }} />

      {/* Секции — скрываем в collapsed */}
      {!collapsed && (
        <>
          {/* Заголовок секций + шестерёнка */}
          <Group px={12} pt={10} pb={4} justify="space-between" style={{ flexShrink: 0 }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}
              style={{ letterSpacing: '0.06em' }} className="sidebar-section-title">
              Sections
            </Text>
            <Tooltip label="Manage sections" withArrow position="right">
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={openSectionsManager}>
                <IconSettings size={13} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Список секций — только эта часть скроллится */}
          <Stack gap={2} px={8} pb={4} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <NavLink label="All sections" active={activeSection === 'ALL'}
              onClick={() => handleSectionClick('ALL')}
              styles={{ root: { borderRadius: 4, fontSize: 13 } }} />
            <NavLink label="No section" active={activeSection === 'NULL'}
              onClick={() => handleSectionClick('NULL')}
              styles={{ root: { borderRadius: 4, fontSize: 13 } }} />

            {isLoading
              ? [1,2,3].map((i) => <Skeleton key={i} height={28} radius="sm" />)
              : sections
                  ?.slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .filter((s) => !s.is_archived)
                  .map((section) => (
                    <NavLink key={section.id} label={section.name}
                      leftSection={activeSection === section.id
                        ? <IconFolderOpen size={15} />
                        : <IconFolder size={15} />}
                      active={activeSection === section.id}
                      onClick={() => handleSectionClick(section.id)}
                      styles={{
                        root: {
                          borderRadius: 4, fontSize: 13,
                          ...(section.bgcolor && { borderLeft: `3px solid ${section.bgcolor}`, paddingLeft: 9 }),
                        },
                      }}
                    />
                  ))}
          </Stack>

          {/* Кнопка New section — прилипает к низу */}
          <Divider style={{ flexShrink: 0 }} />
          <Group px={12} py={8} style={{ flexShrink: 0 }}>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={13} />}
              color="gray" fullWidth justify="start"
              onClick={openSectionsManager}>
              New section
            </Button>
          </Group>
        </>
      )}
    </div>
  );
};
