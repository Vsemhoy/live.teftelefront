import { useState, useMemo } from 'react';
import {
  Modal, Stack, Group, Text, Select, NumberInput,
  Button, Divider, Badge, Box, SegmentedControl,
  ScrollArea, Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCopy, IconCheck, IconX, IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useLedgerStore } from '../../store/ledgerStore';
import { useSaveTransaction } from '../../api/ledgerApi';
import { formatMoney, toMajor } from '../../utils/ledgerUtils';

dayjs.extend(isSameOrBefore);

const FREQUENCY_OPTIONS = [
  { value: 'daily',     label: 'Каждый день' },
  { value: 'weekly',    label: 'Каждую неделю' },
  { value: 'biweekly',  label: 'Каждые 2 недели' },
  { value: 'monthly',   label: 'Каждый месяц' },
  { value: 'yearly',    label: 'Каждый год' },
];

// Генерируем массив дат по заданным параметрам
function generateDates(startDate, frequency, count) {
  const dates = [];
  let current = dayjs(startDate);

  for (let i = 0; i < count; i++) {
    // Для monthly — пропускаем если день не существует в месяце
    if (frequency === 'monthly') {
      const targetDay = dayjs(startDate).date();
      const daysInMonth = current.daysInMonth();
      if (targetDay > daysInMonth) {
        // Пропускаем месяц — добавляем следующий
        current = current.add(1, 'month');
        i--; // не считаем этот шаг
        if (dates.length + (count - i) > count * 3) break; // защита от бесконечного цикла
        continue;
      }
    }

    dates.push(current.format('YYYY-MM-DD'));

    switch (frequency) {
      case 'daily':    current = current.add(1, 'day');    break;
      case 'weekly':   current = current.add(1, 'week');   break;
      case 'biweekly': current = current.add(2, 'weeks');  break;
      case 'monthly':  current = current.add(1, 'month');  break;
      case 'yearly':   current = current.add(1, 'year');   break;
      default: break;
    }
  }

  return dates;
}

// Считаем сумму с инкрементом
function calcAmount(baseAmount, index, incrementType, incrementValue) {
  if (!incrementValue) return baseAmount;
  const inc = incrementType === 'percent'
    ? Math.round(baseAmount * incrementValue / 100)
    : Math.round(incrementValue * 100); // валюта → копейки
  return Math.max(1, baseAmount + inc * index);
}

