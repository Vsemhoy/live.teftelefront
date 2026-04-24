import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import { useStufferStore } from '../../store/stufferStore';

export const DraggableThing = ({ thing, children }) => {
  const dragLocked = useStufferStore((s) => s.dragLocked);

  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: thing.id,
    data: { thing },
    disabled: dragLocked,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        position: 'relative',
        transition: isDragging ? undefined : 'opacity 0.15s',
      }}
    >
      {/* Ручка drag — только если не заблокировано */}
      {!dragLocked && (
        <div
          {...listeners}
          {...attributes}
          style={{
            position: 'absolute',
            top: 6,
            right: 28,
            zIndex: 10,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            color: 'var(--mantine-color-gray-4)',
            borderRadius: 4,
            transition: 'color 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-gray-6)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mantine-color-gray-4)'}
        >
          <IconGripVertical size={13} />
        </div>
      )}
      {children}
    </div>
  );
};
