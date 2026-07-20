import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconEdit, IconPin, IconPinFilled } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useToggleFactPin } from '../../api/factorApi';
import { useFactorStore } from '../../store/factorStore';

const kindColor = {
  document: 'blue',
  technical: 'cyan',
  professional: 'indigo',
  personal: 'grape',
  other: 'gray',
};

export const FactCard = ({ fact }) => {
  const openFactEditor = useFactorStore((state) => state.openFactEditor);
  const openFactViewer = useFactorStore((state) => state.openFactViewer);
  const toggleFactPin = useToggleFactPin();
  const isExpired = Boolean(fact.valid_to);
  const value = fact.is_sensitive ? String(fact.value || '').replace(/[^\s]/g, '*') : fact.value;
  const searchKeywords = fact.search_keywords || fact.search_aliases || fact.tags || [];

  const handleCopy = async (event) => {
    event.stopPropagation();
    await navigator.clipboard.writeText(fact.value || '');
    notifications.show({ message: 'Value copied', color: 'cyan' });
  };

  const handlePin = (event) => {
    event.stopPropagation();
    toggleFactPin.mutate(fact);
  };

  return (
    <article className={`fact-card ${isExpired ? 'expired' : ''}`} onDoubleClick={() => openFactViewer(fact)}>
      <Stack gap={8} className="fact-card-layout">
        <div className="fact-card-header">
          <Group gap={6} wrap="nowrap" className="fact-card-title">
            <Text size="sm" fw={700} truncate>{fact.label}</Text>
            {fact.is_pinned && <IconPinFilled size={13} color="var(--mantine-color-blue-6)" />}
          </Group>

          <Group gap={4} wrap="nowrap" className="fact-card-actions">
            <Tooltip label={fact.is_pinned ? 'Unpin' : 'Pin'} withArrow>
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={handlePin} loading={toggleFactPin.isPending}>
                {fact.is_pinned ? <IconPinFilled size={14} /> : <IconPin size={14} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Copy value" withArrow>
              <ActionIcon size="sm" variant="subtle" color="cyan" onClick={handleCopy}>
                <IconCopy size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openFactEditor(fact)}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>

        <div className="fact-card-body">
          <Text className="fact-value" size="md">{value}</Text>
          {fact.context && <Text size="xs" c="dimmed">{fact.context}</Text>}
        </div>

        <Group gap={6} className="fact-card-footer">
          <Badge size="xs" variant="light" color={kindColor[fact.kind] || 'gray'}>{fact.kind || 'other'}</Badge>
          {searchKeywords.slice(0, 4).map((keyword) => (
            <Badge key={keyword} size="xs" variant="outline" color="gray">{keyword}</Badge>
          ))}
          {fact.format && <Badge size="xs" variant="light" color="cyan">{fact.format}</Badge>}
          {fact.display_mode && <Badge size="xs" variant="light" color="blue">{fact.display_mode}</Badge>}
          {fact.is_sensitive && <Badge size="xs" variant="light" color="red">sensitive</Badge>}
          {fact.is_expert && <Badge size="xs" variant="light" color="indigo">expert</Badge>}
          {isExpired && (
            <Badge size="xs" variant="light" color="gray">
              expired {dayjs(fact.valid_to).format('DD MMM YYYY')}
            </Badge>
          )}
        </Group>
      </Stack>
    </article>
  );
};
