import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon, Box, Button, Center, Group,
  Loader, Menu, Stack, Text,
} from '@mantine/core';
import {
  IconDots, IconEdit, IconEye, IconLayoutList, IconPlus,
  IconTrash, IconArrowLeft, IconSettings,
} from '@tabler/icons-react';
import { useBook, usePages, useSavePage, useDeletePage } from '@/modules/booker/api/bookerApi';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { PageStructureModal } from '@/modules/booker/components/PageStructureModal/PageStructureModal';
import { VISIBILITY_OPTIONS, getBookCoverSrc } from '@/modules/booker/utils/bookerUtils';

export const BookView = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const openPageStructure = useBookerStore((s) => s.openPageStructure);
  const openBookEditor = useBookerStore((s) => s.openBookEditor);

  const { data: book, isLoading: bookLoading } = useBook(bookId);
  const { data: pages = [], isLoading: pagesLoading } = usePages(bookId);
  const { mutate: savePage } = useSavePage();
  const { mutate: deletePage } = useDeletePage();
  const coverSrc = getBookCoverSrc(book);

  const handleNewPage = () => {
    const title = `Page ${pages.length + 1}`;
    savePage(
      { book_id: bookId, title, sort_order: pages.length + 1 },
      { onSuccess: (page) => navigate(`/booker/${bookId}/${page.id}`) },
    );
  };

  if (bookLoading || pagesLoading) {
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
            <Box style={{
              width: 24, height: 24, borderRadius: 5,
              background: book?.cover_color || '#E6F1FB', flexShrink: 0, overflow: 'hidden',
            }}>
              {coverSrc && <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
            </Box>
            <Text fw={500} size="sm">{book?.title}</Text>
          </Group>
          <Group gap={6}>
            <ActionIcon
              variant="subtle" color="gray" title="Page structure"
              onClick={() => openPageStructure(bookId)}
            >
              <IconLayoutList size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle" color="gray" title="Edit book"
              onClick={() => openBookEditor({ book })}
            >
              <IconSettings size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleNewPage}>
              New page
            </Button>
          </Group>
        </Group>
      </div>

      <Box className="content-scroll" p={16}>
        <Box style={{ maxWidth: 680, margin: '0 auto' }}>
          {book?.description && (
            <Text c="dimmed" size="sm" mb={20}>{book.description}</Text>
          )}

          {pages.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap={8}>
                <Text c="dimmed" size="sm">No pages yet</Text>
                <Button variant="light" size="sm" leftSection={<IconPlus size={14} />} onClick={handleNewPage}>
                  Create first page
                </Button>
              </Stack>
            </Center>
          ) : (
            <Stack gap={4}>
              {pages.map((page, i) => (
                <Box
                  key={page.id}
                  className="page-list-item"
                  onClick={() => navigate(`/booker/${bookId}/${page.id}`)}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Text size="sm" c="dimmed" style={{ minWidth: 20, textAlign: 'right' }}>
                        {i + 1}
                      </Text>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>{page.title}</Text>
                        {(page.block_groups_count > 0) && (
                          <Text size="xs" c="dimmed">{page.block_groups_count} blocks</Text>
                        )}
                      </Box>
                    </Group>
                    <Menu withinPortal position="bottom-end" onClick={(e) => e.stopPropagation()}>
                      <Menu.Target>
                        <ActionIcon
                          variant="subtle" color="gray" size="sm"
                          className="page-menu-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconDots size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={(e) => { e.stopPropagation(); navigate(`/booker/${bookId}/${page.id}`); }}
                        >
                          Open
                        </Menu.Item>
                        <Menu.Label>Visibility</Menu.Label>
                        {VISIBILITY_OPTIONS.map((option) => (
                          <Menu.Item
                            key={option.value}
                            leftSection={<IconEye size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              savePage({ id: page.id, visibility: option.value });
                            }}
                          >
                            {option.label}{page.visibility === option.value ? ' *' : ''}
                          </Menu.Item>
                        ))}
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={(e) => { e.stopPropagation(); deletePage({ id: page.id }); }}
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

      <PageStructureModal />
    </>
  );
};
