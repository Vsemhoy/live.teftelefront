import { Box, Popover, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { BLOCK_META } from '@/modules/booker/utils/bookerUtils';

const MENU_ITEMS = [
  { type: 'markdown',   desc: 'Rich text with markdown' },
  { type: 'excalidraw', desc: 'Freeform drawing' },
  { type: 'svg',        desc: 'External SVG asset' },
  { type: 'table',      desc: 'Scrollable versioned data table' },
  { type: 'code',       desc: 'Syntax-highlighted code' },
  { type: 'callout',    desc: 'Highlighted note or tip' },
  { type: 'checklist',  desc: 'To-do list with checkboxes' },
  { type: 'divider',    desc: 'Visual separator' },
  { type: 'embed',      desc: 'External link card' },
];

export const AddBlockMenu = ({ onAdd, children }) => {
  const [opened, setOpened] = useState(false);

  const handleSelect = (type) => {
    setOpened(false);
    onAdd(type);
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      shadow="md"
      width={260}
      withinPortal
    >
      <Popover.Target>
        <Box onClick={() => setOpened((v) => !v)} style={{ cursor: 'pointer' }}>
          {children}
        </Box>
      </Popover.Target>
      <Popover.Dropdown p={6}>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500} px={8} py={4} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            Add block
          </Text>
          {MENU_ITEMS.map(({ type, desc }) => {
            const meta = BLOCK_META[type];
            return (
              <Box key={type} className="bkr-add-menu-item" onClick={() => handleSelect(type)}>
                <Box
                  className="bkr-add-menu-icon"
                  style={{ background: meta.bg, color: meta.color, fontSize: 13, fontWeight: 600 }}
                >
                  {meta.icon}
                </Box>
                <Box>
                  <Text size="sm" fw={500}>{meta.name}</Text>
                  <Text size="xs" c="dimmed">{desc}</Text>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
