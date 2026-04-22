import { useState } from 'react';
import {
  Stack, Group, Text, TextInput, ActionIcon, Button,
  Tooltip, Loader, Center, Box, Collapse,
} from '@mantine/core';
import {
  IconPlus, IconTrash, IconChevronDown, IconChevronRight,
  IconEdit, IconCheck, IconX, IconFolder, IconFolderOpen,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCategories, useSaveCategory, useDeleteCategory } from '../../api/badgerApi';

const C = 'green';
const MAX_DEPTH = 4; // 0..4 = 5 уровней

// ─── Утилиты дерева ───────────────────────────────────────────────

function buildTree(categories) {
  if (!Array.isArray(categories)) return [];
  const map = {};
  const roots = [];
  const sorted = [...categories]
    .filter((c) => !Boolean(c.is_archived))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  for (const c of sorted) map[c.id] = { ...c, children: [] };
  for (const c of sorted) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  }
  return roots;
}

// ─── Inline-редактор имени ────────────────────────────────────────

const InlineEditor = ({ initialValue, onSave, onCancel, autoFocus = true }) => {
  const [val, setVal] = useState(initialValue || '');
  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };
  return (
    <Group gap={4} style={{ flex: 1 }} wrap="nowrap">
      <TextInput
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        size="xs"
        autoFocus={autoFocus}
        style={{ flex: 1 }}
        styles={{ input: { fontWeight: val ? 400 : undefined } }}
      />
      <ActionIcon size="xs" color={C} variant="light" onClick={submit}>
        <IconCheck size={12} />
      </ActionIcon>
      <ActionIcon size="xs" color="gray" variant="subtle" onClick={onCancel}>
        <IconX size={12} />
      </ActionIcon>
    </Group>
  );
};

// ─── Узел дерева ──────────────────────────────────────────────────

