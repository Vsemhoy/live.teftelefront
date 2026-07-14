import { Box, Center, Text } from '@mantine/core';
import { buildRelationGraph } from '../../utils/contactorUtils';

const GROUP_COLORS = {
  family: '#be185d',
  work: '#4c5fd5',
  friends: '#16a34a',
  service: '#ea580c',
};

const LINK_COLORS = {
  family: '#be185d',
  friend: '#16a34a',
  classmate: '#2563eb',
  coworker: '#4c5fd5',
  service: '#ea580c',
};

export const GraphView = ({ contacts = [], relations = [] }) => {
  const { nodes, links } = buildRelationGraph(contacts, relations);

  if (!nodes.length) {
    return (
      <Center h={280}>
        <Text size="sm" c="dimmed">No contacts to draw</Text>
      </Center>
    );
  }

  const width = 920;
  const height = 520;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.34;

  const positioned = nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  const byId = new Map(positioned.map((node) => [node.id, node]));

  return (
    <Box className="cnt-graph-shell">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Contact relation graph">
        {links.map((link) => {
          const source = byId.get(link.source);
          const target = byId.get(link.target);
          if (!source || !target) return null;

          return (
            <line
              key={link.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={LINK_COLORS[link.kind] || '#94a3b8'}
              strokeWidth={link.expired ? 1.5 : 2.5}
              strokeOpacity={link.expired ? 0.28 : 0.72}
              strokeDasharray={link.expired ? '6 5' : undefined}
            />
          );
        })}

        {positioned.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <circle r="28" fill="white" stroke={GROUP_COLORS[node.group] || '#64748b'} strokeWidth="3" />
            <text textAnchor="middle" y="4" fontSize="12" fontWeight="700" fill="#111827">
              {node.label.split(' ').map((part) => part[0]).slice(0, 2).join('')}
            </text>
            <text textAnchor="middle" y="48" fontSize="12" fill="#475569">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
};
