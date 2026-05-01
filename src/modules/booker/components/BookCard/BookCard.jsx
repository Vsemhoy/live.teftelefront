import { useNavigate } from 'react-router-dom';
import { ActionIcon, Badge, Box, Group, Menu, Text, Tooltip } from '@mantine/core';
import {
  IconDots, IconEdit, IconTrash, IconLock,
  IconWorld, IconUsers, IconBook2,
} from '@tabler/icons-react';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { useDeleteBook } from '@/modules/booker/api/bookerApi';

const AccessIcon = ({ access }) => {
  if (access === 3) return <Tooltip label="Public"><IconWorld size={13} /></Tooltip>;
  if (access === 2) return <Tooltip label="Friends"><IconUsers size={13} /></Tooltip>;
  return <Tooltip label="Private"><IconLock size={13} /></Tooltip>;
};

export const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const openBookEditor = useBookerStore((s) => s.openBookEditor);
  const { mutate: deleteBook } = useDeleteBook();

  const handleOpen = () => navigate(`/booker/${book.id}`);

  return (
    <Box
      className="book-card"
      onClick={handleOpen}
      style={{ cursor: 'pointer' }}
    >
      {/* Обложка */}
      <Box
        className="book-cover"
        style={{ background: book.cover_color || '#E6F1FB' }}
      >
        <IconBook2 size={28} style={{ opacity: 0.35, color: '#fff' }} />
      </Box>

      {/* Контент */}
      <Box className="book-card-body">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
          <Text className="book-title" lineClamp={2}>{book.title}</Text>
          <Menu withinPortal position="bottom-end" onClick={(e) => e.stopPropagation()}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
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
                onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
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
            <AccessIcon access={book.access} />
            <Text size="xs" c="dimmed">{book.user?.name}</Text>
          </Group>
          <Text size="xs" c="dimmed">{book.doc_count} docs</Text>
        </Group>

        {book.tags?.length > 0 && (
          <Group gap={4} mt={6} onClick={(e) => e.stopPropagation()}>
            {book.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} size="xs" variant="light" color="gray">{tag}</Badge>
            ))}
          </Group>
        )}
      </Box>
    </Box>
  );
};