const CategoryNode = ({ node, onAdd, onSave, onDelete, depth = 0 }) => {
  const [expanded,    setExpanded]    = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [addingChild, setAddingChild] = useState(false);

  const hasChildren = node.children?.length > 0;
  const canAddChild = depth < MAX_DEPTH;

  const handleSaveName = (name) => {
    onSave({ id: node.id, name });
    setEditing(false);
  };

  const handleAddChild = (name) => {
    onAdd({ name, parent_id: node.id, depth: depth + 1 });
    setAddingChild(false);
    setExpanded(true);
  };

  const handleDelete = () => {
    if (hasChildren) {
      notifications.show({ message: 'Remove child categories first', color: 'orange' });
      return;
    }
    if (!confirm(`Delete "${node.name}"?`)) return;
    onDelete(node.id);
  };

  return (
    <div className="bud-cat-node" style={{ paddingLeft: depth * 20 }}>
      <div className="bud-cat-row">
        {/* Экспандер */}
        <ActionIcon
          size="xs" variant="subtle" color="gray"
          style={{ visibility: hasChildren ? 'visible' : 'hidden', flexShrink: 0 }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </ActionIcon>

        {/* Иконка папки */}
        <span style={{ flexShrink: 0, color: 'var(--mantine-color-green-5)' }}>
          {hasChildren && expanded
            ? <IconFolderOpen size={14} />
            : <IconFolder size={14} />}
        </span>

        {/* Имя или редактор */}
        {editing ? (
          <InlineEditor
            initialValue={node.name}
            onSave={handleSaveName}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <Text
            size="sm"
            fw={depth === 0 ? 600 : 400}
            style={{ flex: 1, cursor: 'default', minWidth: 0 }}
            lineClamp={1}
          >
            {node.name}
          </Text>
        )}

        {/* Действия — видны при ховере через CSS */}
        {!editing && (
          <Group gap={2} className="bud-cat-actions" wrap="nowrap">
            {canAddChild && (
              <Tooltip label="Add subcategory" withArrow>
                <ActionIcon size="xs" variant="subtle" color={C}
                  onClick={() => setAddingChild((v) => !v)}>
                  <IconPlus size={12} />
                </ActionIcon>
              </Tooltip>
            )}
            <ActionIcon size="xs" variant="subtle" color="gray"
              onClick={() => setEditing(true)}>
              <IconEdit size={12} />
            </ActionIcon>
            <ActionIcon size="xs" variant="subtle" color="red"
              onClick={handleDelete}>
              <IconTrash size={12} />
            </ActionIcon>
          </Group>
        )}
      </div>

      {/* Inline добавление дочерней */}
      {addingChild && (
        <div style={{ paddingLeft: (depth + 1) * 20, paddingTop: 4 }}>
          <div className="bud-cat-row">
            <span style={{ width: 20, flexShrink: 0 }} />
            <span style={{ flexShrink: 0, opacity: 0.3 }}><IconFolder size={14} /></span>
            <InlineEditor
              initialValue=""
              onSave={handleAddChild}
              onCancel={() => setAddingChild(false)}
            />
          </div>
        </div>
      )}

      {/* Дети */}
      {hasChildren && (
        <Collapse in={expanded}>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAdd={onAdd}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </Collapse>
      )}
    </div>
  );
};

// ─── CategoryManager (страница) ───────────────────────────────────

export const CategoryManager = () => {
  const [addingRoot,  setAddingRoot]  = useState(false);
  const [rootName,    setRootName]    = useState('');

  const { data: categories = [], isLoading } = useCategories();
  const saveCategory   = useSaveCategory();
  const deleteCategory = useDeleteCategory();

  const tree = buildTree(categories);

  const handleAdd = ({ name, parent_id = null, depth = 0 }) => {
    const maxOrder = categories
      .filter((c) => c.parent_id === parent_id)
      .reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);

    saveCategory.mutate({ name, parent_id, depth, sort_order: maxOrder + 1 }, {
      onError: () => notifications.show({ message: 'Failed to create', color: 'red' }),
    });
  };

  const handleSave = ({ id, name }) => {
    saveCategory.mutate({ id, name }, {
      onError: () => notifications.show({ message: 'Failed to save', color: 'red' }),
    });
  };

  const handleDelete = (id) => {
    deleteCategory.mutate(id, {
      onError: () => notifications.show({ message: 'Failed to delete', color: 'red' }),
    });
  };

  const handleAddRoot = (name) => {
    handleAdd({ name, parent_id: null, depth: 0 });
    setAddingRoot(false);
    setRootName('');
  };

  if (isLoading) return <Center h={200}><Loader size="sm" color={C} /></Center>;

  return (
    <div className="content-scroll" style={{ padding: '20px 24px', paddingBottom: 80 }}>
      <Group justify="space-between" mb={20}>
        <div>
          <Text size="lg" fw={700} c="dark">Categories</Text>
          <Text size="xs" c="dimmed">Organise your transactions into a hierarchy up to 5 levels deep</Text>
        </div>
        <Button
          size="sm" color={C} variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={() => setAddingRoot(true)}
        >
          New category
        </Button>
      </Group>

      <Stack gap={0} className="bud-cat-tree">
        {/* Inline добавление корневой */}
        {addingRoot && (
          <div className="bud-cat-node">
            <div className="bud-cat-row">
              <span style={{ width: 20, flexShrink: 0 }} />
              <span style={{ flexShrink: 0, color: 'var(--mantine-color-green-5)' }}>
                <IconFolder size={14} />
              </span>
              <InlineEditor
                initialValue=""
                onSave={handleAddRoot}
                onCancel={() => setAddingRoot(false)}
              />
            </div>
          </div>
        )}

        {tree.length === 0 && !addingRoot && (
          <Center py={60}>
            <Stack align="center" gap={8}>
              <IconFolder size={40} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" size="sm">No categories yet</Text>
              <Button size="xs" color={C} variant="light"
                leftSection={<IconPlus size={12} />}
                onClick={() => setAddingRoot(true)}>
                Add first category
              </Button>
            </Stack>
          </Center>
        )}

        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            depth={0}
            onAdd={handleAdd}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
      </Stack>
    </div>
  );
};
