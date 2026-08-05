import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon, Box, Button, FileInput, Group, Menu, Modal, NavLink, Stack, Text, Textarea, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBook, IconBooks, IconCopy, IconDatabaseExport, IconDatabaseImport,
  IconFileText, IconPlus, IconSettings,
} from '@tabler/icons-react';
import {
  createBookerBlockGroup,
  createBookerBook,
  createBookerPage,
  useBook,
  useBooks,
  usePage,
  usePages,
} from '@/modules/booker/api/bookerApi';
import { useBookerStore } from '@/modules/booker/store/bookerStore';

const IMPORT_BLOCK_TYPES = new Set(['markdown', 'excalidraw', 'svg', 'table', 'code', 'callout', 'checklist', 'divider', 'embed']);
const IMPORT_BLOCK_ROLES = new Set(['content', 'note', 'source', 'todo', 'ai_response']);
const IMPORT_VISIBILITY = new Set(['private', 'friends', 'registered', 'public']);

const cleanName = (name = 'Imported page') => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imported page';

const parseDelimitedTable = (text, delimiter) => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim() !== '');
  const [header = '', ...body] = lines;
  const columns = header.split(delimiter).map((cell) => cell.trim());
  const rows = body.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  return { columns, rows };
};

const fileToBlock = async (file) => {
  const text = await file.text();
  const name = cleanName(file.name);
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    const { columns, rows } = parseDelimitedTable(text, lower.endsWith('.tsv') ? '\t' : ',');
    return {
      type: 'table',
      role: 'content',
      visibility: 'private',
      title: name,
      payload: { caption: file.name, min_width: '720px', columns, rows },
    };
  }

  if (lower.endsWith('.svg') || text.trimStart().startsWith('<svg')) {
    return {
      type: 'svg',
      role: 'content',
      visibility: 'private',
      title: name,
      payload: {
        source: 'file',
        svg_text: text,
        file_name: file.name,
        caption: name,
        max_width: '100%',
        max_height: '70vh',
      },
    };
  }

  if (lower.match(/\.(js|jsx|ts|tsx|php|css|scss|sql|json|yaml|yml|html|xml|sh|ps1)$/)) {
    const language = lower.split('.').pop();
    return {
      type: 'code',
      role: 'source',
      visibility: 'private',
      title: name,
      payload: { caption: file.name, language, code: text },
    };
  }

  return {
    type: 'markdown',
    role: 'content',
    visibility: 'private',
    title: name,
    content: text,
  };
};

const filesToImportPayload = async (files, fallbackTitle = 'Imported files') => {
  const list = Array.isArray(files) ? files : [files].filter(Boolean);
  if (list.length === 1 && list[0].name.toLowerCase().endsWith('.json')) {
    return list[0].text();
  }

  const blocks = await Promise.all(list.map(fileToBlock));
  return JSON.stringify({
    schema: 'teftele.booker.v1',
    kind: 'page',
    page: {
      title: list.length === 1 ? cleanName(list[0].name) : fallbackTitle,
      visibility: 'private',
      sort_order: 1,
      blocks,
    },
  }, null, 2);
};

const normalizeBlock = (block, index) => {
  const type = IMPORT_BLOCK_TYPES.has(block?.type) ? block.type : 'markdown';
  const role = IMPORT_BLOCK_ROLES.has(block?.role) ? block.role : 'content';
  const visibility = IMPORT_VISIBILITY.has(block?.visibility) ? block.visibility : 'private';
  const title = block?.title || block?.master_block?.title || null;
  const content = block?.content ?? block?.master_block?.content ?? undefined;
  const payload = block?.payload ?? block?.master_block?.payload ?? undefined;

  return {
    type,
    role,
    visibility,
    sort_order: Number(block?.sort_order ?? index + 1),
    title,
    content,
    payload,
    status: block?.status || block?.master_block?.status || 'draft',
  };
};

const importBlocks = async (pageId, blocks = []) => {
  for (const [index, block] of blocks.entries()) {
    const normalized = normalizeBlock(block, index);
    await createBookerBlockGroup({ page_id: pageId, ...normalized });
  }
};

