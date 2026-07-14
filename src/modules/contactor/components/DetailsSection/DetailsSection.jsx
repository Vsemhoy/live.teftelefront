import { Box, Group, Stack, Text } from '@mantine/core';
import {
  IconAt, IconBrandTelegram, IconExternalLink, IconHome, IconPhone, IconTag,
} from '@tabler/icons-react';
import { normalizeDetails } from '../../utils/contactorUtils';

const KIND_ICONS = {
  phone: IconPhone,
  tg: IconBrandTelegram,
  email: IconAt,
  address: IconHome,
  link: IconExternalLink,
  custom: IconTag,
};

export const DetailsSection = ({ details = [] }) => {
  const sorted = normalizeDetails(details).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <Box className="cnt-panel">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>Details</Text>
      {sorted.length ? (
        <Stack gap={8}>
          {sorted.map((detail, idx) => {
            const Icon = KIND_ICONS[detail.kind] || KIND_ICONS.custom;
            return (
              <Group key={`${detail.kind}-${idx}`} gap={8} wrap="nowrap">
                <Icon size={15} color="var(--mantine-color-indigo-5)" style={{ flexShrink: 0 }} />
                <Text size="xs" c="dimmed" w={70} style={{ flexShrink: 0 }}>
                  {detail.label || detail.kind}
                </Text>
                <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
                  {detail.value || '-'}
                </Text>
              </Group>
            );
          })}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">No details yet</Text>
      )}
    </Box>
  );
};
