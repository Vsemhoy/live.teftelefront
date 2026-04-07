import { Modal, Text, Group, Badge, Box, Divider, ActionIcon, Tooltip, Loader, Center, Stack } from '@mantine/core';
import { IconEdit, IconCalendar, IconFolder, IconTag } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useEventorStore } from '../../store/eventorStore';
import { useEvent } from '../../api/eventorApi';

// ---- Блок кода с кнопкой копирования ----
const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box style={{ position: 'relative', margin: '12px 0' }}>
      <Box
        component="button"
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 1,
          fontSize: 10, padding: '2px 8px',
          background: copied ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-5)',
          color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          transition: 'background 0.15s',
        }}
      >
        {copied ? '✓ Copied' : lang || 'code'}
      </Box>
      <SyntaxHighlighter
        style={oneLight}
        language={lang || 'text'}
        PreTag="div"
        showLineNumbers
        customStyle={{ fontSize: 13, margin: 0, borderRadius: 6, overflowX: 'auto' }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

// ---- Компоненты для читабельного рендеринга markdown ----
const readComponents = {
  h1: ({ children }) => (
    <Text component="h1" size="xl" fw={700} mt="md" mb={6} style={{ lineHeight: 1.3 }}>
      {children}
    </Text>
  ),
  h2: ({ children }) => (
    <Text component="h2" size="lg" fw={600} mt="md" mb={4} style={{ lineHeight: 1.3 }}>
      {children}
    </Text>
  ),
  h3: ({ children }) => (
    <Text component="h3" size="md" fw={600} mt={8} mb={2} style={{ lineHeight: 1.3 }}>
      {children}
    </Text>
  ),
  p: ({ children }) => (
    <Text size="sm" style={{ lineHeight: 1.75, marginBottom: 10 }} c="gray.8">
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Box component="ul" style={{ paddingLeft: 22, marginBottom: 10 }}>{children}</Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" style={{ paddingLeft: 22, marginBottom: 10 }}>{children}</Box>
  ),
  li: ({ children }) => (
    <Text component="li" size="sm" style={{ lineHeight: 1.7, marginBottom: 2 }} c="gray.8">
      {children}
    </Text>
  ),
  blockquote: ({ children }) => (
    <Box
      style={{
        borderLeft: '3px solid var(--mantine-color-blue-3)',
        paddingLeft: 14,
        margin: '10px 0',
        background: 'var(--mantine-color-blue-0)',
        borderRadius: '0 4px 4px 0',
        padding: '8px 14px',
      }}
    >
      {children}
    </Box>
  ),
  code({ inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang  = match?.[1];
    const code  = String(children).replace(/\n$/, '');

    if (!inline && match) return <CodeBlock lang={lang} code={code} />;

    return (
      <code style={{
        fontSize: 12.5,
        background: 'var(--mantine-color-gray-1)',
        border: '1px solid var(--mantine-color-gray-3)',
        padding: '1px 5px',
        borderRadius: 3,
        fontFamily: 'monospace',
      }}>
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <Box style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        {children}
      </table>
    </Box>
  ),
  th: ({ children }) => (
    <th style={{
      border: '1px solid var(--mantine-color-gray-3)',
      padding: '6px 12px',
      background: 'var(--mantine-color-gray-1)',
      fontWeight: 600,
      textAlign: 'left',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      border: '1px solid var(--mantine-color-gray-2)',
      padding: '5px 12px',
    }}>
      {children}
    </td>
  ),
  hr: () => <Divider my="md" />,
};

// ---- Основной компонент ----
export const ReadModal = () => {
  const { readerOpen, readerData, closeReader, openEditor } = useEventorStore();
  const { data: event, isLoading } = useEvent(readerData?.id);

  const typeColor = event?.type_bgcolor ? event.type_bgcolor.substring(0, 7) : null;

  const handleEdit = () => {
    closeReader();
    openEditor({ id: readerData?.id });
  };

  return (
    <Modal
      opened={readerOpen}
      onClose={closeReader}
      size="xl"
      padding={0}
      radius="md"
      styles={{
        header: { padding: '16px 20px 12px', borderBottom: '1px solid var(--mantine-color-gray-2)' },
        body:   { padding: 0 },
      }}
      title={
        isLoading || !event ? (
          <Text size="sm" c="dimmed">Loading…</Text>
        ) : (
          <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {typeColor && (
              <Box style={{
                width: 4, minWidth: 4, height: 20,
                borderRadius: 2,
                background: typeColor,
                flexShrink: 0,
              }} />
            )}
            <Text fw={700} size="md" style={{ flex: 1 }} lineClamp={1}>
              {event.name || <Text component="span" c="dimmed" fw={400} size="md">Untitled</Text>}
            </Text>
          </Group>
        )
      }
    >
      {isLoading || !event ? (
        <Center h={240}><Loader size="sm" /></Center>
      ) : (
        <>
          {/* Мета-строка */}
          <Group px={20} py={10} gap={16} style={{ background: 'var(--mantine-color-gray-0)', borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
            <Group gap={6}>
              <IconCalendar size={13} color="var(--mantine-color-gray-5)" />
              <Text size="xs" c="dimmed">
                {dayjs(event.setdate).format('D MMMM YYYY')}
              </Text>
            </Group>

            {event.section_name && (
              <Group gap={6}>
                <IconFolder size={13} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">{event.section_name}</Text>
              </Group>
            )}

            {event.type_name && (
              <Badge
                size="xs"
                variant="dot"
                color={typeColor ? undefined : 'gray'}
                style={typeColor ? { '--badge-dot-size': '7px', '--badge-color': typeColor } : {}}
              >
                {event.type_name}
              </Badge>
            )}

            <Box style={{ flex: 1 }} />

            <Tooltip label="Edit event" withArrow>
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={handleEdit}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Контент */}
          <Box
            px={28}
            py={20}
            style={{
              maxHeight: '65vh',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            className="read-modal-content"
          >
            {event.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={readComponents}>
                {event.content}
              </ReactMarkdown>
            ) : (
              <Center h={100}>
                <Text size="sm" c="dimmed">No content</Text>
              </Center>
            )}
          </Box>
        </>
      )}
    </Modal>
  );
};
