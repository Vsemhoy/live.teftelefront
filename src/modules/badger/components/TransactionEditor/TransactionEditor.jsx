import { useState, useEffect, useRef } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, Textarea, NumberInput,
  Button, Select, ActionIcon, Divider, Box, Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCheck, IconX, IconArrowDown, IconArrowUp, IconArrowsLeftRight,
  IconTrash, IconCalculator, IconMath, IconScale,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useBadgerStore } from '../../store/badgerStore';
import {
  useTransaction, useSaveTransaction, useDeleteTransaction,
  useAccounts, useTransactionGroups,
} from '../../api/badgerApi';
import { toMinor, toMajor } from '../../utils/badgerUtils';

// ─── Безопасный eval выражений ────────────────────────────────────
// Только цифры, пробелы и операторы + - * / ( ) .
const safeEval = (expr) => {
  const clean = expr.replace(/[^0-9+\-*/.() ]/g, '').trim();
  if (!clean) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${clean})`)();
    if (typeof result === 'number' && isFinite(result)) {
      // Округляем до 2 знаков
      return Math.round(result * 100) / 100;
    }
  } catch {}
  return null;
};

// ─── Хук: eval в Note при вводе "=?" после числового выражения ───
// Паттерн: ...цифры и операторы...=?  → заменяет "=?" на "=результат"
const useNoteEval = (note, setNote) => {
  const handleNoteChange = (e) => {
    let val = e.target.value;

    // Триггер: "=?" в конце после числового выражения
    // Ищем паттерн: (выражение)=?
    const match = val.match(/([\d+\-*\/().\s]+)=\?$/);
    if (match) {
      const expr   = match[1].trim();
      const result = safeEval(expr);
      if (result !== null) {
        // Заменяем "=?" на "=результат"
        val = val.slice(0, -match[0].length) + `${expr}=${result}`;
      }
    }

    setNote(val);
  };

  return handleNoteChange;
};

// ─── Константы ───────────────────────────────────────────────────

const FLOW_KINDS = [
  { value: 'expense',         label: 'Expense',       icon: IconArrowDown,       color: 'red' },
  { value: 'income',          label: 'Income',         icon: IconArrowUp,         color: 'teal' },
  { value: 'transfer_out',    label: 'Transfer',       icon: IconArrowsLeftRight, color: 'blue' },
  { value: 'reconciliation',  label: 'Reconciliation', icon: IconScale,           color: 'violet' },
];

const FlowKindButton = ({ kind, active, onClick }) => {
  const found = FLOW_KINDS.find((k) => k.value === kind);
  if (!found) return null;
  const Icon = found.icon;
  return (
    <Button
      variant={active ? 'filled' : 'light'}
      color={found.color}
      size="compact-sm"
      leftSection={<Icon size={13} />}
      onClick={onClick}
      style={{ flex: 1 }}
    >
      {found.label}
    </Button>
  );
};

// ─── AmountInput с поддержкой выражений ──────────────────────────
const AmountInput = ({ value, onChange, flowKind, currency }) => {
  // Храним строку — пользователь может вводить "5000+300-200"
  const [raw, setRaw] = useState(value !== '' ? String(value) : '');
  const [hasExpr, setHasExpr] = useState(false);

  useEffect(() => {
    // Синхронизация если value изменилось снаружи
    if (value !== '' && !raw) setRaw(String(value));
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setRaw(val);
    // Проверяем есть ли выражение (операторы кроме минуса в начале)
    setHasExpr(/[+\-*\/]/.test(val.replace(/^-/, '')));
    // Если чистое число — сразу передаём
    const num = parseFloat(val);
    if (!isNaN(num) && String(num) === val.trim()) {
      onChange(num);
    }
  };

  const handleEval = () => {
    const result = safeEval(raw);
    if (result !== null && result > 0) {
      setRaw(String(result));
      setHasExpr(false);
      onChange(result);
      notifications.show({ message: `= ${result}`, color: 'green', autoClose: 1500 });
    } else {
      notifications.show({ message: 'Invalid expression', color: 'red' });
    }
  };

  // При blur — вычисляем автоматически если есть выражение
  const handleBlur = () => {
    if (hasExpr) handleEval();
  };

  const amountColor = flowKind === 'expense'
    ? 'var(--mantine-color-red-6)'
    : flowKind === 'income'
      ? 'var(--mantine-color-teal-6)'
      : 'var(--mantine-color-blue-6)';

  return (
    <Box>
      <Text size="xs" fw={500} mb={4}>Amount</Text>
      <Group gap={6} align="center">
        <Box style={{ flex: 1, position: 'relative' }}>
          <input
            value={raw}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter' && hasExpr) { e.preventDefault(); handleEval(); } }}
            placeholder="0.00  или  5000+300-200  или  -1500"
            autoFocus
            style={{
              width: '100%',
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'right',
              color: amountColor,
              border: `1px solid ${hasExpr ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-gray-4)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              outline: 'none',
              background: hasExpr ? 'var(--mantine-color-orange-0)' : 'white',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
          />
        </Box>
        {/* Кнопка вычисления — появляется когда есть выражение */}
        {hasExpr && (
          <Tooltip label="Calculate (Enter)">
            <ActionIcon
              variant="filled"
              color="orange"
              size="xl"
              onClick={handleEval}
              style={{ flexShrink: 0 }}
            >
              <IconCalculator size={20} />
            </ActionIcon>
          </Tooltip>
        )}
        {currency && !hasExpr && (
          <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>{currency}</Text>
        )}
      </Group>
      {hasExpr && (
        <Text size="xs" c="orange.6" mt={4}>
          Press Enter or = to calculate
        </Text>
      )}
    </Box>
  );
};

