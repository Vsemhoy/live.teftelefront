import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal, TextInput, Textarea, Select, Button,
  Group, Stack, Box, SimpleGrid, Text, FileInput, SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useBookerStore } from '@/modules/booker/store/bookerStore';
import { useDeleteBook, useSaveBook } from '@/modules/booker/api/bookerApi';
import { VISIBILITY_OPTIONS, COVER_COLORS, getBookCoverSrc } from '@/modules/booker/utils/bookerUtils';

const STRUCTURE_OPTIONS = [
  { value: 'tree', label: 'Tree (nested pages)' },
  { value: 'flat', label: 'Flat (linear list)' },
];

export const BookEditor = () => {
  const navigate = useNavigate();
  const { bookEditorOpen, bookEditorParams, closeBookEditor } = useBookerStore();
  const { mutate: saveBook, isPending } = useSaveBook();
  const { mutate: deleteBook, isPending: deletePending } = useDeleteBook();
  const book = bookEditorParams?.book;

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      visibility: 'private',
      structure_mode: 'tree',
      cover_color: COVER_COLORS[0],
      cover_svg_url: '',
      cover_svg_text: '',
    },
  });

  useEffect(() => {
    if (bookEditorOpen) {
      form.setValues({
        title:          book?.title          ?? '',
        description:    book?.description    ?? '',
        visibility:     book?.visibility     ?? 'private',
        structure_mode: book?.structure_mode ?? 'tree',
        cover_color:    book?.cover_color    ?? COVER_COLORS[0],
        cover_svg_url:  book?.cover_svg_url  ?? '',
        cover_svg_text: book?.cover_svg_text ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookEditorOpen]);

  const handleSubmit = (values) => {
    saveBook(
      { ...(book ? { id: book.id } : {}), ...values },
      { onSuccess: closeBookEditor },
    );
  };

  const handleDelete = () => {
    if (!book?.id) return;
    if (!window.confirm(`Delete "${book.title}"? This action cannot be undone.`)) return;

    deleteBook(book.id, {
      onSuccess: () => {
        closeBookEditor();
        navigate('/booker/library');
      },
    });
  };

  const coverSrc = getBookCoverSrc(form.values);

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
          <Group grow>
            <Select
              label="Visibility"
              data={VISIBILITY_OPTIONS}
              {...form.getInputProps('visibility')}
            />
            <Select
              label="Structure"
              data={STRUCTURE_OPTIONS}
              {...form.getInputProps('structure_mode')}
            />
          </Group>
          <Box>
            <Text size="sm" fw={500} mb={6}>Cover colour</Text>
            <SimpleGrid cols={8} spacing={6}>
              {COVER_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => form.setFieldValue('cover_color', color)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: color, cursor: 'pointer',
                    border: form.values.cover_color === color
                      ? '2px solid var(--mantine-color-dark-9)'
                      : '2px solid transparent',
                  }}
                />
              ))}
            </SimpleGrid>
          </Box>
          <Box>
            <Text size="sm" fw={500} mb={6}>SVG cover</Text>
            <Stack gap="xs">
              <SegmentedControl
                size="xs"
                value={form.values.cover_svg_url ? 'url' : form.values.cover_svg_text ? 'inline' : 'none'}
                onChange={(mode) => {
                  if (mode === 'none') {
                    form.setFieldValue('cover_svg_url', '');
                    form.setFieldValue('cover_svg_text', '');
                  }
                  if (mode === 'url') form.setFieldValue('cover_svg_text', '');
                  if (mode === 'inline') form.setFieldValue('cover_svg_url', '');
                }}
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'url', label: 'URL' },
                  { value: 'inline', label: 'Inline' },
                ]}
              />
              {!form.values.cover_svg_text && (
                <TextInput
                  label="SVG URL"
                  placeholder="https://storage.yandexcloud.net/teftele/booker/covers/file.svg"
                  {...form.getInputProps('cover_svg_url')}
                />
              )}
              {!form.values.cover_svg_url && (
                <>
                  <FileInput
                    label="SVG file"
                    accept=".svg,image/svg+xml"
                    placeholder="Choose SVG file"
                    onChange={(file) => {
                      if (!file) return;
                      file.text().then((svgText) => {
                        form.setFieldValue('cover_svg_url', '');
                        form.setFieldValue('cover_svg_text', svgText);
                      });
                    }}
                  />
                  <Textarea
                    label="SVG code"
                    placeholder={'<svg viewBox="0 0 320 160">...</svg>'}
                    minRows={5}
                    autosize
                    {...form.getInputProps('cover_svg_text')}
                  />
                </>
              )}
              {coverSrc && (
                <Box className="book-cover book-cover-preview" style={{ background: form.values.cover_color || '#E6F1FB' }}>
                  <img src={coverSrc} alt="" />
                </Box>
              )}
            </Stack>
          </Box>
          <Group justify="space-between" mt="xs">
            <Box>
              {book && (
                <Button variant="subtle" color="red" onClick={handleDelete} loading={deletePending}>
                  Delete book
                </Button>
              )}
            </Box>
            <Group gap="xs">
              <Button variant="subtle" color="gray" onClick={closeBookEditor}>Cancel</Button>
              <Button type="submit" loading={isPending}>
                {book ? 'Save' : 'Create'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
