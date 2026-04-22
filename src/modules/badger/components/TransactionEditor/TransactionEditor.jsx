import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, Textarea, NumberInput,
  Button, Select, ActionIcon, Divider, Box, Tabs, Badge,
  SegmentedControl, useComputedColorScheme,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCheck, IconX, IconArrowDown, IconArrowUp, IconArrowsLeftRight,
  IconTrash, IconCalculator, IconMath, IconScale, IconAdjustments,
  IconNote, IconSettings,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';
import { useBadgerStore } from '../../store/badgerStore';
import {
  useTransaction, useSaveTransaction, useDeleteTransaction,
  useAccounts, useTransactionGroups,
} from '../../api/badgerApi';
import { toMinor, toMajor } from '../../utils/badgerUtils';
import { CategorySelect } from '../CategorySelect/CategorySelect';

// ─── Безопасный eval ──────────────────────────────────────────────
const safeEval = (expr) => {
  const clean = expr.replace(/[^0-9+\-*/.() ]/g, '').trim();
  if (!clean) return null;
  try {
    const result = Function(`"use strict"; return (${clean})`)();
    if (typeof result === 'number' && isFinite(result))
      return Math.round(result * 100) / 100;
  } catch {}
  return null;
};

// ─── Eval в Note ─────────────────────────────────────────────────
const useNoteEval = (note, setNote) => (e) => {
  let val = e.target.value;
  const match = val.match(/([\d+\-*\/().\s]+)=\?$/);
  if (match) {
    const result = safeEval(match[1].trim());
    if (result !== null)
      val = val.slice(0, -match[0].length) + `${match[1].trim()}=${result}`;
  }
  setNote(val);
};

// ─── Типы транзакций ─────────────────────────────────────────────
const FLOW_KINDS = [
  { value: 'expense',        label: 'Expense',        short: 'EXP', icon: IconArrowDown,       color: 'red' },
  { value: 'income',         label: 'Income',         short: 'INC', icon: IconArrowUp,         color: 'teal' },
  { value: 'transfer_out',   label: 'Transfer',       short: 'TRN', icon: IconArrowsLeftRight, color: 'blue' },
  { value: 'adjustment',     label: 'Adjustment',     short: 'ADJ', icon: IconAdjustments,     color: 'gray' },
  { value: 'reconciliation', label: 'Reconciliation', short: 'RCN', icon: IconScale,           color: 'violet' },
];

