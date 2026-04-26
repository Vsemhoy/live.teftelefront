import { useState } from 'react';
import {
  Stack, NavLink, Text, Group, ActionIcon, Divider,
  Tooltip, UnstyledButton, Box, Badge,
} from '@mantine/core';
import {
  IconPackage, IconLayoutList, IconRss,
  IconMap2, IconPlus, IconX, IconChevronRight,
  IconHome, IconCar, IconBuildingWarehouse,
  IconMapPin,
} from '@tabler/icons-react';
import { useDroppable } from '@dnd-kit/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStufferStore } from '../../store/stufferStore';
import { buildLocationTree } from '../../utils/stufferUtils';
import { MOCK_THINGS } from '../../api/stufferMocks';
import { useLocations } from '../../api/stufferApi';

// Иконка для локации по названию
const LocationIcon = ({ name, size = 14 }) => {
  const n = name.toLowerCase();
  if (n.includes('машин') || n.includes('авто') || n.includes('bmw')) return <IconCar size={size} />;
  if (n.includes('гараж')) return <IconBuildingWarehouse size={size} />;
  if (n.includes('квартир') || n.includes('дом')) return <IconHome size={size} />;
  return <IconMapPin size={size} />;
};

// Рекурсивный рендер дерева
const LocationNode = ({ node, depth = 0, collapsed, activeLocationId, onSelect, thingCounts }) => {
  const [open, setOpen] = useState(depth === 0);
  const isActive = activeLocationId === node.id;
  const count = thingCounts[node.id] || 0;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sidebar-loc-${node.id}`,
    data: { type: 'location', location_id: node.id, location_name: node.name },
  });

  if (collapsed) {
    return (
      <Tooltip label={node.name} position="right" withArrow>
        <ActionIcon
          variant={isActive ? 'light' : 'subtle'}
          color={isActive ? 'blue' : 'gray'}
          size="sm"
          onClick={() => onSelect(isActive ? null : node.id)}
          style={{ margin: '1px auto', display: 'block' }}
        >
          <LocationIcon name={node.name} size={14} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Box>
      <UnstyledButton
        ref={setDropRef}
        onClick={() => {
          onSelect(isActive ? null : node.id);
          if (node.children.length > 0) setOpen((v) => !v);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%',
          padding: `4px 8px 4px ${8 + depth * 14}px`,
          borderRadius: 6,
          background: isOver
            ? 'var(--mantine-color-teal-1)'
            : isActive ? 'var(--mantine-color-blue-0)' : 'transparent',
          color: isActive ? 'var(--mantine-color-blue-7)' : 'inherit',
          outline: isOver ? '2px dashed var(--mantine-color-teal-5)' : undefined,
          transition: 'background 0.1s',
        }}
      >
        {node.children.length > 0 ? (
          <IconChevronRight
            size={12}
            style={{
              flexShrink: 0,
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              color: 'var(--mantine-color-gray-5)',
            }}
          />
        ) : (
          <Box style={{ width: 12, flexShrink: 0 }} />
        )}
        <LocationIcon name={node.name} size={13} />
        <Text size="xs" style={{ flex: 1, fontWeight: isActive ? 600 : 400 }} truncate>
          {node.name}
        </Text>
        {count > 0 && (
          <Badge size="xs" variant="light" color={isActive ? 'blue' : 'gray'} style={{ flexShrink: 0 }}>
            {count}
          </Badge>
        )}
      </UnstyledButton>

      {open && node.children.length > 0 && (
        <Box>
          {node.children.map((child) => (
            <LocationNode
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              activeLocationId={activeLocationId}
              onSelect={onSelect}
              thingCounts={thingCounts}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export const StufferSidenav = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeLocationId, setActiveLocation, openLocations } = useStufferStore();
  const { data: locations = [] } = useLocations();

  const tree = buildLocationTree(locations);

  // Считаем вещи по локациям из реальных данных через things query
  // Пока просто пустой объект — счётчики появятся когда подключим useThings в сайдбар
  const thingCounts = {};

  // collapsed-режим использует реальные локации
  const rootLocations = locations.filter((l) => !l.parent_id);

  const sidebarClass = [
    'sections-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const NAV = [
    { path: '/stuffer/things', icon: IconPackage,    label: 'Вещи' },
    { path: '/stuffer/feed',   icon: IconRss,         label: 'Лента' },
  ];

  return (
    <div className={sidebarClass}>
      {/* Кнопка закрытия мобилки */}
      {mobileOpen && !collapsed && (
        <Group px={8} py={6} justify="flex-end" style={{ flexShrink: 0 }}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onMobileClose}>
            <IconX size={14} />
          </ActionIcon>
        </Group>
      )}

      {/* Навигация */}
      <Stack gap={2} px={collapsed ? 4 : 8} pt={collapsed ? 8 : 4} pb={4} style={{ flexShrink: 0 }}>
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Tooltip key={path} label={label} position="right" disabled={!collapsed}>
              <NavLink
                component="button"
                label={!collapsed && <span className="sidebar-label">{label}</span>}
                leftSection={<Icon size={15} />}
                active={active}
                onClick={() => navigate(path)}
                styles={{ root: { borderRadius: 6, paddingTop: 6, paddingBottom: 6, fontWeight: active ? 600 : 400 } }}
              />
            </Tooltip>
          );
        })}
      </Stack>

      <Divider style={{ flexShrink: 0 }} />

      {/* Заголовок локаций */}
      {!collapsed && (
        <Group px={12} pt={10} pb={4} justify="space-between" style={{ flexShrink: 0 }}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.07em' }}>
            Локации
          </Text>
          <Tooltip label="Управление локациями" withArrow>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={openLocations}>
              <IconMap2 size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}

      {/* Дерево локаций */}
      <Box style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {collapsed ? (
          <Stack gap={2} px={4} pt={4}>
            {rootLocations.map((loc) => (
              <LocationNode
                key={loc.id}
                node={{ ...loc, children: [] }}
                collapsed
                activeLocationId={activeLocationId}
                onSelect={setActiveLocation}
                thingCounts={thingCounts}
              />
            ))}
          </Stack>
        ) : (
          <Box px={4}>
            {tree.map((node) => (
              <LocationNode
                key={node.id}
                node={node}
                collapsed={false}
                activeLocationId={activeLocationId}
                onSelect={setActiveLocation}
                thingCounts={thingCounts}
              />
            ))}
            {/* Все вещи (сброс фильтра) */}
            {activeLocationId && (
              <UnstyledButton
                onClick={() => setActiveLocation(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', padding: '4px 8px', borderRadius: 6, marginTop: 4,
                }}
              >
                <IconX size={12} style={{ color: 'var(--mantine-color-gray-5)' }} />
                <Text size="xs" c="dimmed">Сбросить фильтр</Text>
              </UnstyledButton>
            )}
          </Box>
        )}
      </Box>
    </div>
  );
};
