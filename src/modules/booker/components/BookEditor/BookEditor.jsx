import { useEffect } from 'react';
import {
  Modal, TextInput, Textarea, Select, Button,
  Group, Stack, Box, SimpleGrid, Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { useSaveBook } from '@/modules/booker/api/bookerApi';
import { ACCESS_OPTIONS } from '@/modules/booker/api/bookerMocks';

const COVER_COLORS = [
  '#B5D4F4', '#9FE1CB', '#FAC775', '#F4C0D1',
  '#AFA9EC', '#F0997B', '#C0DD97', '#85B7EB',
];

export const BookEditor = () => {
  const { bookEditorOpen, bookEditorParams, closeBookEditor } = useBookerStore();
  const { mutate: saveBook, isPending } = useSaveBook();
  const book = bookEditorParams?.book;

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      access: '1',
      cover_color: COVER_COLORS[0],
    },
  });

  useEffect(() => {
    if (bookEditorOpen) {
      form.setValues({
        title:       book?.title       ?? '',
        description: book?.description ?? '',
        access:      String(book?.access ?? '1'),
        cover_color: book?.cover_color ?? COVER_COLORS[0],
      });
    }
  }, [bookEditorOpen]);

  const handleSubmit = (values) => {
    saveBook(
      { ...book, ...values, access: parseInt(values.access) },
      { onSuccess: closeBookEditor }
    );
  };

  return (
    <Modal
      opened={bookEditorOpen}
      onClose={closeBookEditor}
      title={book ? 'Edit book' : 'New book'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="Book title"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="What is this book about?"
            rows={3}
            {...form.getInputProps('description')}
          />

          <Select
            label="Access"
            data={ACCESS_OPTIONS}
            {...form.getInputProps('access')}
          />

          <Box>
            <Text size="sm" fw={500} mb={6}>Cover colour</Text>
            <SimpleGrid cols={8} spacing={6}>
              {COVER_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => form.setFieldValue('cover_color', color)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: color,
                    cursor: 'pointer',
                    border: form.values.cover_color === color
                      ? '2px solid var(--mantine-color-dark-9)'
                      : '2px solid transparent',
                  }}
                />
              ))}
            </SimpleGrid>
          </Box>

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeBookEditor}>Cancel</Button>
            <Button type="submit" loading={isPending}>
              {book ? 'Save' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
