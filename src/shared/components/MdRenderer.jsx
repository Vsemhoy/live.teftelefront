import { useState, useMemo } from 'react';
import { Box, Text, Divider } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MermaidDiagram } from './MermaidDiagram';

// ---- Блок кода с кнопкой копирования ----
const CodeBlock = ({ lang, code, compact }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Box style={{ position: 'relative', margin: compact ? '4px 0' : '12px 0' }}>
      <Box component="button"
        onClick={async () => {
          await navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 1,
          fontSize: 10, padding: '2px 8px',
          background: copied ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-5)',
          color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background 0.15s',
        }}>
        {copied ? '✓ Copied' : lang || 'code'}
      </Box>
      <SyntaxHighlighter style={oneLight} language={lang || 'text'} PreTag="div"
        showLineNumbers={!compact}
        customStyle={{ fontSize: compact ? 12 : 13, margin: 0, borderRadius: 6, overflowX: 'auto' }}>
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

// ---- Стили таблиц (статичные объекты — не пересоздаём) ----
const TH_STYLE = {
  border: '1px solid var(--mantine-color-gray-3)',
  padding: '6px 12px',
  background: 'var(--mantine-color-gray-1)',
  fontWeight: 600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
const TD_STYLE = {
  border: '1px solid var(--mantine-color-gray-2)',
  padding: '5px 12px',
};
const TABLE_STYLE = {
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: 13,
};

// ---- Компоненты COMPACT (превью карточки) ---- статичные объекты!
// Вынесены из рендер-цикла — React-markdown кешируется корректно
const COMPACT_COMPONENTS = {
  h1: ({ children }) => <Text component="h1" fw={700} mt={4} mb={2} style={{ fontSize: 14, lineHeight: 1.3 }}>{children}</Text>,
  h2: ({ children }) => <Text component="h2" fw={600} mt={4} mb={2} style={{ fontSize: 13, lineHeight: 1.3 }}>{children}</Text>,
  h3: ({ children }) => <Text component="h3" fw={600} mt={2} mb={1} style={{ fontSize: 13, lineHeight: 1.3 }}>{children}</Text>,
  p:  ({ children }) => <Text size="xs" style={{ lineHeight: 1.5, marginBottom: 4 }} c="gray.8">{children}</Text>,
  ul: ({ children }) => <Box component="ul" style={{ paddingLeft: 20, marginBottom: 4 }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" style={{ paddingLeft: 20, marginBottom: 4 }}>{children}</Box>,
  li: ({ children }) => <Text component="li" size="xs" style={{ lineHeight: 1.6, marginBottom: 1 }} c="gray.8">{children}</Text>,
  blockquote: ({ children }) => (
    <Box style={{ borderLeft: '3px solid var(--mantine-color-blue-3)', margin: '4px 0', background: 'var(--mantine-color-blue-0)', borderRadius: '0 4px 4px 0', padding: '4px 10px' }}>{children}</Box>
  ),
  // Таблицы
  table: ({ children }) => (
    <Box style={{ overflowX: 'auto', marginBottom: 6 }}>
      <table style={TABLE_STYLE}>{children}</table>
    </Box>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:   ({ children }) => <tr>{children}</tr>,
  th:   ({ children }) => <th style={TH_STYLE}>{children}</th>,
  td:   ({ children }) => <td style={TD_STYLE}>{children}</td>,
  hr: () => <Divider my="xs" />,
  code({ inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang  = match?.[1];
    const code  = String(children).replace(/\n$/, '');
    if (!inline && lang === 'mermaid') return <MermaidDiagram code={code} />;
    if (!inline && match) return <CodeBlock lang={lang} code={code} compact />;
    return <code style={{ fontSize: 11, background: 'var(--mantine-color-gray-1)', border: '1px solid var(--mantine-color-gray-3)', padding: '1px 4px', borderRadius: 3, fontFamily: 'monospace' }}>{children}</code>;
  },
};

// ---- Компоненты FULL (ReadModal) ---- тоже статичные
const FULL_COMPONENTS = {
  h1: ({ children }) => <Text component="h1" fw={700} mt="md" mb={6} style={{ fontSize: 22, lineHeight: 1.3 }}>{children}</Text>,
  h2: ({ children }) => <Text component="h2" fw={600} mt="md" mb={4} style={{ fontSize: 18, lineHeight: 1.3 }}>{children}</Text>,
  h3: ({ children }) => <Text component="h3" fw={600} mt={8} mb={2} style={{ fontSize: 16, lineHeight: 1.3 }}>{children}</Text>,
  p:  ({ children }) => <Text size="sm" style={{ lineHeight: 1.75, marginBottom: 10 }} c="gray.8">{children}</Text>,
  ul: ({ children }) => <Box component="ul" style={{ paddingLeft: 22, marginBottom: 10 }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" style={{ paddingLeft: 22, marginBottom: 10 }}>{children}</Box>,
  li: ({ children }) => <Text component="li" size="sm" style={{ lineHeight: 1.7, marginBottom: 2 }} c="gray.8">{children}</Text>,
  blockquote: ({ children }) => (
    <Box style={{ borderLeft: '3px solid var(--mantine-color-blue-3)', margin: '10px 0', background: 'var(--mantine-color-blue-0)', borderRadius: '0 4px 4px 0', padding: '8px 14px' }}>{children}</Box>
  ),
  // Таблицы
  table: ({ children }) => (
    <Box style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table style={TABLE_STYLE}>{children}</table>
    </Box>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:   ({ children }) => <tr>{children}</tr>,
  th:   ({ children }) => <th style={TH_STYLE}>{children}</th>,
  td:   ({ children }) => <td style={TD_STYLE}>{children}</td>,
  hr: () => <Divider my="md" />,
  code({ inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang  = match?.[1];
    const code  = String(children).replace(/\n$/, '');
    if (!inline && lang === 'mermaid') return <MermaidDiagram code={code} />;
    if (!inline && match) return <CodeBlock lang={lang} code={code} compact={false} />;
    return <code style={{ fontSize: 12.5, background: 'var(--mantine-color-gray-1)', border: '1px solid var(--mantine-color-gray-3)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>{children}</code>;
  },
};

// ---- Публичные компоненты ----

const TRIM_LENGTH = 800;
const MAX_PREVIEW_LINES = 10;

const trimPreviewContent = (content) => {
  if (!content) return '';

  let trimmed = content.length > TRIM_LENGTH
    ? content.substring(0, TRIM_LENGTH)
    : content;

  const lines = trimmed.split(/\r?\n/);
  if (lines.length > MAX_PREVIEW_LINES) {
    trimmed = lines.slice(0, MAX_PREVIEW_LINES).join('\n');
  }

  if (trimmed.length < content.length || lines.length > MAX_PREVIEW_LINES) {
    trimmed = `${trimmed}\n\n…`;
  }

  return trimmed;
};

/** Компактный превью для карточки */
export const MdPreview = ({ content }) => {
  if (!content) return null;
  const trimmed = trimPreviewContent(content);
  return (
    <Box className="md-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPACT_COMPONENTS}>
        {trimmed}
      </ReactMarkdown>
    </Box>
  );
};

/** Полный рендер для ReadModal */
export const MdFull = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={FULL_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
};
