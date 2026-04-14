import { useState, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, TextInput, NumberInput,
  ActionIcon, Button, Divider, Select, ColorPicker,
  Box, Tooltip, Center, Loader, Badge, Switch, Collapse,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconGripVertical, IconEdit, IconTrash, IconArchive,
  IconCheck, IconX, IconPlus, IconChevronLeft,
  IconWallet, IconCreditCard, IconBuildingBank, IconPigMoney,
  IconChevronDown,
} from '@tabler/icons-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useAccounts, useSaveAccount, useDeleteAccount } from '../../api/badgerApi';
import { formatMoney, toMajor, toMinor, rateToInt, rateToFloat, rateToStr } from '../../utils/badgerUtils';

const SWATCHES = [
  '#e03131','#c2255c','#9c36b5','#6741d9','#3b5bdb',
  '#1971c2','#0c8599','#087f5b','#2f9e44','#66a80f',
  '#f08c00','#e8590c','#FFDD00','#868e96','#343a40',
];

const ACCOUNT_TYPES = [
  { value: 'card',    label: 'Card',    icon: IconCreditCard },
  { value: 'cash',    label: 'Cash',    icon: IconWallet },
  { value: 'credit',  label: 'Credit',  icon: IconBuildingBank },
  { value: 'deposit', label: 'Deposit', icon: IconPigMoney },
];

