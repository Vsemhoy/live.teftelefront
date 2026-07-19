import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Badge, Button, Group, Modal, SegmentedControl, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy, IconEdit, IconEye, IconEyeOff, IconX } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MdFull } from '@/shared/components/MdRenderer';
import { useFactorStore } from '../../store/factorStore';

const modeOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'large', label: 'Large' },
  { value: 'qr', label: 'QR' },
  { value: 'source', label: 'Source' },
];

const QR_MAX_BYTES = 1200;
const LARGE_TEXT_MAX_FONT = 220;
const LARGE_TEXT_MIN_FONT = 28;

const formatMode = (fact) => {
  if (fact.display_mode && !['plain', 'masked'].includes(fact.display_mode)) return fact.display_mode;
  if (fact.format === 'markdown') return 'article';
  if (fact.format === 'code') return 'snippet';
  if (fact.format === 'command') return 'terminal';
  if (fact.format === 'number') return 'metric';
  if (fact.format === 'svg') return 'preview';
  return fact.display_mode || 'plain';
};

const maskedValue = (value) => String(value || '').replace(/[^\s]/g, '*');

const byteLength = (value) => new Blob([String(value || '')]).size;

const isSolidText = (value) => {
  const text = String(value || '');
  return text.length > 5 && !/\s/.test(text);
};

const canWrapLargeText = (value) => {
  const text = String(value || '').trim();
  return text.length > 24 && /\s/.test(text);
};

const chunkText = (value, size) => {
  const text = String(value || '');
  if (!size || size >= text.length) return text;
  return text.match(new RegExp(`.{1,${size}}`, 'g'))?.join('\n') || text;
};

