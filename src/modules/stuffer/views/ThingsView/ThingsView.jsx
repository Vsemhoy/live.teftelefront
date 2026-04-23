import { useMemo, useState } from 'react';
import { Text, Box, Group, Badge, Table, ActionIcon, Tooltip, Stack, Paper } from '@mantine/core';
import { IconPackage, IconEdit, IconArrowRight } from '@tabler/icons-react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

import { useStufferStore } from '../../store/stufferStore';
import { StufferToolbar } from '../../components/Toolbar/StufferToolbar';
import { ThingCard } from '../../components/ThingCard/ThingCard';
import { DraggableThing } from '../../components/DraggableThing/DraggableThing';
import { DropPanel } from '../../components/DropPanel/DropPanel';
import { DropActionModal } from '../../components/DropActionModal/DropActionModal';
import { MOCK_THINGS, MOCK_CATEGORIES, THING_STATUSES, MOCK_LOCATIONS } from '../../api/stufferMocks';
import { formatPrice, getLocationPath } from '../../utils/stufferUtils';
import { useMasonryColumns } from '@/shared/hooks/useMasonryColumns';

const SimpleMasonry = ({ columns, children }) => {
  const safeColumns = Math.max(1, columns || 1);
  const cols = Array.from({ length: safeColumns }, () => []);
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  items.forEach((child, i) => cols[i % safeColumns].push(child));
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {col}
        </div>
      ))}
    </div>
  );
};

export const ThingsView = () => {
  const { filterType, filterCategory, filterStatus, activeLocationId, viewMode, openEditor, openRegister } = useStufferStore();
  const navigate = useNavigate();
  const { columns: masonryColumns } = useMasonryColumns(320);

  const [activeThing, setActiveThing] = useState(null);
  const [dropModalData, setDropModalData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const things = useMemo(() => {
    return MOCK_THINGS.filter((t) => {
      if (t.is_archived) return false;
      if (filterType && t.entity_type !== filterType) return false;
      if (filterCategory && t.category_id !== filterCategory) return false;
      if (filterStatus && t.current_status !== filterStatus) return false;
      if (activeLocationId && t.current_location_id !== activeLocationId) return false;
      return true;
    }).sort((a, b) => {
      const da = new Date(a.last_opened_at || 0);
      const db = new Date(b.last_opened_at || 0);
      if (db - da !== 0) return db - da;
      return (b.open_count || 0) - (a.open_count || 0);
    });
  }, [filterType, filterCategory, filterStatus, activeLocationId]);

  const handleDragStart = ({ active }) => {
    setActiveThing(active.data.current?.thing || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveThing(null);
    if (!over || !active.data.current?.thing) return;
    const thing = active.data.current.thing;
    const dropData = over.data.current;
    if (!dropData) return;

    if (dropData.type === 'location') {
      notifications.show({
        title: 'Перемещено',
        message: `${thing.name} → ${dropData.location_name}`,
        color: 'teal',
        autoClose: 3000,
      });
      return;
    }

    if (dropData.type === 'location-picker' || dropData.type === 'status') {
      setDropModalData({ thing, dropData });
    }
  };

  const handleDragCancel = () => setActiveThing(null);

  const handleDropConfirm = (payload) => {
    const labels = { moved: 'Перемещено', lent: 'Одолжено', sold: 'Продано', repaired: 'В ремонт', disposed: 'Утилизировано' };
    notifications.show({
      title: labels[payload.event_type] || 'Сохранено',
      message: dropModalData?.thing?.name,
      color: 'green',
      autoClose: 3000,
    });
    setDropModalData(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <StufferToolbar />

      <div className="content-scroll" style={{ padding: '12px', paddingBottom: activeThing ? 140 : 12, transition: 'padding-bottom 0.25s' }}>
        {things.length === 0 && (
          <Stack align="center" gap={8} pt={60}>
            <IconPackage size={40} style={{ color: 'var(--mantine-color-gray-4)' }} />
            <Text c="dimmed" size="sm">Ничего не найдено</Text>
          </Stack>
        )}

        {viewMode === 'grid' && things.length > 0 && (
          <SimpleMasonry columns={masonryColumns}>
            {things.map((thing) => (
              <DraggableThing key={thing.id} thing={thing}>
                <ThingCard thing={thing} />
              </DraggableThing>
            ))}
          </SimpleMasonry>
        )}

        {viewMode === 'table' && things.length > 0 && (
          <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 13 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Тип</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Локация</Table.Th>
                <Table.Th>Категория</Table.Th>
                <Table.Th>Цена</Table.Th>
                <Table.Th style={{ width: 60 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {things.map((thing) => {
                const cat = MOCK_CATEGORIES.find((c) => c.id === thing.category_id);
                const status = THING_STATUSES[thing.current_status];
                const locPath = getLocationPath(thing.current_location_id, MOCK_LOCATIONS);
                return (
                  <Table.Tr key={thing.id} style={{ cursor: 'pointer' }} onDoubleClick={() => navigate(`/stuffer/things/${thing.id}`)}>
                    <Table.Td><Text size="sm" fw={500} lineClamp={1}>{thing.name}</Text></Table.Td>
                    <Table.Td>
                      <Badge size="xs" variant="dot" color={thing.entity_type === 'asset' ? 'blue' : 'violet'}>{thing.entity_type}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {status && <Badge size="xs" color={status.color} variant="light">{status.label}</Badge>}
                    </Table.Td>
                    <Table.Td><Text size="xs" c="dimmed" lineClamp={1}>{locPath || '—'}</Text></Table.Td>
                    <Table.Td>
                      {cat && <Group gap={4}><Box style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} /><Text size="xs">{cat.name}</Text></Group>}
                    </Table.Td>
                    <Table.Td><Text size="xs">{formatPrice(thing.purchase_price) || '—'}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="center">
                        <Tooltip label="Редактировать" withArrow><ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); openEditor({ id: thing.id }); }}><IconEdit size={12} /></ActionIcon></Tooltip>
                        <Tooltip label="Событие" withArrow><ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); openRegister({ thing_id: thing.id }); }}><IconArrowRight size={12} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </div>

      <DropPanel visible={!!activeThing} />

      <DragOverlay dropAnimation={null}>
        {activeThing ? (
          <div style={{ transform: 'rotate(2deg)', opacity: 0.9, width: 200 }}>
            <Paper shadow="lg" p="xs" withBorder style={{ borderLeft: '3px solid #b45309', pointerEvents: 'none' }}>
              <Text size="xs" fw={600} lineClamp={1}>{activeThing.name}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{activeThing.description}</Text>
            </Paper>
          </div>
        ) : null}
      </DragOverlay>

      <DropActionModal
        opened={!!dropModalData}
        onClose={() => setDropModalData(null)}
        thing={dropModalData?.thing}
        dropData={dropModalData?.dropData}
        onConfirm={handleDropConfirm}
      />
    </DndContext>
  );
};