// ─── Форма ───────────────────────────────────────────────────────

const TransactionForm = ({ initial, onSave, onDelete, onCancel, isSaving }) => {
  const isNew = !initial?.id;

  const [flowKind,  setFlowKind]  = useState(initial?.flow_kind   || 'expense');
  const [amount,    setAmount]    = useState(initial?.amount ? toMajor(initial.amount) : '');
  const [title,     setTitle]     = useState(initial?.title       || '');
  const [note,      setNote]      = useState(initial?.note        || '');
  const [date,      setDate]      = useState(
    initial?.occurred_at ? new Date(initial.occurred_at) : new Date()
  );
  const [accountId, setAccountId] = useState(initial?.account_id  || null);
  const [targetId,  setTargetId]  = useState(initial?.target_account_id || null);
  const [groupId,   setGroupId]   = useState(initial?.group_id    || null);
  const [status,    setStatus]    = useState(initial?.status       || 'cleared');

  const { data: accounts = [] } = useAccounts();
  const { data: groups   = [] } = useTransactionGroups();

  useEffect(() => {
    if (initial?.account_id && !accountId) setAccountId(initial.account_id);
  }, [initial?.account_id]);

  // eval в Note
  const handleNoteChange = useNoteEval(note, setNote);

  const accountOptions = accounts
    .filter((a) => !Boolean(a.is_archived))
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  const groupOptions = [
    { value: '', label: '— No group —' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const isTransfer = flowKind === 'transfer_out';
  const currentAccount = accounts.find((a) => a.id === accountId);

  const handleSubmit = () => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (!numAmount || numAmount === 0) {
      notifications.show({ message: 'Enter amount', color: 'red' });
      return;
    }
    // reconciliation может быть отрицательной — toMinor от абс. значения, знак отдельно
    const absAmount = Math.abs(numAmount);
    const isNegativeReconciliation = flowKind === 'reconciliation' && numAmount < 0;
    if (!accountId) {
      notifications.show({ message: 'Select account', color: 'red' });
      return;
    }
    if (isTransfer && !targetId) {
      notifications.show({ message: 'Select target account', color: 'red' });
      return;
    }

    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      flow_kind:         flowKind,
      amount:            toMinor(absAmount),
      is_negative:       isNegativeReconciliation, // бэк учтёт знак
      title:             title.trim() || null,
      note:              note.trim()  || null,
      occurred_at:       dayjs(date).format('YYYY-MM-DD'),
      account_id:        accountId,
      target_account_id: isTransfer ? targetId : null,
      group_id:          groupId || null,
      status,
    });
  };

  return (
    <Stack gap={14}>

      {/* flow_kind */}
      <Group gap={6} grow>
        {FLOW_KINDS.map((k) => (
          <FlowKindButton key={k.value} kind={k.value}
            active={flowKind === k.value} onClick={() => setFlowKind(k.value)} />
        ))}
      </Group>

      {/* Сумма с поддержкой выражений */}
      <AmountInput
        value={amount}
        onChange={setAmount}
        flowKind={flowKind}
        currency={currentAccount?.currency}
      />

      {/* Дата + счёт */}
      <Group gap={10} grow>
        <DatePickerInput
          label="Date"
          value={date}
          onChange={setDate}
          valueFormat="DD MMM YYYY"
          size="sm"
        />
        <Select
          label="Account"
          placeholder="Select account"
          value={accountId}
          onChange={setAccountId}
          data={accountOptions}
          size="sm"
        />
      </Group>

      {/* Счёт назначения для перевода */}
      {isTransfer && (
        <Select
          label="To account"
          placeholder="Target account"
          value={targetId}
          onChange={setTargetId}
          data={accountOptions.filter((a) => a.value !== accountId)}
          size="sm"
        />
      )}

      {/* Название */}
      <TextInput
        label="Title"
        placeholder="Продукты, Зарплата, Аренда..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        size="sm"
      />

      {/* Заметка с eval */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={500}>Note</Text>
          <Tooltip label="Type 1000+200*3=? to calculate inline">
            <ActionIcon variant="subtle" color="gray" size="xs">
              <IconMath size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Textarea
          placeholder={'Optional note...\nTip: type 1000+200*3=? to calculate'}
          value={note}
          onChange={handleNoteChange}
          autosize
          minRows={2}
          maxRows={5}
          size="sm"
          styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
        />
      </Box>

      {/* Группа + статус */}
      <Group gap={10} grow>
        <Select
          label="Group"
          value={groupId || ''}
          onChange={(v) => setGroupId(v || null)}
          data={groupOptions}
          size="sm"
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          size="sm"
          data={[
            { value: 'cleared', label: '✓ Cleared' },
            { value: 'pending', label: '◌ Planned' },
          ]}
        />
      </Group>

      <Divider />

      {/* Футер */}
      <Group justify="space-between">
        {!isNew && (
          <ActionIcon variant="subtle" color="red" size="md"
            onClick={() => onDelete(initial.id)}>
            <IconTrash size={16} />
          </ActionIcon>
        )}
        <Group gap={8} ml="auto">
          <Button size="sm" variant="subtle" color="gray"
            leftSection={<IconX size={14} />} onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" color="green" loading={isSaving}
            leftSection={<IconCheck size={14} />} onClick={handleSubmit}>
            {isNew ? 'Create' : 'Save'}
          </Button>
        </Group>
      </Group>

    </Stack>
  );
};

