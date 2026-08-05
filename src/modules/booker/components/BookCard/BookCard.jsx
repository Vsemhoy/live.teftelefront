import { useNavigate } from 'react-router-dom';
import { ActionIcon, Box, Group, Menu, Text, Tooltip } from '@mantine/core';
import {
  IconDots, IconEdit, IconTrash, IconLock,
  IconWorld, IconUsers, IconBook2,
} from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { useDeleteBook } from '@/modules/booker/api/bookerApi';
import { getBookCoverSrc } from '@/modules/booker/utils/bookerUtils';

const VisIcon = ({ visibility }) => {
  if (visibility === 'public') return <Tooltip label="Public"><IconWorld size={13} /></Tooltip>;
  if (visibility === 'friends') return <Tooltip label="Friends"><IconUsers size={13} /></Tooltip>;
  return <Tooltip label="Private"><IconLock size={13} /></Tooltip>;
};

export const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const openBookEditor = useBookerStore((s) => s.openBookEditor);
  const { mutate: deleteBook } = useDeleteBook();
  const coverSrc = getBookCoverSrc(book);

  const handleDelete = (event) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${book.title}"? This action cannot be undone.`)) return;
    deleteBook(book.id);
  };

  return (
    <Box
      className="book-card"
      onClick={() => navigate(`/booker/${book.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Box className="book-cover" style={{ background: book.cover_color || '#E6F1FB' }}>
        {coverSrc ? (
          <img src={coverSrc} alt="" loading="lazy" />
        ) : (
          <IconBook2 size={28} style={{ opacity: 0.35, color: '#fff' }} />
        )}
      </Box>

      <Box className="book-card-body">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
          <Text className="book-title" lineClamp={2}>{book.title}</Text>
          <Menu withinPortal position="bottom-end" onClick={(e) => e.stopPropagation()}>
            <Menu.Target>
              <ActionIcon
                variant="subtle" color="gray" size="sm"
                className="book-menu-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => { e.stopPropagation(); openBookEditor({ book }); }}
              >
                Edit
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={handleDelete}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {book.description && (
          <Text className="book-description" lineClamp={2}>{book.description}</Text>
        )}

        <Group justify="space-between" align="center" mt="auto" pt={8}>
          <Group gap={4} style={{ color: 'var(--mantine-color-dimmed)', fontSize: 12 }}>
            <VisIcon visibility={book.visibility} />
          </Group>
          <Text size="xs" c="dimmed">{book.pages_count ?? 0} pages</Text>
        </Group>
      </Box>
    </Box>
  );
};
