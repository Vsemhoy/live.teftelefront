import { Group, SegmentedControl } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { BadgerRangePicker } from '../BadgerRangePicker/BadgerRangePicker';

const C = 'green';

export const BadgerStatsToolbar = ({ currencies = [], activeCurrency, onCurrencyChange }) => {
  return (
    <div className="content-toolbar">
      <Group px={12} py={6} gap={6} justify="space-between" wrap="nowrap">

        <BadgerRangePicker showModeSwitch />

        {currencies.length > 1 && (
          <SegmentedControl
            value={activeCurrency}
            onChange={onCurrencyChange}
            size="xs"
            color={C}
            data={currencies.map((c) => ({ label: c, value: c }))}
          />
        )}

      </Group>
    </div>
  );
};
