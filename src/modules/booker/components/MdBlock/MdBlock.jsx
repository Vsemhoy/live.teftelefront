import { useEffect, useRef, useState } from 'react';
import { Box } from '@mantine/core';
import { MdFull } from '@/shared/components/MdRenderer';

export const MdBlock = ({ block, isEditing, onChange }) => {
  const [value, setValue] = useState(block.content || '');
  const taRef = useRef(null);

  useEffect(() => {
    setValue(block.content || '');
  }, [block.content]);

  useEffect(() => {
    if (isEditing && taRef.current) {
      taRef.current.focus();
      autoResize(taRef.current);
    }
  }, [isEditing]);

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    autoResize(e.target);
    onChange?.(e.target.value);
  };

  if (isEditing) {
    return (
      <Box p="xs">
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 13,
            fontFamily: 'var(--mantine-font-family-monospace)',
            color: 'var(--mantine-color-text)',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.65,
            minHeight: 80,
            padding: '4px 0',
          }}
          placeholder="Write markdown here..."
        />
      </Box>
    );
  }

  return (
    <Box px="xs" py={4} className="booker-md-block">
      <MdFull content={value} />
    </Box>
  );
};
