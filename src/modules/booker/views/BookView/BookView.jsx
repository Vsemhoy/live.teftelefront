import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon, Badge, Box, Button, Center, Group,
  Loader, Menu, Stack, Text,
} from '@mantine/core';
import {
  IconDots, IconEdit, IconLayoutList, IconPlus,
  IconTrash, IconArrowLeft, IconSettings,
} from '@tabler/icons-react';
import { useBook, useDocuments, useSaveDocument, useDeleteDocument } from '@/modules/booker/api/bookerApi';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { DocStructureModal } from '@/modules/booker/components/DocStructureModal/DocStructureModal';

export const BookView = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const openDocStructure = useBookerStore((s) => s.openDocStructure);
  const openBookEditor = useBookerStore((s) => s.openBookEditor);

  const { data: book, isLoading: bookLoading } = useBook(bookId);
  const { data: docs = [], isLoading: docsLoading } = useDocuments(bookId);
  const { mutate: saveDoc } = useSaveDocument();
  const { mutate: deleteDoc } = useDeleteDocument();

  const handleNewDoc = () => {
    const title = `Document ${docs.length + 1}`;
    saveDoc(
      { book_id: bookId, title, slug: title.toLowerCase().replace(/\s+/g, '-'), sort_order: docs.length + 1 },
      { onSuccess: (doc) => navigate(`/booker/${bookId}/${doc.id}`) }
    );
  };

  if (bookLoading || docsLoading) {
    return <Center h={300}><Loader size="sm" /></Center>;
  }

  return (
    <>
      <div className="content-toolbar">
        <Group px={16} py={8} justify="space-between">
          <Group gap={8}>
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate('/booker/library')}>
              <IconArrowLeft size={16} />
            </ActionIcon>
            <Box
              style={{
                width: 24, height: 24, borderRadius: 5,
                background: book?.cover_color || '#E6F1FB',
                flexShrink: 0,
              }}
            />
            <Text fw={500} size="sm">{book?.title}</Text>
          </Group>
          <Group gap={6}>
            <ActionIcon
              variant="subtle"
              color="gray"
              title="Structure"
              onClick={() => openDocStructure(bookId)}
            >
              <IconLayoutList size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              title="Edit book"
              onClick={() => openBookEditor({ book })}
            >
              <IconSettings size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleNewDoc}>
              New document
            </Button>
          </Group>
        </Group>
      </div>

      <Box className="content-scroll" p={16}>
        <Box style={{ maxWidth: 680, margin: '0 auto' }}>
          {book?.description && (
            <Text c="dimmed" size="sm" mb={20}>{book.description}</Text>
          )}

          {docs.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap={8}>
                <Text c="dimmed" size="sm">No documents yet</Text>
                <Button variant="light" size="sm" leftSection={<IconPlus size={14} />} onClick={handleNewDoc}>
                  Create first document
                </Button>
              </Stack>
            </Center>
          ) : (
            <Stack gap={4}>
              {docs.map((doc, i) => (
                <Box
                  key={doc.id}
                  className="doc-list-item"
                  onClick={() => navigate(`/booker/${bookId}/${doc.id}`)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed" style={{ minWidth: 20, textAlign: 'right' }}>
                        {i + 1}
                      </Text>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>{doc.title}</Text>
                        {doc.block_count > 0 && (
                          <Text size="xs" c="dimmed">{doc.block_count} blocks</Text>
                        )}
                      </Box>
                    </Group>
                    <Menu withinPortal position="bottom-end" onClick={(e) => e.stopPropagation()}>
                      <Menu.Target>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          className="doc-menu-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconDots size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={(e) => { e.stopPropagation(); navigate(`/booker/${bookId}/${doc.id}`); }}
                        >
                          Open
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={(e) => { e.stopPropagation(); deleteDoc({ id: doc.id, bookId }); }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <DocStructureModal />
    </>
  );
};