// ─── AmountInput с калькулятором ─────────────────────────────────
const AmountInput = ({ value, onChange, flowKind, currency, onTitleSpill }) => {
  const [raw,      setRaw]      = useState(value !== '' ? String(value) : '');
  const [hasExpr,  setHasExpr]  = useState(false);

  useEffect(() => {
    if (value !== '' && !raw) setRaw(String(value));
  }, [value]);

  const titleRef = React.useRef(null); // ref на поле Title снаружи

  const handleChange = (e) => {
    const val = e.target.value;

    // Если ввели 3+ нецифровых/неоператорных символа подряд — это название, не сумма
    // Перебрасываем в Title и очищаем Amount
    const nonMathChars = val.replace(/[0-9+\-*/.() ]/g, '');
    if (nonMathChars.length >= 3) {
      onTitleSpill?.(val); // передаём наверх в форму
      setRaw('');
      setHasExpr(false);
      return;
    }

    setRaw(val);
    setHasExpr(/[+\-*\/]/.test(val.replace(/^-/, '')));
    const num = parseFloat(val);
    if (!isNaN(num) && String(num) === val.trim()) onChange(num);
  };

  const handleEval = () => {
    const result = safeEval(raw);
    if (result !== null && result !== 0) {
      setRaw(String(result));
      setHasExpr(false);
      onChange(result);
      notifications.show({ message: `= ${result}`, color: 'green', autoClose: 1500 });
    } else {
      notifications.show({ message: 'Invalid expression', color: 'red' });
    }
  };

  const amountColor =
    flowKind === 'expense'      ? 'var(--mantine-color-red-6)'
    : flowKind === 'income'     ? 'var(--mantine-color-teal-6)'
    : flowKind === 'transfer_out' ? 'var(--mantine-color-blue-6)'
    : flowKind === 'reconciliation' ? 'var(--mantine-color-violet-6)'
    : 'var(--mantine-color-gray-6)';

  return (
    <Box>
      <Group gap={6} align="center">
        <Box style={{ flex: 1, position: 'relative' }}>
          <input
            value={raw}
            onChange={handleChange}
            onBlur={() => { if (hasExpr) handleEval(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && hasExpr) { e.preventDefault(); handleEval(); } }}
            placeholder="0.00  или  5000+300-200"
            autoFocus
            style={{
              width: '100%',
              fontSize: 36,
              fontWeight: 700,
              textAlign: 'right',
              color: amountColor,
              border: `1px solid ${hasExpr ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-gray-3)'}`,
              borderRadius: 8,
              padding: '10px 14px',
              outline: 'none',
              background: hasExpr ? 'var(--mantine-color-orange-0)' : 'white',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
          />
        </Box>
        {hasExpr ? (
          <ActionIcon variant="filled" color="orange" size="xl" onClick={handleEval}>
            <IconCalculator size={22} />
          </ActionIcon>
        ) : currency ? (
          <Text size="lg" c="dimmed" fw={500} style={{ flexShrink: 0, minWidth: 40 }}>{currency}</Text>
        ) : null}
      </Group>
      {hasExpr && <Text size="xs" c="orange.6" mt={4}>Press Enter or = to calculate</Text>}
    </Box>
  );
};

// ─── Форма ───────────────────────────────────────────────────────
const TransactionForm = ({ initial, onSave, onDelete, onCancel, isSaving }) => {
  const isNew    = !initial?.id;
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [flowKind,  setFlowKind]  = useState(initial?.flow_kind      || 'expense');
  const [amount,    setAmount]    = useState(initial?.amount ? toMajor(initial.amount) : '');
  const [title,     setTitle]     = useState(initial?.title          || '');
  const titleInputRef = useRef(null);

  // Когда в Amount ввели текст (3+ нематематических символа) — перебрасываем в Title
  const handleTitleSpill = (text) => {
    setTitle((prev) => prev + text);
    // Фокус и курсор в конец Title
    setTimeout(() => {
      const el = titleInputRef.current;
      if (el) {
        el.focus();
        const len = (title + text).length;
        el.setSelectionRange(len, len);
      }
    }, 30);
  };
  const [note,      setNote]      = useState(initial?.note           || '');
  const [date,      setDate]      = useState(
    initial?.occurred_at ? new Date(initial.occurred_at) : new Date()
  );
  const [accountId, setAccountId] = useState(initial?.account_id    || null);
  const [targetId,  setTargetId]  = useState(initial?.target_account_id || null);
  const [groupId,   setGroupId]   = useState(initial?.group_id       || null);
  const [categoryId, setCategoryId] = useState(initial?.category_id   || null);
  const [status,    setStatus]    = useState(initial?.status         || 'cleared');
  const [activeTab, setActiveTab] = useState('main');

  const { data: accounts = [] } = useAccounts();
  const { data: groups   = [] } = useTransactionGroups();

  useEffect(() => {
    if (initial?.account_id && !accountId) setAccountId(initial.account_id);
  }, [initial?.account_id]);

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
    if (!accountId) {
      notifications.show({ message: 'Select account', color: 'red' });
      return;
    }
    if (isTransfer && !targetId) {
      notifications.show({ message: 'Select target account', color: 'red' });
      return;
    }
    const absAmount = Math.abs(numAmount);
    const isNegRec  = flowKind === 'reconciliation' && numAmount < 0;

    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      flow_kind:         flowKind,
      amount:            toMinor(absAmount),
      is_negative:       isNegRec,
      title:             title.trim() || null,
      note:              note.trim()  || null,
      occurred_at:       dayjs(date).format('YYYY-MM-DD'),
      account_id:        accountId,
      target_account_id: isTransfer ? targetId : null,
      group_id:          groupId || null,
      category_id:       categoryId || null,
      status,
    });
  };

  const currentKind = FLOW_KINDS.find((k) => k.value === flowKind);

  return (
    <Stack gap={0} style={{ height: '100%' }}>

      {/* ── Шапка: тип + сумма ───────────────────────────────── */}
      <Box px={20} pt={16} pb={12}
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 }}>

        {/* Кнопки типа */}
        <Group gap={6} mb={14} wrap="nowrap">
          {FLOW_KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <Button
                key={k.value}
                variant={flowKind === k.value ? 'filled' : 'light'}
                color={k.color}
                size="compact-sm"
                leftSection={<Icon size={13} />}
                onClick={() => setFlowKind(k.value)}
                style={{ flex: 1 }}
              >
                {isMobile ? k.short : k.label}
              </Button>
            );
          })}
        </Group>

        {/* Сумма */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          flowKind={flowKind}
          currency={currentAccount?.currency}
          onTitleSpill={handleTitleSpill}
        />
      </Box>

      {/* ── Табы ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tabs.List px={20} style={{ flexShrink: 0 }}>
          <Tabs.Tab value="main"     leftSection={<IconSettings size={14} />}>Main</Tabs.Tab>
          <Tabs.Tab value="note"     leftSection={<IconNote size={14} />}>
            Note {note && <Badge size="xs" variant="dot" color="green" ml={4} />}
          </Tabs.Tab>
        </Tabs.List>

        {/* ── Таб: Main ──────────────────────────────────────── */}
        <Tabs.Panel value="main" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <Stack gap={14}>
            <Group gap={12} grow>
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

            <TextInput
              ref={titleInputRef}
              label="Title"
              placeholder="Продукты, Зарплата, Аренда..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              size="sm"
            />

            <Group gap={12} grow>
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

            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
            />
          </Stack>
        </Tabs.Panel>

        {/* ── Таб: Note ──────────────────────────────────────── */}
        <Tabs.Panel value="note" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
          <Stack gap={6} style={{ flex: 1 }}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Tip: type 1000+200*3=? to calculate inline</Text>
              <ActionIcon variant="subtle" color="gray" size="xs">
                <IconMath size={13} />
              </ActionIcon>
            </Group>
            <Textarea
              placeholder={'Note...\n\nExample:\nАренда 15000+коммуналка 3500=?'}
              value={note}
              onChange={handleNoteChange}
              style={{ flex: 1 }}
              styles={{
                root:    { flex: 1, display: 'flex', flexDirection: 'column' },
                wrapper: { flex: 1 },
                input:   { flex: 1, fontFamily: 'monospace', fontSize: 13, resize: 'none', height: '100%', minHeight: 200 },
              }}
            />
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* ── Футер ────────────────────────────────────────────── */}
      <Box px={20} py={12}
        style={{ borderTop: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 }}>
        <Group justify="space-between">
          {!isNew ? (
            <ActionIcon variant="subtle" color="red" size="md"
              onClick={() => onDelete(initial.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          ) : <Box />}
          <Group gap={8}>
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
      </Box>
    </Stack>
  );
};

// ─── TransactionEditor (Modal) ───────────────────────────────────
export const TransactionEditor = () => {
  const { editorOpen, editorParams, closeEditor } = useBadgerStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      onError: () => notifications.show({ message: 'Failed to save transaction', color: 'red' }),
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
      title={
        <Text fw={600} size="sm">
          {isNew ? 'New transaction' : 'Edit transaction'}
        </Text>
      }
      size={isMobile ? '100%' : '640px'}
      fullScreen={isMobile}
      padding={0}
      styles={{
        content: { display: 'flex', flexDirection: 'column', height: isMobile ? '100dvh' : '580px' },
        body:    { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0 },
        header:  { padding: '12px 20px 8px', borderBottom: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 },
      }}
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
