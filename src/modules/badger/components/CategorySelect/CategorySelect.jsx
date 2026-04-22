import { Select, Text } from '@mantine/core';
import { useCategories } from '../../api/badgerApi';

// Строим плоский список из дерева, сохраняя depth для отступов
// Бэк отдаёт плоский массив с parent_id и depth — просто сортируем по path
function buildFlatOptions(categories) {
  if (!Array.isArray(categories)) return [];

  // Сортируем по materialized path для корректного порядка дерева
  const sorted = [...categories]
    .filter((c) => !Boolean(c.is_archived))
    .sort((a, b) => (a.path || '').localeCompare(b.path || ''));

  return sorted.map((cat) => ({
    value: cat.id,
    label: cat.name,
    depth: cat.depth || 0,
  }));
}

// Рендер опции — жирный первый уровень, отступы для вложенных
const renderOption = ({ option }) => (
  <Text
    size="sm"
    fw={option.depth === 0 ? 600 : 400}
    style={{ paddingLeft: option.depth * 14 }}
    c={option.depth === 0 ? 'dark' : 'dimmed'}
  >
    {option.depth > 0 && (
      <span style={{ opacity: 0.4, marginRight: 4 }}>{'›'.repeat(option.depth)}</span>
    )}
    {option.label}
  </Text>
);

export const CategorySelect = ({ value, onChange, label = 'Category', placeholder = '— No category —', size = 'sm', clearable = true }) => {
  const { data: categories = [] } = useCategories();
  const options = buildFlatOptions(categories);

  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value || null}
      onChange={onChange}
      data={options}
      renderOption={renderOption}
      searchable
      clearable={clearable}
      size={size}
      maxDropdownHeight={320}
      filter={({ options: opts, search }) => {
        const q = search.toLowerCase();
        return opts.filter((o) => o.label.toLowerCase().includes(q));
      }}
    />
  );
};