const BOOKER_IMPORT_SPEC = `# Teftele Booker import spec v1

Use this format when generating a book or a page for Booker.

Root object:
- schema: "teftele.booker.v1"
- kind: "book" or "page"
- book: object, required for book exports/imports
- page: object, required for page imports
- pages: array, optional for full book imports

Book fields:
- title: string
- description: string
- visibility: "private" | "friends" | "registered" | "public"
- structure_mode: "tree" | "flat"
- cover_color: hex string
- cover_svg_url: string, optional
- cover_svg_text: string, optional inline SVG code

Page fields:
- title: string
- slug: string, optional
- visibility: "private" | "friends" | "registered" | "public"
- sort_order: number
- blocks: array

Block fields:
- type: "markdown" | "excalidraw" | "svg" | "table" | "code" | "callout" | "checklist" | "divider" | "embed"
- role: "content" | "note" | "source" | "todo" | "ai_response"
- visibility: "private" | "friends" | "registered" | "public"
- title: string, optional
- content: markdown string, for markdown blocks
- payload: object, for structured blocks
- svg payload by URL: { "source": "url", "url": "https://storage.example.com/file.svg", "caption": "Optional caption", "max_width": "720px", "max_height": "70vh" }
- svg payload by inline text or uploaded file: { "source": "inline" | "file", "svg_text": "<svg>...</svg>", "file_name": "diagram.svg", "caption": "Optional caption", "max_width": "100%", "max_height": "620px" }

SVG size format:
- max_width and max_height are optional CSS size strings
- supported examples: "320px", "48rem", "80%", "70vh", "auto"
- empty string or missing field means Booker uses the default responsive limit
- use max_width for horizontal diagrams and max_height for tall diagrams

Table payload format:
- columns: array of strings, displayed as table headers
- rows: array of arrays or array of objects
- caption: optional string
- min_width: optional CSS size string, used for horizontal overflow
- example: { "caption": "Ports", "min_width": "720px", "columns": ["Service", "Port"], "rows": [["API", "443"], ["DB", "3306"]] }

Versioning:
- each imported block creates a block group
- the first version becomes master by default
- later versions can be added to the same block_group_id

Example: full book
\`\`\`json
{
  "schema": "teftele.booker.v1",
  "kind": "book",
  "book": {
    "title": "Warehouse API Handbook",
    "description": "Operational notes and integration examples.",
    "visibility": "private",
    "structure_mode": "tree",
    "cover_color": "#B5D4F4",
    "cover_svg_text": "<svg viewBox='0 0 320 160'><text x='24' y='88'>Warehouse API</text></svg>"
  },
  "pages": [
    {
      "title": "Authentication",
      "slug": "authentication",
      "visibility": "private",
      "sort_order": 1,
      "blocks": [
        {
          "type": "markdown",
          "role": "content",
          "visibility": "private",
          "title": "Overview",
          "content": "# Authentication\\n\\nUse JWT bearer tokens for private API calls."
        },
        {
          "type": "svg",
          "role": "content",
          "visibility": "private",
          "title": "System architecture diagram",
          "payload": {
            "source": "url",
            "url": "https://storage.yandexcloud.net/teftele/booker/svg/01KQEXAMPLE.svg",
            "caption": "System architecture",
            "max_width": "760px",
            "max_height": "70vh"
          }
        },
        {
          "type": "code",
          "role": "source",
          "visibility": "private",
          "title": "Login request",
          "payload": {
            "caption": "Login with email and password",
            "language": "bash",
            "code": "curl -X POST https://api.example.com/api/auth/login -d 'email=user@example.com&password=secret'"
          }
        },
        {
          "type": "table",
          "role": "content",
          "visibility": "private",
          "title": "Core services",
          "payload": {
            "caption": "Service map",
            "min_width": "760px",
            "columns": ["Service", "Host", "Port"],
            "rows": [
              ["API", "api.example.com", "443"],
              ["MariaDB", "db.internal", "3306"]
            ]
          }
        }
      ]
    },
    {
      "title": "Inventory flow",
      "slug": "inventory-flow",
      "visibility": "private",
      "sort_order": 2,
      "blocks": [
        {
          "type": "callout",
          "role": "note",
          "visibility": "private",
          "title": "Migration note",
          "payload": {
            "tone": "warning",
            "title": "Legacy fields",
            "text": "Keep old external identifiers until the import is verified."
          }
        },
        {
          "type": "checklist",
          "role": "todo",
          "visibility": "private",
          "title": "Release checklist",
          "payload": {
            "items": [
              { "text": "Import production snapshot", "checked": true },
              { "text": "Verify balances", "checked": false }
            ]
          }
        }
      ]
    }
  ]
}
\`\`\`

Example: single page
\`\`\`json
{
  "schema": "teftele.booker.v1",
  "kind": "page",
  "page": {
    "title": "Docker quick commands",
    "slug": "docker-quick-commands",
    "visibility": "private",
    "sort_order": 1,
    "blocks": [
      {
        "type": "markdown",
        "role": "content",
        "visibility": "private",
        "title": "Purpose",
        "content": "Commands that are useful during local backend debugging."
      },
      {
        "type": "divider",
        "role": "content",
        "visibility": "private",
        "payload": { "label": "Containers" }
      },
      {
        "type": "code",
        "role": "source",
        "visibility": "private",
        "title": "List containers",
        "payload": {
          "caption": "Running containers",
          "language": "bash",
          "code": "docker ps"
        }
      },
      {
        "type": "embed",
        "role": "source",
        "visibility": "private",
        "title": "Docker docs",
        "payload": {
          "title": "Docker CLI reference",
          "url": "https://docs.docker.com/reference/cli/docker/",
          "description": "Official Docker command-line reference."
        }
      },
      {
        "type": "svg",
        "role": "source",
        "visibility": "private",
        "title": "Inline schema",
        "payload": {
          "source": "inline",
          "svg_text": "<svg viewBox='0 0 120 40'><text x='10' y='25'>API</text></svg>",
          "caption": "Inline SVG example",
          "max_width": "360px",
          "max_height": "160px"
        }
      }
    ]
  }
}
\`\`\`
`;

