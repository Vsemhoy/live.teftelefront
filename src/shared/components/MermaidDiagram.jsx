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
        themeVariables: {
          fontSize: '13px',
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        },
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence:  { useMaxWidth: true },
      });
      mermaidCallbacks.forEach((cb) => cb(mermaidInstance));
      mermaidCallbacks.length = 0;
    }).catch(() => {
      // Если mermaid вообще не загрузился — резолвим null
      mermaidCallbacks.forEach((cb) => cb(null));
      mermaidCallbacks.length = 0;
    });
  });
};

let diagramCounter = 0;

export const MermaidDiagram = ({ code }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);
  const idRef = useRef(`mermaid-${++diagramCounter}`);

  useEffect(() => {
    if (!code?.trim()) return;
    let cancelled = false;

    const render = async () => {
      try {
        const m = await loadMermaid();
        if (cancelled || !m) return;

        const { svg } = await m.render(idRef.current, code.trim());
        if (cancelled) return;

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
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
          // Тихая ошибка — не крашим страницу, просто показываем код
          setError(err?.message || 'render error');
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code]);

  // Тихий fallback — показываем код как preformatted без красного баннера
  if (error) {
    return (
      <Box
        component="pre"
        style={{
          fontSize: 12,
          fontFamily: 'monospace',
          background: 'var(--mantine-color-gray-0)',
          border: '1px solid var(--mantine-color-gray-2)',
          borderRadius: 4,
          padding: '8px 10px',
          margin: '6px 0',
          overflowX: 'auto',
          color: 'var(--mantine-color-gray-6)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {code}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      style={{
        margin: '8px 0',
        textAlign: 'center',
        minHeight: rendered ? undefined : 40,
        background: rendered ? undefined : 'var(--mantine-color-gray-0)',
        borderRadius: 4,
      }}
    />
  );
};
