import { Badge } from '@mantine/core';

const COLORS = {
  family: 'pink',
  friend: 'green',
  classmate: 'blue',
  groupmate: 'cyan',
  colleague: 'indigo',
  coworker: 'indigo',
  neighbor: 'teal',
  service: 'orange',
  other: 'gray',
};

export const RelationBadge = ({ relation, contact }) => {
  const parts = [
    relation.kind,
    contact?.name,
    relation.context,
  ].filter(Boolean);

  return (
    <Badge
      variant={relation.valid_to ? 'outline' : 'light'}
      color={COLORS[relation.kind] || 'gray'}
      radius="sm"
      title={relation.note || undefined}
      styles={{ label: { textTransform: 'none' } }}
    >
      {parts.join(' / ')}
    </Badge>
  );
};