const buildExportPayload = ({ book, page, pages }) => ({
  schema: 'teftele.booker.v1',
  exported_at: new Date().toISOString(),
  kind: page ? 'page' : book ? 'book' : 'library',
  book: book ? {
    id: book.id,
    title: book.title,
    description: book.description,
    visibility: book.visibility,
    structure_mode: book.structure_mode,
    cover_color: book.cover_color,
    cover_svg_url: book.cover_svg_url,
    cover_svg_text: book.cover_svg_text,
  } : null,
  page: page ? {
    id: page.id,
    book_id: page.book_id,
    title: page.title,
    slug: page.slug,
    visibility: page.visibility,
    sort_order: page.sort_order,
    blocks: (page.block_groups || []).map((group) => ({
      id: group.id,
      type: group.type,
      role: group.role,
      visibility: group.visibility,
      sort_order: group.sort_order,
      master_block_id: group.master_block_id,
      master_block: group.master_block,
    })),
  } : null,
  pages: page ? undefined : pages.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    visibility: item.visibility,
    sort_order: item.sort_order,
    block_groups_count: item.block_groups_count,
  })),
});

const parseImportPayload = (value) => {
  try {
    const parsed = JSON.parse(value);
    return {
      ok: parsed?.schema === 'teftele.booker.v1',
      parsed,
      message: parsed?.schema === 'teftele.booker.v1'
        ? `${parsed.kind || 'Unknown'} package is ready for the backend importer.`
        : 'Unknown schema. Expected teftele.booker.v1.',
    };
  } catch {
    return { ok: false, parsed: null, message: 'Invalid JSON.' };
  }
};

