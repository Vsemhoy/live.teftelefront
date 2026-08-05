import { Box, Text } from '@mantine/core';
import { MdFull } from '@/shared/components/MdRenderer';

export const MdBlock = ({ group }) => {
  const content = group.master_block?.content || '';

  if (!content.trim()) {
    return (
      <Box px="xs" py={8}>
        <Text size="sm" c="dimmed" fs="italic">Empty block — double-click to edit</Text>
      </Box>
    );
  }

  return (
    <Box px="xs" py={4} className="bkr-md-block">
      <MdFull content={content} />
    </Box>
  );
};
