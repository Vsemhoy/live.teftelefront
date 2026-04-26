import { Group, Button, SegmentedControl, Select, ActionIcon, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus, IconLayoutGrid, IconList,
  IconX, IconLock, IconLockOpen,
} from '@tabler/icons-react';
import { useStufferStore } from '../../store/stufferStore';
import { MOCK_CATEGORIES } from '../../api/stufferMocks';

export const StufferToolbar = () => {
  const {
    openEditor, viewMode, setViewMode,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    dragLocked, toggleDragLock,
    activeLocationId,
  } = useStufferStore();

  const isMobile = useMediaQuery('(max-width: 768px)');
  const hasFilters = filterType || filterStatus || filterCategory;

  return (
    <div className="content-toolbar">
      <Group gap={8} style={{ flex: 1 }}>

        {isMobile ? (
          <Tooltip label="Add thing" withArrow>
            <ActionIcon size="sm" onClick={() => openEditor({ location_id: activeLocationId || undefined })}>
              <IconPlus size={15} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button size="xs" leftSection={<IconPlus size={13} />} onClick={() => openEditor({ location_id: activeLocationId || undefined })}>
            Add
          </Button>
        )}

        <Tooltip label={dragLocked ? 'Drag заблокирован — разблокировать' : 'Заблокировать drag'} withArrow>
          <ActionIcon
            size="sm"
            variant={dragLocked ? 'filled' : 'subtle'}
            color={dragLocked ? 'orange' : 'gray'}
            onClick={toggleDragLock}
          >
            {dragLocked ? <IconLock size={14} /> : <IconLockOpen size={14} />}
          </ActionIcon>
        </Tooltip>

        {!isMobile && (
          <>
            <Select
              size="xs"
              placeholder="Тип"
              clearable
              value={filterType}
              onChange={setFilterType}
              data={[
                { value: 'asset', label: 'Asset' },
                { value: 'item',  label: 'Item' },
              ]}
              style={{ width: 100 }}
            />
            <Select
              size="xs"
              placeholder="Категория"
              clearable
              value={filterCategory}
              onChange={setFilterCategory}
              data={MOCK_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
              style={{ width: 140 }}
            />
          </>
        )}

        {hasFilters && (
          <Tooltip label="Сбросить фильтры" withArrow>
            <ActionIcon size="sm" variant="light" color="red"
              onClick={() => { setFilterType(null); setFilterStatus(null); setFilterCategory(null); }}>
              <IconX size={13} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <SegmentedControl
        size="xs"
        value={viewMode}
        onChange={setViewMode}
        data={[
          { value: 'grid',  label: <IconLayoutGrid size={14} /> },
          { value: 'table', label: <IconList size={14} /> },
        ]}
      />
    </div>
  );
};