export const BookerSidenav = ({ collapsed, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const openBookEditor = useBookerStore((s) => s.openBookEditor);
  const [specOpen, setSpecOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importValue, setImportValue] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const isCollapsed = collapsed && !mobileOpen;
  const parts = location.pathname.split('/').filter(Boolean);
  const bookId = parts[0] === 'booker' && parts[1] && parts[1] !== 'library' ? parts[1] : null;
  const pageId = bookId ? parts[2] : null;
  const isPageMode = !!bookId && !!pageId;
  const { data: book } = useBook(bookId);
  const { data: currentPage } = usePage(pageId);
  const { data: books = [] } = useBooks({}, { enabled: !isPageMode && !isCollapsed });
  const { data: pages = [] } = usePages(bookId, { enabled: !!bookId && !isCollapsed });
  const exportValue = useMemo(
    () => JSON.stringify(buildExportPayload({ book, page: currentPage, pages }), null, 2),
    [book, currentPage, pages],
  );
  const importState = useMemo(() => parseImportPayload(importValue), [importValue]);

  const go = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleCreatePage = async () => {
    if (!bookId) return;

    try {
      const createdPage = await createBookerPage({
        book_id: bookId,
        title: 'New page',
        visibility: book?.visibility || 'private',
        sort_order: pages.length + 1,
      });

      await queryClient.invalidateQueries({ queryKey: ['bkr-pages', bookId] });
      await queryClient.invalidateQueries({ queryKey: ['bkr-books', bookId] });
      go(`/booker/${bookId}/${createdPage.id}`);
    } catch (error) {
      notifications.show({
        message: error?.response?.data?.message || error?.message || 'Could not create page',
        color: 'red',
      });
    }
  };

  const handleImportFiles = async (files) => {
    const list = Array.isArray(files) ? files : [files].filter(Boolean);
    if (!list.length) return;

    try {
      const nextValue = await filesToImportPayload(list, book?.title ? `${book.title} import` : 'Imported files');
      setImportValue(nextValue);
      notifications.show({ message: `${list.length} file${list.length === 1 ? '' : 's'} loaded`, color: 'blue' });
    } catch (error) {
      notifications.show({ message: error?.message || 'Could not read files', color: 'red' });
    }
  };

  const handleRunImport = async () => {
    if (!importState.ok || !importState.parsed || importBusy) return;

    setImportBusy(true);
    try {
      const pkg = importState.parsed;
      let targetBook = null;
      let firstPage = null;
      let createdPages = 0;
      let createdBlocks = 0;

      if (pkg.kind === 'book' || pkg.book) {
        targetBook = await createBookerBook({
          title: pkg.book?.title || 'Imported book',
          description: pkg.book?.description || '',
          visibility: IMPORT_VISIBILITY.has(pkg.book?.visibility) ? pkg.book.visibility : 'private',
          structure_mode: pkg.book?.structure_mode === 'flat' ? 'flat' : 'tree',
          cover_color: pkg.book?.cover_color || '#B5D4F4',
          cover_svg_url: pkg.book?.cover_svg_url || null,
          cover_svg_text: pkg.book?.cover_svg_text || null,
          sort_order: Number(pkg.book?.sort_order ?? 0),
          export_settings: pkg.book?.export_settings || null,
          meta: pkg.book?.meta || null,
        });
      } else if (bookId) {
        targetBook = book || { id: bookId };
      }

      if (!targetBook?.id) {
        notifications.show({ message: 'Open a book first or import a full book package', color: 'orange' });
        return;
      }

      const sourcePages = Array.isArray(pkg.pages) && pkg.pages.length
        ? pkg.pages
        : pkg.page
          ? [pkg.page]
          : [];

      if (!sourcePages.length) {
        notifications.show({ message: 'Import package has no pages', color: 'orange' });
        return;
      }

      for (const [pageIndex, sourcePage] of sourcePages.entries()) {
        const createdPage = await createBookerPage({
          book_id: targetBook.id,
          parent_id: sourcePage.parent_id || null,
          title: sourcePage.title || `Imported page ${pageIndex + 1}`,
          slug: sourcePage.slug || null,
          visibility: IMPORT_VISIBILITY.has(sourcePage.visibility) ? sourcePage.visibility : 'private',
          sort_order: Number(sourcePage.sort_order ?? pageIndex + 1),
          meta: sourcePage.meta || null,
        });

        createdPages += 1;
        firstPage ||= createdPage;
        const blocks = Array.isArray(sourcePage.blocks) ? sourcePage.blocks : [];
        await importBlocks(createdPage.id, blocks);
        createdBlocks += blocks.length;
      }

      await queryClient.invalidateQueries({ queryKey: ['bkr-books'] });
      await queryClient.invalidateQueries({ queryKey: ['bkr-pages'] });
      if (firstPage?.id) {
        await queryClient.invalidateQueries({ queryKey: ['bkr-page', firstPage.id] });
        navigate(`/booker/${targetBook.id}/${firstPage.id}`);
      }

      setImportOpen(false);
      notifications.show({
        message: `Imported ${createdPages} page${createdPages === 1 ? '' : 's'} and ${createdBlocks} block${createdBlocks === 1 ? '' : 's'}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        message: error?.response?.data?.message || error?.message || 'Import failed',
        color: 'red',
      });
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <Box className={`sections-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <Stack gap={0} pt={8} className="bkr-left-sidebar-content">
        <NavLink
          label={!isCollapsed && 'Library'}
          leftSection={<IconBooks size={16} />}
          active={location.pathname === '/booker/library'}
          onClick={() => go('/booker/library')}
        />
        {!isPageMode && (
          <NavLink
            label={!isCollapsed && 'New book'}
            leftSection={<IconPlus size={16} />}
            onClick={() => { openBookEditor(); onMobileClose?.(); }}
            variant="subtle"
            color="gray"
          />
        )}
        {!isCollapsed && (
          <>
            <Box my={8} mx={12} style={{ height: 1, background: 'var(--mantine-color-default-border)' }} />
            {isPageMode && book && (
              <Box
                className="bkr-sidebar-book-link"
                onClick={() => go(`/booker/${bookId}`)}
              >
                <IconBook size={16} />
                <Box style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Book</Text>
                  <Text size="sm" fw={500} truncate>{book.title}</Text>
                </Box>
              </Box>
            )}
            <Text px={12} py={4} size="xs" c="dimmed" tt="uppercase" fw={600}>
              {isPageMode ? 'Pages' : 'Books'}
            </Text>
            {(isPageMode ? pages : books).map((item) => (
              <NavLink
                key={item.id}
                label={item.title}
                description={isPageMode ? undefined : item.structure_mode}
                leftSection={isPageMode ? <IconFileText size={16} /> : <IconBook size={16} />}
                active={isPageMode ? item.id === pageId : item.id === bookId}
                onClick={() => go(isPageMode ? `/booker/${bookId}/${item.id}` : `/booker/${item.id}`)}
              />
            ))}
            {isPageMode && (
              <Button
                mt="auto"
                mx={8}
                mb={8}
                size="xs"
                variant="light"
                leftSection={<IconPlus size={13} />}
                onClick={handleCreatePage}
              >
                New page
              </Button>
            )}
          </>
        )}
      </Stack>
      <Group className="bkr-left-sidebar-tools" gap={4} justify={isCollapsed ? 'center' : 'space-between'} wrap="nowrap">
        <Menu withinPortal position="right-end" width={220}>
          <Menu.Target>
            <Tooltip label="Document tools" withArrow disabled={!isCollapsed}>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Document tools</Menu.Label>
            <Menu.Item leftSection={<IconFileText size={14} />} onClick={() => setSpecOpen(true)}>
              View import spec
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Export document" withArrow disabled={!isCollapsed}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setExportOpen(true)}>
            <IconDatabaseExport size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Import document" withArrow disabled={!isCollapsed}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setImportOpen(true)}>
            <IconDatabaseImport size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Modal opened={specOpen} onClose={() => setSpecOpen(false)} title="Booker import spec" size="760px" centered>
        <Stack gap="sm">
          <Textarea value={BOOKER_IMPORT_SPEC} minRows={18} autosize readOnly className="bkr-interop-textarea" />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Copy this spec and give it to an AI agent before generating Booker data.</Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconCopy size={14} />}
              onClick={() => navigator.clipboard.writeText(BOOKER_IMPORT_SPEC)}
            >
              Copy spec
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={exportOpen} onClose={() => setExportOpen(false)} title="Export Booker data" size="760px" centered>
        <Stack gap="sm">
          <Textarea value={exportValue} minRows={18} autosize readOnly className="bkr-interop-textarea" />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Exports current page when it is open, otherwise exports the current book index.
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconCopy size={14} />}
              onClick={() => navigator.clipboard.writeText(exportValue)}
            >
              Copy export
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Booker data"
        size="760px"
        centered
        classNames={{ content: 'bkr-import-modal', body: 'bkr-import-modal-body' }}
      >
        <Box className="bkr-import-modal-shell">
          <Stack className="bkr-import-modal-content" gap="sm">
            <FileInput
              label="Load from files"
              placeholder="Choose JSON, Markdown, text, code, or SVG files"
              multiple
              clearable
              accept=".json,.md,.markdown,.txt,.svg,.csv,.tsv,.js,.jsx,.ts,.tsx,.php,.css,.scss,.sql,.yaml,.yml,.html,.xml,.sh,.ps1,image/svg+xml,text/*,application/json"
              onChange={handleImportFiles}
            />
            <Textarea
              value={importValue}
              onChange={(event) => setImportValue(event.currentTarget.value)}
              placeholder="Paste teftele.booker.v1 JSON here..."
              minRows={12}
              className="bkr-interop-textarea bkr-import-textarea"
            />
          </Stack>
          <Group className="bkr-import-modal-footer" justify="space-between">
            <Text size="xs" c={importValue && !importState.ok ? 'red' : 'dimmed'}>
              {importValue ? importState.message : 'Paste a Booker package or load files to build one.'}
            </Text>
            <Button size="xs" variant="light" disabled={!importState.ok || importBusy} loading={importBusy} onClick={handleRunImport}>
              Run import
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
