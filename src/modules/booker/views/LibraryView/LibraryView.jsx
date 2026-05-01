import { Box, Center, Loader, SimpleGrid, Text } from '@mantine/core';
import { IconBooks } from '@tabler/icons-react';
import { useBooks } from '@/modules/booker/api/bookerApi';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { BookCard } from '@/modules/booker/components/BookCard/BookCard';
import { BookerToolbar } from '@/modules/booker/components/Toolbar/BookerToolbar';

export const LibraryView = () => {
  const { filterTab, filterTheme, filterTag, searchQuery } = useBookerStore();

  const { data: books = [], isLoading } = useBooks({
    my:  filterTab === 'my',
    sub: filterTab === 'subscriptions',
    tag: filterTag,
    q:   searchQuery,
  });

  if (isLoading) {
    return (
      <>
        <BookerToolbar />
        <Center h={300}><Loader size="sm" /></Center>
      </>
    );
  }

  return (
    <>
      <BookerToolbar />
      <Box className="content-scroll" p={16}>
        {books.length === 0 ? (
          <Center h={300}>
            <Box ta="center">
              <IconBooks size={40} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" size="sm" mt={8}>No books found</Text>
            </Box>
          </Center>
        ) : (
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
            spacing="md"
          >
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </>
  );
};
