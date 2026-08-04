import { Anchor, Badge, Box, Group, Text } from '@mantine/core';
import { MdBlock } from '@/modules/booker/components/MdBlock/MdBlock';
import { ExcalidrawBlock } from '@/modules/booker/components/ExcalidrawBlock/ExcalidrawBlock';

const getObjectContent = (block) => (
  typeof block.content === 'object' && block.content !== null ? block.content : {}
);

const CodeBlock = ({ block }) => {
  const content = getObjectContent(block);
  const code = content.code || '// New code block';
  const language = content.language || 'text';

  return (
    <Box className="booker-code-block">
      <Group justify="space-between" mb={6} gap={8}>
        <Text size="xs" c="dimmed">{content.caption || 'Code'}</Text>
        <Badge size="xs" variant="light" color="gray">{language}</Badge>
      </Group>
      <pre><code>{code}</code></pre>
    </Box>
  );
};

const CalloutBlock = ({ block }) => {
  const content = getObjectContent(block);
  const tone = content.tone || 'info';

  return (
    <Box className={`booker-callout-block booker-callout-block--${tone}`}>
      {content.title && <Text size="sm" fw={600}>{content.title}</Text>}
      <Text size="sm">{content.text || 'New callout'}</Text>
    </Box>
  );
};

const DividerBlock = ({ block }) => {
  const content = getObjectContent(block);

  return (
    <Box className="booker-divider-block">
      <Box className="booker-divider-line" />
      {content.label && <Text size="xs" c="dimmed" className="booker-divider-label">{content.label}</Text>}
      <Box className="booker-divider-line" />
    </Box>
  );
};

const EmbedBlock = ({ block }) => {
  const content = getObjectContent(block);
  const url = content.url || '';

  return (
    <Box className="booker-embed-block">
      <Text size="sm" fw={600}>{content.title || 'Embedded link'}</Text>
      {content.description && <Text size="sm" c="dimmed" mt={2}>{content.description}</Text>}
      {url ? (
        <Anchor size="sm" href={url} target="_blank" rel="noreferrer" mt={8} display="block">
          {url}
        </Anchor>
      ) : (
        <Text size="sm" c="dimmed" mt={8}>No URL yet</Text>
      )}
    </Box>
  );
};

const BLOCKS = {
  md: MdBlock,
  excalidraw: ExcalidrawBlock,
  code: CodeBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  embed: EmbedBlock,
};

const FallbackBlock = ({ block }) => (
  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
    Unknown block type: {block.type}
  </div>
);

export const BlockRenderer = ({ block, isEditing, onChange }) => {
  const Component = BLOCKS[block.type] ?? FallbackBlock;
  return <Component block={block} isEditing={isEditing} onChange={onChange} />;
};
