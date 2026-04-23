import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const DraggableThing = ({ thing, children }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: thing.id,
    data: { thing },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        transition: isDragging ? undefined : 'opacity 0.15s',
      }}
    >
      {children}
    </div>
  );
};
