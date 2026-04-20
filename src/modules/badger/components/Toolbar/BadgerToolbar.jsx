import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconLayoutColumns } from '@tabler/icons-react';
import { useBadgerStore } from '../../store/badgerStore';
import { BadgerRangePicker } from '../BadgerRangePicker/BadgerRangePicker';

const C = 'green';

export const BadgerToolbar = () => {
  const { balanceMode, toggleBalanceMode } = useBadgerStore();

  return (
    <div className="content-toolbar">
      <Group px={12} py={6} gap={6} justify="space-between" wrap="nowrap">

        <BadgerRangePicker showModeSwitch />

        <Tooltip label={balanceMode === 'basic' ? 'Extended balance' : 'Basic balance'}>
          <ActionIcon
            variant={balanceMode === 'extended' ? 'light' : 'subtle'}
            color={C}
            size="sm"
            onClick={toggleBalanceMode}
          >
            <IconLayoutColumns size={15} />
          </ActionIcon>
        </Tooltip>

      </Group>
    </div>
  );
};