const CURRENCIES = [
  { value: 'RUB', label: '₽ RUB' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
];

const AccountTypeIcon = ({ type, size = 15 }) => {
  const found = ACCOUNT_TYPES.find((t) => t.value === type);
  const Icon  = found?.icon ?? IconWallet;
  return <Icon size={size} />;
};

// ─── Форма редактора ─────────────────────────────────────────────

const AccountForm = ({ account, onSave, onCancel, isSaving }) => {
  const isNew = !account?.id;

  const [name,          setName]         = useState(account?.name           || '');
  const [literals,      setLiterals]     = useState(account?.literals       || '');
  const [type,          setType]         = useState(account?.type           || 'card');
  const [currency,      setCurrency]     = useState(account?.currency       || 'RUB');
  const [color,         setColor]        = useState(account?.color          || '#3b5bdb');
  const [opening,       setOpening]      = useState(account?.opening_balance ? toMajor(account.opening_balance) : 0);
  const [openedAt,      setOpenedAt]     = useState(account?.opened_at ? new Date(account.opened_at) : null);
  const [closedAt,      setClosedAt]     = useState(account?.closed_at ? new Date(account.closed_at) : null);
  const [interestRate,  setInterestRate] = useState(account?.interest_rate ? rateToFloat(account.interest_rate) : '');
  const [interestStart, setInterestStart] = useState(account?.interest_start ? new Date(account.interest_start) : null);
  const [showAdvanced,  setShowAdvanced] = useState(Boolean(account?.interest_rate || account?.opened_at));

  const isCreditLike = type === 'credit';

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!literals) {
      setLiterals(val.replace(/[^a-zA-Zа-яёА-ЯЁ0-9]/g, '').slice(0, 3).toUpperCase());
    }
  };

  const handleLiterals = (e) => {
    setLiterals(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3));
  };

  // При смене типа на credit — автоматически открываем advanced
  useEffect(() => {
    if (type === 'credit') setShowAdvanced(true);
  }, [type]);

  const handleSubmit = () => {
    if (!name.trim()) {
      notifications.show({ message: 'Enter account name', color: 'red' });
      return;
    }
    onSave({
      ...(account?.id ? { id: account.id } : {}),
      name:            name.trim(),
      literals:        literals.trim(),
      type,
      currency,
      color,
      opening_balance: toMinor(opening),
      opened_at:       openedAt   ? dayjs(openedAt).format('YYYY-MM-DD')   : null,
      closed_at:       closedAt   ? dayjs(closedAt).format('YYYY-MM-DD')   : null,
      interest_rate:   interestRate ? rateToInt(interestRate) : null,
      interest_start:  interestStart ? dayjs(interestStart).format('YYYY-MM-DD') : null,
    });
  };

  return (
    <Stack gap={14}>
      {/* Название + Литералы */}
      <Group gap={8} align="flex-end">
        <TextInput
          label="Account name"
          placeholder="Тинькофф, Нал, Сбер..."
          value={name}
          onChange={handleNameChange}
          maxLength={100}
          autoFocus
          style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <TextInput
          label="Literals"
          placeholder="SBR"
          value={literals}
          onChange={handleLiterals}
          maxLength={3}
          style={{ width: 72 }}
          styles={{ input: { fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', letterSpacing: '0.1em' } }}
        />
      </Group>

      {/* Тип + Валюта */}
      <Group grow gap={10}>
        <Select label="Type" value={type} onChange={setType}
          data={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
        <Select label="Currency" value={currency} onChange={setCurrency} data={CURRENCIES} />
      </Group>

      {/* Стартовый баланс */}
      <NumberInput
        label={isCreditLike ? "Credit amount (negative = debt)" : "Opening balance"}
        description={isCreditLike ? "Enter negative value, e.g. -450000" : "Starting amount"}
        value={opening}
        onChange={(v) => setOpening(Number(v) || 0)}
        decimalScale={2}
        step={isCreditLike ? 1000 : 100}
        prefix={currency === 'RUB' ? '₽ ' : currency === 'USD' ? '$ ' : '€ '}
      />

      {/* Цвет */}
      <Box>
        <Text size="xs" fw={500} mb={6} c="dimmed">Account color</Text>
        <ColorPicker
          format="hex" value={color} onChange={setColor}
          swatches={SWATCHES} swatchesPerRow={8} size="sm" fullWidth
        />
      </Box>

      {/* Превью */}
      <Box p={10} style={{
        borderRadius: 8, border: `2px solid ${color}`,
        background: `${color}18`, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <AccountTypeIcon type={type} size={18} />
        <Text size="sm" fw={600}>{name || 'Account name'}</Text>
        {literals && (
          <Badge size="xs" variant="filled"
            style={{ background: color, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            {literals}
          </Badge>
        )}
        <Text size="xs" c="dimmed" ml="auto">{currency}</Text>
      </Box>

      {/* Advanced — даты и проценты */}
      <Box>
        <Button
          variant="subtle" color="gray" size="compact-xs" fullWidth
          rightSection={<IconChevronDown size={13}
            style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
          onClick={() => setShowAdvanced((v) => !v)}
          styles={{ root: { justifyContent: 'space-between' } }}
        >
          {isCreditLike ? 'Credit settings' : 'Advanced settings'}
        </Button>

        <Collapse in={showAdvanced}>
          <Stack gap={10} mt={10}>
            {/* Даты открытия/закрытия */}
            <Group grow gap={10}>
              <DatePickerInput
                label="Opened at"
                value={openedAt}
                onChange={setOpenedAt}
                valueFormat="DD MMM YYYY"
                clearable
                size="sm"
              />
              <DatePickerInput
                label="Closed at"
                value={closedAt}
                onChange={setClosedAt}
                valueFormat="DD MMM YYYY"
                clearable
                size="sm"
                description="Leave empty if active"
              />
            </Group>

            {/* Процентная ставка — только для кредитных */}
            {isCreditLike && (
              <>
                <Divider label="Interest accrual" labelPosition="center" />
                <Group grow gap={10}>
                  <NumberInput
                    label="Annual rate (%)"
                    placeholder="23.0"
                    value={interestRate}
                    onChange={setInterestRate}
                    decimalScale={2}
                    min={0}
                    max={200}
                    suffix=" %"
                    description="e.g. 23 = 23% per year"
                    size="sm"
                  />
                  <DatePickerInput
                    label="Accrual starts"
                    value={interestStart}
                    onChange={setInterestStart}
                    valueFormat="DD MMM YYYY"
                    clearable
                    size="sm"
                    description="Day after credit received"
                  />
                </Group>
                {interestRate && (
                  <Box p={8} style={{
                    background: 'var(--mantine-color-orange-0)',
                    borderRadius: 6,
                    border: '1px solid var(--mantine-color-orange-2)',
                  }}>
                    <Text size="xs" c="orange.7">
                      Daily accrual on 450,000₽ debt: ~{
                        (() => {
                          // -45000000 копеек * ставка/10000 / 365
                          const daily = Math.abs(Math.round(-45000000 * rateToInt(interestRate) / 10000 / 365));
                          return `${daily} коп/день (${(daily / 100).toFixed(2)}₽/день)`;
                        })()
                      }
                    </Text>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Collapse>
      </Box>

      <Group justify="flex-end" gap={8} mt={4}>
        <Button size="xs" variant="subtle" color="gray"
          leftSection={<IconX size={13} />} onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" color="green" loading={isSaving}
          leftSection={<IconCheck size={13} />} onClick={handleSubmit}>
          {isNew ? 'Create' : 'Save'}
        </Button>
      </Group>
    </Stack>
  );
};

// ─── AccountRow ───────────────────────────────────────────────────

const AccountRow = ({ account, onEdit, onDelete }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? 'var(--mantine-color-gray-1)' : 'white',
  };

  const isClosed = Boolean(account.closed_at);

  return (
    <Box ref={setNodeRef} style={style} p={10}
      sx={{ borderRadius: 8, border: '1px solid var(--mantine-color-gray-2)', '&:hover .row-actions': { opacity: 1 } }}>
      <Group gap={8} wrap="nowrap">
        <ActionIcon variant="transparent" color="gray" size="sm"
          style={{ cursor: 'grab', flexShrink: 0 }} {...attributes} {...listeners}>
          <IconGripVertical size={15} />
        </ActionIcon>

        <Box style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0, background: account.color || 'var(--mantine-color-gray-3)' }} />
        <AccountTypeIcon type={account.type} size={15} />

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6}>
            <Text size="sm" fw={500} truncate style={{ opacity: isClosed ? 0.5 : 1 }}>{account.name}</Text>
            {account.literals && (
              <Badge size="xs" variant="filled"
                style={{ background: account.color || 'var(--mantine-color-gray-5)', fontFamily: 'monospace', letterSpacing: '0.08em', flexShrink: 0 }}>
                {account.literals}
              </Badge>
            )}
            {account.interest_rate && (
              <Badge size="xs" color="orange" variant="light">{rateToStr(account.interest_rate)}%</Badge>
            )}
            {isClosed && <Badge size="xs" color="gray" variant="outline">closed</Badge>}
          </Group>
          <Group gap={4}>
            <Badge size="xs" variant="outline" color="gray">{account.type}</Badge>
            <Badge size="xs" variant="outline" color="gray">{account.currency}</Badge>
            {account.opened_at && (
              <Text size="xs" c="dimmed">from {dayjs(account.opened_at).format('DD.MM.YY')}</Text>
            )}
          </Group>
        </Box>

        <Text size="xs" c={account.balance_today < 0 ? 'red' : 'dimmed'} style={{ whiteSpace: 'nowrap' }}>
          {formatMoney(account.balance_today ?? 0, account.currency)}
        </Text>

        <Group gap={4} className="row-actions" style={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onEdit(account)}>
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Archive">
            <ActionIcon variant="subtle" color="orange" size="sm">
              <IconArchive size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(account.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
};

// ─── AccountsManager ─────────────────────────────────────────────

export const AccountsManager = ({ opened, onClose }) => {
  const [mode,       setMode]       = useState('list');
  const [editing,    setEditing]    = useState(null);
  const [localOrder, setLocalOrder] = useState([]);

  const { data: accounts = [], isLoading } = useAccounts();
  const saveAccount   = useSaveAccount();
  const deleteAccount = useDeleteAccount();

  useEffect(() => {
    if (accounts.length) setLocalOrder(accounts.map((a) => a.id));
  }, [accounts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = localOrder.indexOf(active.id);
    const newIndex = localOrder.indexOf(over.id);
    setLocalOrder(arrayMove(localOrder, oldIndex, newIndex));
  };

  const handleSave = (data) => {
    saveAccount.mutate(data, {
      onSuccess: () => {
        notifications.show({ message: data.id ? 'Account updated' : 'Account created', color: 'green' });
        setMode('list');
        setEditing(null);
      },
      onError: () => notifications.show({ message: 'Failed to save account', color: 'red' }),
    });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this account?')) return;
    deleteAccount.mutate(id, {
      onSuccess: () => notifications.show({ message: 'Account deleted', color: 'gray' }),
      onError:   () => notifications.show({ message: 'Failed to delete', color: 'red' }),
    });
  };

  const handleClose = () => { setMode('list'); setEditing(null); onClose(); };

  const sortedAccounts = localOrder.map((id) => accounts.find((a) => a.id === id)).filter(Boolean);

  return (
    <Drawer
      opened={opened} onClose={handleClose}
      position="right" size="md"
      title={
        <Group gap={8}>
          {mode === 'editor' && (
            <ActionIcon variant="subtle" color="gray" size="sm"
              onClick={() => { setMode('list'); setEditing(null); }}>
              <IconChevronLeft size={16} />
            </ActionIcon>
          )}
          <Text fw={600} size="sm">
            {mode === 'list' ? 'Accounts' : editing?.id ? `Edit: ${editing.name}` : 'New account'}
          </Text>
        </Group>
      }
    >
      {mode === 'list' && (
        <Stack gap={8}>
          {isLoading ? (
            <Center h={200}><Loader size="sm" /></Center>
          ) : sortedAccounts.length === 0 ? (
            <Center h={200}><Text c="dimmed" size="sm">No accounts yet</Text></Center>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                <Stack gap={6}>
                  {sortedAccounts.map((account) => (
                    <AccountRow key={account.id} account={account}
                      onEdit={(a) => { setEditing(a); setMode('editor'); }}
                      onDelete={handleDelete} />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          )}
          <Divider />
          <Button variant="light" color="green" fullWidth
            leftSection={<IconPlus size={14} />}
            onClick={() => { setEditing(null); setMode('editor'); }}>
            New account
          </Button>
        </Stack>
      )}

      {mode === 'editor' && (
        <AccountForm
          account={editing}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditing(null); }}
          isSaving={saveAccount.isPending}
        />
      )}
    </Drawer>
  );
};
