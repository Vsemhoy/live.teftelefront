import { MdBlock } from '@/modules/booker/components/MdBlock/MdBlock';
import { ExcalidrawBlock } from '@/modules/booker/components/ExcalidrawBlock/ExcalidrawBlock';

const BLOCKS = {
  md:         MdBlock,
  excalidraw: ExcalidrawBlock,
  // code, table, video — будущее
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