export const DuplicateModal = () => {
  const { duplicatorOpen, duplicatorTx, closeDuplicator } = useLedgerStore();
  const saveTransaction = useSaveTransaction();

  const [frequency,      setFrequency]      = useState('monthly');
  const [startDate,      setStartDate]      = useState(null);
  const [count,          setCount]          = useState(12);
  const [incrementType,  setIncrementType]  = useState('currency'); // 'currency' | 'percent'
  const [incrementValue, setIncrementValue] = useState(0);
  const [isSaving,       setIsSaving]       = useState(false);

  const tx = duplicatorTx;

  // Предпросмотр дат и сумм
  const preview = useMemo(() => {
    if (!tx || !startDate) return [];
    const dates = generateDates(startDate, frequency, count);
    return dates.map((date, i) => ({
      date,
      amount: calcAmount(tx.amount, i, incrementType, incrementValue),
    }));
  }, [tx, startDate, frequency, count, incrementType, incrementValue]);

  const handleCreate = async () => {
    if (!tx || preview.length === 0) return;
    setIsSaving(true);

    const { id: _id, created_at, updated_at, deleted_at, ...rest } = tx;

    let successCount = 0;
    let errorCount   = 0;

    for (const { date, amount } of preview) {
      try {
        await saveTransaction.mutateAsync({
          ...rest,
          occurred_at: date,
          month_key:   date.slice(0, 7),
          amount,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsSaving(false);

    if (errorCount === 0) {
      notifications.show({
        message: `Создано ${successCount} транзакций`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      closeDuplicator();
    } else {
      notifications.show({
        message: `Создано ${successCount}, ошибок: ${errorCount}`,
        color: 'orange',
      });
    }
  };

  if (!tx) return null;

  const totalAmount = preview.reduce((s, p) => s + p.amount, 0);

  return (
    <Modal
      opened={duplicatorOpen}
      onClose={closeDuplicator}
      title={
        <Group gap={8}>
          <IconCopy size={16} />
          <Text fw={600} size="sm">Дублировать транзакцию</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap={14}>
        {/* Исходная транзакция */}
        <Box p={10} style={{
          background: 'var(--mantine-color-gray-0)',
          borderRadius: 8,
          border: '1px solid var(--mantine-color-gray-2)',
        }}>
          <Group justify="space-between">
            <Text size="sm" fw={500}>{tx.title || '—'}</Text>
            <Text size="sm" fw={700}>{formatMoney(tx.amount)}</Text>
          </Group>
          <Text size="xs" c="dimmed">{tx.occurred_at} · {tx.flow_kind}</Text>
        </Box>

        <Divider />

        {/* Регулярность */}
        <Select
          label="Регулярность"
          data={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
          size="sm"
        />

        {/* Стартовая дата */}
        <DatePickerInput
          label="Стартовая дата"
          value={startDate}
          onChange={setStartDate}
          valueFormat="DD MMM YYYY"
          placeholder="Выберите дату"
          size="sm"
          clearable
        />

        {/* Количество повторений */}
        <NumberInput
          label="Количество повторений"
          value={count}
          onChange={(v) => setCount(Math.min(100, Math.max(1, Number(v) || 1)))}
          min={1}
          max={100}
          size="sm"
          description="Максимум 100"
        />

        <Divider label="Инкремент суммы" labelPosition="center" />

        {/* Тип инкремента */}
        <SegmentedControl
          value={incrementType}
          onChange={setIncrementType}
          data={[
            { label: 'В валюте', value: 'currency' },
            { label: 'В процентах', value: 'percent' },
          ]}
          size="xs"
          fullWidth
        />

        <NumberInput
          label={incrementType === 'percent' ? 'Изменение каждой следующей (%)' : 'Изменение каждой следующей (₽)'}
          description="Положительное — увеличение, отрицательное — уменьшение. 0 = без изменений."
          value={incrementValue}
          onChange={(v) => setIncrementValue(Number(v) || 0)}
          decimalScale={incrementType === 'percent' ? 2 : 2}
          step={incrementType === 'percent' ? 0.5 : 100}
          allowNegative
          size="sm"
          suffix={incrementType === 'percent' ? ' %' : ' ₽'}
        />

        {/* Предпросмотр */}
        {preview.length > 0 && (
          <>
            <Divider label={`Предпросмотр — ${preview.length} транзакций`} labelPosition="center" />

            <ScrollArea h={180} type="auto">
              <Stack gap={4}>
                {preview.map(({ date, amount }, i) => (
                  <Group key={i} justify="space-between" px={4}>
                    <Text size="xs" c="dimmed">{dayjs(date).format('DD MMM YYYY')}</Text>
                    <Text size="xs" fw={500}>{formatMoney(amount)}</Text>
                  </Group>
                ))}
              </Stack>
            </ScrollArea>

            <Group justify="space-between" px={4}>
              <Text size="xs" c="dimmed">Итого:</Text>
              <Text size="sm" fw={700}>{formatMoney(totalAmount)}</Text>
            </Group>
          </>
        )}

        {!startDate && (
          <Alert icon={<IconAlertCircle size={14} />} color="yellow" variant="light" p={8}>
            <Text size="xs">Выберите стартовую дату для предпросмотра</Text>
          </Alert>
        )}

        <Divider />

        <Group justify="flex-end" gap={8}>
          <Button size="xs" variant="subtle" color="gray"
            leftSection={<IconX size={13} />}
            onClick={closeDuplicator}>
            Отмена
          </Button>
          <Button
            size="xs"
            color="green"
            leftSection={<IconCopy size={13} />}
            onClick={handleCreate}
            loading={isSaving}
            disabled={preview.length === 0}
          >
            Создать {preview.length > 0 ? preview.length : ''} транзакций
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
