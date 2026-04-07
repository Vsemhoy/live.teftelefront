import { useState } from 'react';
import { Paper, Text, Group, Box, Tooltip } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEventorStore } from '../../store/eventorStore';

const TRIM_LENGTH = 600;
const trimContent = (c) => c.length > TRIM_LENGTH ? c.substring(0, TRIM_LENGTH) + '…' : c;

const CodeBlock = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Box style={{ position: 'relative' }}>
      <Box component="button" onClick={async () => {
          await navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true); setTimeout(() => setCopied(false), 2000);
        }}
        style={{ position: 'absolute', top: 4, right: 4, zIndex: 1, fontSize: 10, padding: '1px 6px', background: copied ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-6)', color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {copied ? 'Copied' : lang || 'code'}
      </Box>
      <SyntaxHighlighter style={oneLight} language={lang || 'text'} PreTag="div"
        showLineNumbers wrapLines customStyle={{ fontSize: 12, margin: 0, borderRadius: 4 }}>
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

const mdComponents = {
  code({ inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match?.[1];
    const code = String(children).replace(/\n$/, '');
    if (!inline && match) return <CodeBlock lang={lang} code={code} />;
    return <code style={{ fontSize: 12, background: 'var(--mantine-color-gray-1)', padding: '1px 4px', borderRadius: 2 }}>{children}</code>;
  },
};

export const EventCard = ({ event, isDraft = false }) => {
  const { openReader } = useEventorStore();

  const typeColor = event.type_bgcolor ? event.type_bgcolor.substring(0, 7) : null;

  // Двойной клик → просмотр (reader)
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isDraft) {
      openReader({ draft: { ...event } });
    } else {
      openReader({ id: event.id, event });
    }
  };

  return (
    <Paper
      className="event-card"
      shadow="none"
      p={10}
      withBorder
      onDoubleClick={handleDoubleClick}
      title="Double-click to view"
      style={{
        borderLeftColor: typeColor || 'var(--mantine-color-gray-3)',
        borderLeftWidth: 3,
        userSelect: 'none',
      }}
    >
      <Group justify="space-between" mb={event.name ? 4 : 0} wrap="nowrap">
        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {isDraft && <span className="draft-badge">Draft</span>}
          {event.is_locked && (
            <Tooltip label="Locked"><IconLock size={12} color="var(--mantine-color-gray-5)" /></Tooltip>
          )}
          {event.name && (
            <Text size="sm" fw={600} truncate style={{ flex: 1 }}>{event.name}</Text>
          )}
        </Group>
      </Group>

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