// ─── TransactionEditor (Modal) ───────────────────────────────────

export const TransactionEditor = () => {
  const { editorOpen, editorParams, closeEditor } = useBadgerStore();

  const isNew  = !editorParams?.id;
  const editId = editorParams?.id;

  const { data: existing }  = useTransaction(editId);
  const saveTransaction     = useSaveTransaction();
  const deleteTransaction   = useDeleteTransaction();

  const initial = editId
    ? existing
    : {
        occurred_at: editorParams?.date || dayjs().format('YYYY-MM-DD'),
        account_id:  editorParams?.account_id || null,
      };

  const handleSave = (data) => {
    saveTransaction.mutate(data, {
      onSuccess: () => {
        notifications.show({
          message: isNew ? 'Transaction created' : 'Transaction updated',
          color: 'green',
        });
        closeEditor();
      },
      onError: () => {
        notifications.show({ message: 'Failed to save transaction', color: 'red' });
      },
    });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this transaction?')) return;
    deleteTransaction.mutate(id, {
      onSuccess: () => {
        notifications.show({ message: 'Deleted', color: 'gray' });
        closeEditor();
      },
    });
  };

  if (editId && !existing) return null;

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      title={<Text fw={600} size="sm">{isNew ? 'New transaction' : 'Edit transaction'}</Text>}
      size="md"
      centered
    >
      {editorOpen && (
        <TransactionForm
          initial={initial}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={closeEditor}
          isSaving={saveTransaction.isPending}
        />
      )}
    </Modal>
  );
};
