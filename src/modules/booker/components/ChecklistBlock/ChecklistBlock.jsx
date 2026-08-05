import { Box, Checkbox, Text } from '@mantine/core';

export const ChecklistBlock = ({ group }) => {
  const payload = group.master_block?.payload || {};
  const items = payload.items || [];

  if (items.length === 0) {
    return (
      <Box px="xs" py={8}>
        <Text size="sm" c="dimmed" fs="italic">Empty checklist — double-click to edit</Text>
      </Box>
    );
  }

  return (
    <Box className="bkr-checklist-block">
      {items.map((item, i) => (
        <Box key={i} className={`bkr-checklist-item ${item.checked ? 'bkr-checklist-item--done' : ''}`}>
          <Checkbox
            size="xs"
            checked={!!item.checked}
            readOnly
            styles={{ input: { cursor: 'default' } }}
          />
          <Text size="sm">{item.text || ''}</Text>
        </Box>
      ))}
    </Box>
  );
};
