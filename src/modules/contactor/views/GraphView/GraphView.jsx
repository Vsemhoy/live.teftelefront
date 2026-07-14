import { Box, Group, Text } from '@mantine/core';
import { useContactGraph } from '../../api/contactorApi';
import { GraphView as GraphViewComponent } from '../../components/GraphView/GraphView';

export const GraphView = () => {
  const { contacts, relations } = useContactGraph();

  return (
    <Box className="content-scroll" p={16}>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={700}>Relation graph</Text>
        <Text size="xs" c="dimmed">{contacts.length} nodes · {relations.length} links</Text>
      </Group>
      <GraphViewComponent contacts={contacts} relations={relations} />
    </Box>
  );
};
