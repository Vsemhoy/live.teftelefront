import { useCallback, useState } from 'react';
import { Box, Button, Group, Text } from '@mantine/core';
import { IconPencil, IconCheck } from '@tabler/icons-react';

// Excalidraw грузится лениво — тяжёлый пакет
let ExcalidrawComponent = null;

const loadExcalidraw = async () => {
  if (ExcalidrawComponent) return ExcalidrawComponent;
  const mod = await import('@excalidraw/excalidraw');
  ExcalidrawComponent = mod.Excalidraw;
  return ExcalidrawComponent;
};

export const ExcalidrawBlock = ({ block, isEditing, onChange }) => {
  const content = block.content || {};
  const [Excalidraw, setExcalidraw] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartEdit = async () => {
    if (!Excalidraw) {
      setLoading(true);
      const C = await loadExcalidraw();
      setExcalidraw(() => C);
      setLoading(false);
    }
  };

  // При первом рендере в режиме редактирования — грузим либу
  if (isEditing && !Excalidraw && !loading) {
    handleStartEdit();
  }

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) return;
    const { exportToSvg } = await import('@excalidraw/excalidraw');
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const svgEl = await exportToSvg({ elements, appState });
    const svg = svgEl.outerHTML;
    onChange?.({ scene: { elements, appState }, svg });
  }, [excalidrawAPI, onChange]);

  // Режим просмотра — просто SVG
  if (!isEditing) {
    if (content.svg) {
      return (
        <Box
          className="booker-excalidraw-preview"
          dangerouslySetInnerHTML={{ __html: content.svg }}
        />
      );
    }
    return (
      <Box
        px="xs"
        py={16}
        style={{
          background: 'var(--mantine-color-gray-0)',
          borderRadius: 6,
          textAlign: 'center',
        }}
      >
        <Text size="xs" c="dimmed">Empty drawing</Text>
      </Box>
    );
  }

  // Режим редактирования
  if (loading) {
    return (
      <Box p="md" ta="center">
        <Text size="xs" c="dimmed">Loading Excalidraw...</Text>
      </Box>
    );
  }

  if (!Excalidraw) {
    return (
      <Box p="md" ta="center">
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPencil size={13} />}
          onClick={handleStartEdit}
        >
          Open drawing editor
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box style={{ height: 400, borderRadius: 6, overflow: 'hidden' }}>
        <Excalidraw
          ref={setExcalidrawAPI}
          initialData={content.scene ?? null}
          UIOptions={{ canvasActions: { export: false, loadScene: false } }}
        />
      </Box>
      <Group justify="flex-end" p={6}>
        <Button
          size="xs"
          leftSection={<IconCheck size={13} />}
          onClick={handleSave}
        >
          Save drawing
        </Button>
      </Group>
    </Box>
  );
};
