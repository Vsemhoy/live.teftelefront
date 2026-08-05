import { Anchor, Badge, Box, Group, Text } from '@mantine/core';
import { MdBlock } from '@/modules/booker/components/MdBlock/MdBlock';
import { ExcalidrawBlock } from '@/modules/booker/components/ExcalidrawBlock/ExcalidrawBlock';
import { ChecklistBlock } from '@/modules/booker/components/ChecklistBlock/ChecklistBlock';
import { svgTextToDataUrl } from '@/modules/booker/utils/bookerUtils';

// Reads content from block_group.master_block
const mb = (group) => group.master_block || {};
const payload = (group) => mb(group).payload || {};

const CodeBlock = ({ group }) => {
  const p = payload(group);
  return (
    <Box className="bkr-code-block">
      <Group justify="space-between" mb={6} gap={8}>
        <Text size="xs" c="dimmed">{p.caption || 'Code'}</Text>
        <Badge size="xs" variant="light" color="gray">{p.language || 'text'}</Badge>
      </Group>
      <pre><code>{p.code || ''}</code></pre>
    </Box>
  );
};

const CalloutBlock = ({ group }) => {
  const p = payload(group);
  const tone = p.tone || 'info';
  return (
    <Box className={`bkr-callout-block bkr-callout-block--${tone}`}>
      {p.title && <Text size="sm" fw={600}>{p.title}</Text>}
      <Text size="sm">{p.text || ''}</Text>
    </Box>
  );
};

const DividerBlock = ({ group }) => {
  const p = payload(group);
  return (
    <Box className="bkr-divider-block">
      <Box className="bkr-divider-line" />
      {p.label && <Text size="xs" c="dimmed" className="bkr-divider-label">{p.label}</Text>}
      <Box className="bkr-divider-line" />
    </Box>
  );
};

const EmbedBlock = ({ group }) => {
  const p = payload(group);
  const url = p.url || '';
  return (
    <Box className="bkr-embed-block">
      <Text size="sm" fw={600}>{p.title || 'Embedded link'}</Text>
      {p.description && <Text size="sm" c="dimmed" mt={2}>{p.description}</Text>}
      {url ? (
        <Anchor size="sm" href={url} target="_blank" rel="noreferrer" mt={8} display="block">{url}</Anchor>
      ) : (
        <Text size="sm" c="dimmed" mt={8}>No URL set</Text>
      )}
    </Box>
  );
};

const SvgAssetBlock = ({ group }) => {
  const p = payload(group);
  const rawContent = mb(group).content;
  const content = rawContent && typeof rawContent === 'object' ? rawContent : {};
  const inlineSvg = p.svg_text || p.svg || content?.svg_text || content?.svg || '';
  const url = p.url || content?.url || '';
  const src = url || (inlineSvg ? svgTextToDataUrl(inlineSvg) : '');
  const caption = p.caption || content?.caption || '';
  const maxWidth = p.max_width || content?.max_width || '';
  const maxHeight = p.max_height || content?.max_height || '';

  return (
    <Box
      className="bkr-svg-asset-block"
      style={{
        '--bkr-svg-max-width': maxWidth || '100%',
        '--bkr-svg-max-height': maxHeight || '620px',
      }}
    >
      {src ? (
        <img src={src} alt={caption || 'SVG asset'} loading="lazy" />
      ) : (
        <Text size="sm" c="dimmed">No SVG source set</Text>
      )}
      {caption && <Text size="xs" c="dimmed" ta="center" mt={6}>{caption}</Text>}
    </Box>
  );
};

const TableBlock = ({ group }) => {
  const p = payload(group);
  const columns = Array.isArray(p.columns) ? p.columns : [];
  const rows = Array.isArray(p.rows) ? p.rows : [];

  return (
    <Box className="bkr-table-block">
      {p.caption && <Text size="xs" c="dimmed" mb={6}>{p.caption}</Text>}
      <Box className="bkr-table-scroll">
        <table style={{ minWidth: p.min_width || '720px' }}>
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((column, index) => <th key={`${column}-${index}`}>{column}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {(Array.isArray(row)
                  ? row
                  : columns.map((column) => row?.[column] ?? '')
                ).map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

const BLOCKS = {
  markdown:   MdBlock,
  excalidraw: ExcalidrawBlock,
  svg:        SvgAssetBlock,
  table:      TableBlock,
  code:       CodeBlock,
  callout:    CalloutBlock,
  divider:    DividerBlock,
  embed:      EmbedBlock,
  checklist:  ChecklistBlock,
};

const FallbackBlock = ({ group }) => (
  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
    Unknown block type: {group.type}
  </div>
);

export const BlockRenderer = ({ group }) => {
  const Component = BLOCKS[group.type] ?? FallbackBlock;
  return <Component group={group} />;
};
