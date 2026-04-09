import { useState } from 'react';
import { MultiSelect, Box, Group, Text, ColorSwatch, Loader } from '@mantine/core';
import { useTags, useSaveTag } from '../../api/eventorApi';
import { notifications } from '@mantine/notifications';

const CREATE_PREFIX = '__create__:';

export const TagSelect = ({ value = [], onChange }) => {
  const { data: tags, isLoading } = useTags();
  const { mutateAsync: saveTag, isPending: isCreating } = useSaveTag();
  const [search, setSearch] = useState('');

  const existingOptions = (tags || []).map((t) => ({
    value: t.id,
    label: t.name,
    color: t.color,
    bgcolor: t.bgcolor,
    is_system: Boolean(t.is_system),
  }));

  // Добавляем "создать" опцию если поиск не пустой и такого тега нет
  const trimmed = search.trim();
  const alreadyExists = existingOptions.some(
    (o) => o.label.toLowerCase() === trimmed.toLowerCase()
  );
  const options =
    trimmed && !alreadyExists
      ? [...existingOptions, { value: `${CREATE_PREFIX}${trimmed}`, label: `+ Create "${trimmed}"` }]
      : existingOptions;

  const handleChange = async (selected) => {
    const createItem = selected.find((v) => v.startsWith(CREATE_PREFIX));

    if (!createItem) {
      onChange(selected);
      return;
    }

    // Убираем create-заглушку из выбранных
    const rest = selected.filter((v) => !v.startsWith(CREATE_PREFIX));
    const name = createItem.replace(CREATE_PREFIX, '').trim();

    try {
      const newTag = await saveTag({ name });
      onChange([...rest, newTag.id]);
      setSearch('');
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to create tag',
        color: 'red',
      });
      onChange(rest);
    }
  };

  if (isLoading) return <Loader size="xs" />;

  return (
    <MultiSelect
      label="Tags"
      placeholder={value.length === 0 ? 'Add tags...' : ''}
      data={options}
      value={value}
      onChange={handleChange}
      searchable
      searchValue={search}
      onSearchChange={setSearch}
      maxDropdownHeight={240}
      clearable
      disabled={isCreating}
      renderOption={({ option }) => {
        // Опция создания
        if (option.value.startsWith(CREATE_PREFIX)) {
          return (
            <Text size="sm" c="blue">
              {option.label}
            </Text>
          );
        }
        // Обычный тег
        return (
          <Group gap={8} wrap="nowrap">
            {option.color ? (
              <ColorSwatch color={option.color} size={10} style={{ flexShrink: 0 }} />
            ) : (
              <Box style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--mantine-color-gray-4)', flexShrink: 0,
              }} />
            )}
            <Text size="sm">{option.label}</Text>
            {option.is_system && <Text size="xs" c="dimmed">system</Text>}
          </Group>
        );
      }}
      styles={{
        input: { minHeight: 36 },
      }}
    />
  );
};