const LargeText = ({ value }) => {
  const wrapperRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(LARGE_TEXT_MAX_FONT);
  const [chunkSize, setChunkSize] = useState(String(value || '').length || 1);
  const canChunk = isSolidText(value);
  const canWrap = canWrapLargeText(value);
  const displayValue = canChunk ? chunkText(value, chunkSize) : value;

  useEffect(() => {
    setChunkSize(String(value || '').length || 1);
  }, [value]);

  useLayoutEffect(() => {
    let frame = 0;

    const fit = () => {
      const wrapper = wrapperRef.current;
      const text = textRef.current;
      if (!wrapper || !text) return;

      const grouped = canChunk && chunkSize < String(value || '').length;
      text.style.whiteSpace = grouped ? 'pre-line' : canWrap ? 'normal' : 'nowrap';
      text.style.fontSize = `${LARGE_TEXT_MAX_FONT}px`;

      const wrapperRect = wrapper.getBoundingClientRect();
      if (wrapperRect.width < 40 || wrapperRect.height < 40) return;

      let low = LARGE_TEXT_MIN_FONT;
      let high = LARGE_TEXT_MAX_FONT;
      let nextSize = LARGE_TEXT_MIN_FONT;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        text.style.fontSize = `${mid}px`;

        const textRect = text.getBoundingClientRect();
        const fits = textRect.width <= wrapperRect.width && textRect.height <= wrapperRect.height;

        if (fits) {
          nextSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      text.style.fontSize = `${nextSize}px`;
      setFontSize(nextSize);
    };

    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(fit);
    });

    const observer = new ResizeObserver(fit);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    if (textRef.current) observer.observe(textRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [canChunk, chunkSize, displayValue, value]);

  return (
    <div className="fact-viewer-large-wrap">
      <div ref={wrapperRef} className="fact-viewer-large">
        <span
          ref={textRef}
          style={{
            fontSize,
            whiteSpace: canChunk && chunkSize < String(value || '').length ? 'pre-line' : canWrap ? 'normal' : 'nowrap',
          }}
        >
          {displayValue}
        </span>
      </div>
      {canChunk && (
        <div className="fact-viewer-chunker">
          <Group justify="space-between" gap={10} wrap="nowrap">
            <Text size="xs" c="dimmed">Group by</Text>
            <Text size="xs" fw={650}>{chunkSize}</Text>
          </Group>
          <Slider
            min={1}
            max={String(value || '').length}
            value={chunkSize}
            onChange={setChunkSize}
            size="xs"
            color="blue"
          />
        </div>
      )}
    </div>
  );
};

const FactRenderer = ({ fact, mode, revealed }) => {
  const value = String(fact.value || '');
  const renderMode = mode === 'auto' ? formatMode(fact) : mode;
  const hidden = fact.is_sensitive && !revealed;
  const visibleValue = hidden ? maskedValue(value) : value;

  if (renderMode === 'qr') {
    const bytes = byteLength(value);
    if (bytes > QR_MAX_BYTES) {
      return (
        <div className="fact-viewer-qr-unavailable">
          <Text fw={750} size="xl">QR is too large</Text>
          <Text size="sm" c="dimmed" ta="center">
            This value is {bytes} bytes. The current QR viewer limit is {QR_MAX_BYTES} bytes.
          </Text>
        </div>
      );
    }

    return (
      <div className="fact-viewer-qr">
        <QRCodeSVG value={value || ' '} size={320} includeMargin level="M" />
        <Text size="sm" c="dimmed" ta="center">{hidden ? 'Sensitive value is hidden above, QR still contains the real value.' : visibleValue}</Text>
      </div>
    );
  }

  if (renderMode === 'large') {
    return <LargeText value={visibleValue} />;
  }

  if (renderMode === 'metric') {
    return (
      <div className="fact-viewer-metric">
        <span>{visibleValue}</span>
        {fact.unit && <em>{fact.unit}</em>}
      </div>
    );
  }

  if (renderMode === 'article') {
    return hidden ? <LargeText value={visibleValue} /> : <div className="fact-viewer-article"><MdFull content={value} /></div>;
  }

  if (renderMode === 'snippet' || renderMode === 'terminal' || renderMode === 'source') {
    return (
      <div className={renderMode === 'terminal' ? 'fact-viewer-terminal' : 'fact-viewer-code'}>
        <SyntaxHighlighter
          style={oneLight}
          language={fact.language || (fact.format === 'command' ? 'bash' : 'text')}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 8, fontSize: 15, minHeight: renderMode === 'source' ? 360 : undefined }}
        >
          {visibleValue}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (renderMode === 'preview' && fact.format === 'svg' && !hidden) {
    const srcDoc = `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:white">${value}</body>`;
    return (
      <div className="fact-viewer-svg">
        <iframe title={fact.label} sandbox="" srcDoc={srcDoc} />
      </div>
    );
  }

  return <div className="fact-viewer-plain">{visibleValue}</div>;
};

export const FactViewer = () => {
  const { factViewerOpen, factViewerParams, closeFactViewer, openFactEditor } = useFactorStore();
  const [mode, setMode] = useState('auto');
  const [revealed, setRevealed] = useState(false);
  const fact = factViewerParams;

  const badges = useMemo(() => {
    if (!fact) return [];
    return [
      fact.kind,
      fact.format,
      fact.display_mode,
      fact.is_sensitive ? 'sensitive' : null,
      fact.is_expert ? 'expert' : null,
      fact.valid_to ? 'expired' : null,
    ].filter(Boolean);
  }, [fact]);

  if (!fact) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fact.value || '');
    notifications.show({ message: 'Value copied', color: 'cyan' });
  };

  const handleEdit = () => {
    closeFactViewer();
    openFactEditor(fact);
  };

  return (
    <Modal
      opened={factViewerOpen}
      onClose={closeFactViewer}
      fullScreen
      withCloseButton={false}
      padding={0}
      classNames={{ content: 'fact-viewer-modal', body: 'fact-viewer-body' }}
    >
      <div className="fact-viewer-shell">
        <header className="fact-viewer-header">
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text fw={750} size="lg" truncate>{fact.label}</Text>
            <Group gap={6}>
              {badges.map((badge) => <Badge key={badge} size="xs" variant="light" color={badge === 'sensitive' ? 'red' : 'blue'}>{badge}</Badge>)}
            </Group>
          </Stack>

          <Group gap={8} wrap="nowrap">
            <SegmentedControl size="xs" value={mode} onChange={setMode} data={modeOptions} />
            {fact.is_sensitive && (
              <Tooltip label={revealed ? 'Hide value' : 'Reveal value'} withArrow>
                <ActionIcon variant="subtle" color={revealed ? 'red' : 'gray'} onClick={() => setRevealed((value) => !value)}>
                  {revealed ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Copy value" withArrow>
              <ActionIcon variant="subtle" color="cyan" onClick={handleCopy}><IconCopy size={18} /></ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" withArrow>
              <ActionIcon variant="subtle" color="gray" onClick={handleEdit}><IconEdit size={18} /></ActionIcon>
            </Tooltip>
            <ActionIcon variant="subtle" color="gray" onClick={closeFactViewer}><IconX size={20} /></ActionIcon>
          </Group>
        </header>

        {fact.context && <Text className="fact-viewer-context" size="sm" c="dimmed">{fact.context}</Text>}

        <main className="fact-viewer-content">
          <FactRenderer fact={fact} mode={mode} revealed={revealed} />
        </main>

        <footer className="fact-viewer-footer">
          <Button variant="outline" color="blue" leftSection={<IconCopy size={16} />} onClick={handleCopy}>Copy</Button>
          <Button variant="default" onClick={closeFactViewer}>Close</Button>
        </footer>
      </div>
    </Modal>
  );
};
