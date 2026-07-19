import { useEffect, useRef } from 'react';
import { Button, Group, SegmentedControl, TextInput } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { FACT_KINDS } from '../../api/factorMocks';
import { useFactorStore } from '../../store/factorStore';

export const FactorToolbar = () => {
  const { kindFilter, setKindFilter, searchQuery, setSearchQuery, openFactEditor } = useFactorStore();
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="content-toolbar">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <TextInput
          ref={searchRef}
          size="xs"
          placeholder="Search facts"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          rightSection={searchQuery
            ? <IconX size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            : null}
          style={{ width: 210, maxWidth: '42vw' }}
        />
        <SegmentedControl
          size="xs"
          value={kindFilter}
          onChange={setKindFilter}
          data={FACT_KINDS.map((item) => ({ value: item.value, label: item.label }))}
        />
      </Group>
      <Button
        size="xs"
        color="blue"
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={() => openFactEditor()}
      >
        Fact
      </Button>
    </div>
  );
};
