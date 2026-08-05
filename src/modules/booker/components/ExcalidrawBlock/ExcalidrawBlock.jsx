import { Box, Text } from '@mantine/core';

export const ExcalidrawBlock = ({ group }) => {
  const payload = group.master_block?.payload || {};

  if (payload.svg) {
    return (
      <Box
        className="bkr-excalidraw-preview"
        dangerouslySetInnerHTML={{ __html: payload.svg }}
      />
    );
  }

  return (
    <Box
      px="xs"
      py={16}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderRadius: 6,
        textAlign: 'center',
        margin: '4px 8px 8px',
      }}
    >
      <Text size="xs" c="dimmed">Empty drawing — double-click to edit</Text>
    </Box>
  );
};
