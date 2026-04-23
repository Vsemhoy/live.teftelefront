import { Group, Button, SegmentedControl, Select, Text, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconPlus, IconLayoutGrid, IconList,
  IconFilter, IconX,
} from '@tabler/icons-react';
import { useStufferStore } from '../../store/stufferStore';
import { MOCK_CATEGORIES } from '../../api/stufferMocks';

export const StufferToolbar = () => {
  const {
    openEditor, viewMode, setViewMode,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,
    activeLocationId,
  } = useStufferStore();

  const hasFilters = filterType || filterStatus || filterCategory;

  return (
    <div className="content-toolbar">
      <Group gap={8} style={{ flex: 1 }}>
        {/* Кнопка добавления */}
        <Button
          size="xs"
          leftSection={<IconPlus size={13} />}
          onClick={() => openEditor({})}
        >
          Добавить
        </Button>

        {/* Фильтр по типу */}
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

        {/* Фильтр по категории */}
        <Select
          size="xs"
          placeholder="Категория"
          clearable
          value={filterCategory}
          onChange={setFilterCategory}
          data={MOCK_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
          style={{ width: 140 }}
        />

        {/* Сброс фильтров */}
        {hasFilters && (
          <Tooltip label="Сбросить фильтры" withArrow>
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              onClick={() => { setFilterType(null); setFilterStatus(null); setFilterCategory(null); }}
            >
              <IconX size={13} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Переключатель вида */}
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
