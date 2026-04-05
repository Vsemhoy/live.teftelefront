import { useState } from 'react';
import { Paper, Text, Group, Badge, ActionIcon, Box, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash, IconLock } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEventorStore } from '../../store/eventorStore';

// Обрезаем контент для превью
const TRIM_LENGTH = 600;
const trimContent = (content) =>
  content.length > TRIM_LENGTH ? content.substring(0, TRIM_LENGTH) + '…' : content;

// Компонент кода с кнопкой копирования
const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box style={{ position: 'relative' }}>
      <Box
        component="button"
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 4, right: 4, zIndex: 1,
          fontSize: 10, padding: '1px 6px',
          background: copied ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-6)',
          color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        {copied ? 'Copied' : lang || 'code'}
      </Box>
      <SyntaxHighlighter
        style={oneLight}
        language={lang || 'text'}
        PreTag="div"
        showLineNumbers
        wrapLines
        customStyle={{ fontSize: 12, margin: 0, borderRadius: 4 }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

// Компоненты для ReactMarkdown
const mdComponents = {
  code({ node, inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match?.[1];
    const code = String(children).replace(/\n$/, '');

    if (!inline && match) {
      return <CodeBlock lang={lang} code={code} />;
    }
    return (
      <code style={{
        fontSize: 12,
        background: 'var(--mantine-color-gray-1)',
        padding: '1px 4px',
        borderRadius: 2,
      }}>
        {children}
      </code>
    );
  },
};

export const EventCard = ({ event, isDraft = false }) => {
  const { openEditor } = useEventorStore();

  // Цвет типа (если есть)
  const typeColor = event.type_bgcolor
    ? event.type_bgcolor.substring(0, 7)
    : null;

  const handleEdit = (e) => {
    e.stopPropagation();
    openEditor({ id: isDraft ? null : event.id, draftLocalId: isDraft ? event.localId : null });
  };

  return (
    <Paper
      className="event-card"
      shadow="none"
      p={10}
      withBorder
      style={{
        borderLeftColor: typeColor || 'var(--mantine-color-gray-3)',
        borderLeftWidth: 3,
      }}
    >
      {/* Заголовок + действия */}
      <Group justify="space-between" mb={event.name ? 4 : 0} wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isDraft && (
            <span className="draft-badge">Draft</span>
          )}
          {event.is_locked && (
            <Tooltip label="Locked">
              <IconLock size={12} color="var(--mantine-color-gray-5)" />
            </Tooltip>
          )}
          {event.name && (
            <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
              {event.name}
            </Text>
          )}
        </Group>

        {/* Кнопки — появляются при ховере через CSS */}
        <Group gap={4} className="flow-add-btn">
          <ActionIcon variant="subtle" color="gray" size="xs" onClick={handleEdit}>
            <IconEdit size={12} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Контент — markdown */}
      {event.content && (
        <Box className="md-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {trimContent(event.content)}
          </ReactMarkdown>
        </Box>
      )}
    </Paper>
  );
};
