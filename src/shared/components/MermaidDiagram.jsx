import { useEffect, useRef, useState } from 'react';
import { Box, Text } from '@mantine/core';

// Ленивая загрузка mermaid — не тянем в основной бандл
let mermaidInstance = null;
let mermaidLoading = false;
const mermaidCallbacks = [];

const loadMermaid = () => {
  return new Promise((resolve) => {
    if (mermaidInstance) { resolve(mermaidInstance); return; }
    mermaidCallbacks.push(resolve);
    if (mermaidLoading) return;
    mermaidLoading = true;
    import('mermaid').then((mod) => {
      mermaidInstance = mod.default;
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: 'neutral',
        // Компактный вид
        themeVariables: {
          fontSize: '13px',
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        },
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence:  { useMaxWidth: true },
      });
      mermaidCallbacks.forEach((cb) => cb(mermaidInstance));
      mermaidCallbacks.length = 0;
    });
  });
};

// Счётчик для уникальных id диаграмм
let diagramCounter = 0;

export const MermaidDiagram = ({ code }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);
  // Уникальный id для каждого инстанса
  const idRef = useRef(`mermaid-${++diagramCounter}`);

  useEffect(() => {
    if (!code?.trim()) return;
    let cancelled = false;

    const render = async () => {
      try {
        const m = await loadMermaid();
        if (cancelled) return;

        const { svg } = await m.render(idRef.current, code.trim());
        if (cancelled) return;

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Делаем SVG адаптивным
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.removeAttribute('width');
          }
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Diagram render error');
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <Box style={{
        background: 'var(--mantine-color-red-0)',
        border: '1px solid var(--mantine-color-red-2)',
        borderRadius: 4, padding: '8px 12px',
      }}>
        <Text size="xs" c="red.7" ff="monospace">Mermaid error: {error}</Text>
        <Text size="xs" c="dimmed" mt={4} ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>{code}</Text>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      style={{
        margin: '8px 0',
        textAlign: 'center',
        // Пока не отрендерилось — показываем заглушку нужной высоты
        minHeight: rendered ? undefined : 40,
        background: rendered ? undefined : 'var(--mantine-color-gray-0)',
        borderRadius: 4,
      }}
    />
  );
};
