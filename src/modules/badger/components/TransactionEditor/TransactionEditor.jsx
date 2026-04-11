import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, Textarea, NumberInput,
  Button, SegmentedControl, Select, Badge, ActionIcon,
  Divider, Box, Tabs,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCheck, IconX, IconArrowDown, IconArrowUp, IconArrowsLeftRight,
  IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useBadgerStore } from '../../store/badgerStore';
import {
  useTransaction, useSaveTransaction, useDeleteTransaction,
  useAccounts, useTransactionGroups,
} from '../../api/badgerApi';
import { toMinor, toMajor, formatMoney } from '../../utils/badgerUtils';

// ─── Константы ───────────────────────────────────────────────────

const FLOW_KINDS = [
  { value: 'expense',      label: 'Expense',  icon: IconArrowDown,         color: 'red' },
  { value: 'income',       label: 'Income',   icon: IconArrowUp,           color: 'teal' },
  { value: 'transfer_out', label: 'Transfer', icon: IconArrowsLeftRight,   color: 'blue' },
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

  // При открытии с предзаполненным account_id
  useEffect(() => {
    if (initial?.account_id && !accountId) setAccountId(initial.account_id);
  }, [initial?.account_id]);

  const accountOptions = accounts
    .filter((a) => !Boolean(a.is_archived))
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  const groupOptions = [
    { value: '', label: '— No group —' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const isTransfer = flowKind === 'transfer_out';

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      notifications.show({ message: 'Enter amount', color: 'red' });
      return;
    }
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
      flow_kind:          flowKind,
      amount:             toMinor(Number(amount)),
      title:              title.trim() || null,
      note:               note.trim()  || null,
      occurred_at:        dayjs(date).format('YYYY-MM-DD'),
      account_id:         accountId,
      target_account_id:  isTransfer ? targetId : null,
      group_id:           groupId || null,
      status,
    });
  };

  // Текущий счёт для отображения валюты
  const currentAccount = accounts.find((a) => a.id === accountId);

  return (
    <Stack gap={14}>

      {/* flow_kind — три кнопки */}
      <Group gap={6} grow>
        {FLOW_KINDS.map((k) => (
          <FlowKindButton
            key={k.value}
            kind={k.value}
            active={flowKind === k.value}
            onClick={() => setFlowKind(k.value)}
          />
        ))}
      </Group>

      {/* Сумма */}
      <NumberInput
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChange={setAmount}
        min={0}
        decimalScale={2}
        step={100}
        hideControls
        size="lg"
        styles={{
          input: {
            fontSize: 28,
            fontWeight: 700,
            textAlign: 'right',
            color: flowKind === 'expense'
              ? 'var(--mantine-color-red-6)'
              : flowKind === 'income'
                ? 'var(--mantine-color-teal-6)'
                : 'var(--mantine-color-blue-6)',
          }
        }}
        rightSection={
          currentAccount && (
            <Text size="sm" c="dimmed" pr={8}>{currentAccount.currency}</Text>
          )
        }
        autoFocus
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

      {/* Заметка */}
      <Textarea
        label="Note"
        placeholder="Optional note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        autosize
        minRows={2}
        maxRows={4}
        size="sm"
      />

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

  const isNew    = !editorParams?.id;
  const editId   = editorParams?.id;

  const { data: existing } = useTransaction(editId);
  const saveTransaction    = useSaveTransaction();
  const deleteTransaction  = useDeleteTransaction();

  // Начальные данные: либо существующая транзакция, либо предзаполненные из стора
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

  // Пока грузим существующую — не показываем форму с пустыми данными
  if (editId && !existing) return null;

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      title={
        <Text fw={600} size="sm">
          {isNew ? 'New transaction' : 'Edit transaction'}
        </Text>
      }
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
