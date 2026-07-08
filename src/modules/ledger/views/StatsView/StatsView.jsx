import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Text, Group, Stack, Paper, Center, Loader,
  Badge, Switch, Box, SimpleGrid,
} from '@mantine/core';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { useAccounts, useMonthTotals } from '../../api/ledgerApi';
import { formatMoney, toMajor } from '../../utils/ledgerUtils';
import { LedgerStatsToolbar } from '../../components/Toolbar/LedgerStatsToolbar';

// ─── Утилиты ─────────────────────────────────────────────────────

const CHART_COLORS = [
  '#2f9e44', '#1971c2', '#c2255c', '#f08c00',
  '#6741d9', '#0c8599', '#e03131', '#087f5b',
];

const formatAxisMoney = (v) => {
  const abs = Math.abs(v / 100);
  if (abs >= 1_000_000) return `${(v / 100_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${(v / 100_000).toFixed(0)}K`;
  return (v / 100).toFixed(0);
};

const formatTooltipMoney = (v, currency = 'RUB') =>
  formatMoney(v, currency);

// Месяц → красивый лейбл для оси X
const formatMonthLabel = (mk) => dayjs(mk + '-01').format('MMM YY');

// ─── Кастомный тултип ─────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper p={10} shadow="md" withBorder style={{ minWidth: 180 }}>
      <Text size="xs" fw={700} mb={6}>{dayjs(label + '-01').format('MMMM YYYY')}</Text>
      {payload.map((entry) => (
        <Group key={entry.dataKey} justify="space-between" gap={8}>
          <Group gap={4}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
            <Text size="xs" c="dimmed">{entry.name}</Text>
          </Group>
          <Text size="xs" fw={600} c={entry.value < 0 ? 'red' : 'dark'}>
            {formatMoney(entry.value, currency)}
          </Text>
        </Group>
      ))}
    </Paper>
  );
};

// ─── Сводный график ───────────────────────────────────────────────
// Показывает агрегат по ВСЕМ счетам: сумма балансов, доходов, расходов итд.
// Не разбивка по счетам — общая картина.

const SUMMARY_LINES = [
  { key: 'balance',   label: 'Balance',   color: '#343a40', width: 2.5, fill: 'rgba(52,58,64,0.08)' },
  { key: 'income',    label: 'Income',    color: '#2f9e44', width: 1.5, fill: 'rgba(47,158,68,0.08)' },
  { key: 'expense',   label: 'Expense',   color: '#e03131', width: 1.5, fill: 'rgba(224,49,49,0.08)' },
  { key: 'transfers', label: 'Transfers', color: '#1971c2', width: 1.5, fill: 'rgba(25,113,194,0.06)' },
  { key: 'interest',  label: 'Interest',  color: '#f08c00', width: 1.5, fill: 'rgba(240,140,0,0.06)' },
];

const SummaryChart = ({ data, currency }) => {
  const [visible, setVisible] = useState({ balance: true, income: false, expense: false, transfers: false, interest: false });
  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));
  const hasInterest = data.some((d) => (d.interest ?? 0) !== 0);

  return (
    <Paper withBorder p={16} radius="md">
      <Group justify="space-between" mb={12}>
        <Text fw={600} size="sm">Overview — all accounts</Text>
        <Group gap={6} wrap="wrap">
          {SUMMARY_LINES.map(({ key, label, color }) => {
            if (key === 'interest' && !hasInterest) return null;
            return (
              <Badge key={key} size="sm"
                variant={visible[key] ? 'filled' : 'outline'}
                style={{ cursor: 'pointer', background: visible[key] ? color : undefined, borderColor: color, color: visible[key] ? 'white' : color }}
                onClick={() => toggle(key)}
              >
                {label}
              </Badge>
            );
          })}
        </Group>
      </Group>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <defs>
            {SUMMARY_LINES.map(({ key, fill }) => (
              <linearGradient key={key} id={`grad-summary-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={fill} stopOpacity={1} />
                <stop offset="95%" stopColor={fill} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
          <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatAxisMoney} tick={{ fontSize: 11 }} width={56} />
          <ReTooltip content={<CustomTooltip currency={currency} />} />
          <ReferenceLine y={0} stroke="var(--mantine-color-gray-5)" strokeDasharray="4 2" />

          {SUMMARY_LINES.map(({ key, label, color, width, fill }) => {
            if (key === 'interest' && !hasInterest) return null;
            if (!visible[key]) return null;
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={width}
                fill={`url(#grad-summary-${key})`}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

// ─── Карточка счёта ───────────────────────────────────────────────

const AccountCard = ({ account, data, currency, color }) => {
  const [lines, setLines] = useState({
    balance: true, income: false, expense: false,
    transfers: false, interest: false,
  });

  const toggle = (key) => setLines((v) => ({ ...v, [key]: !v[key] }));

  const toggles = [
    { key: 'balance',   label: 'Balance',   color: color },
    { key: 'income',    label: 'Income',    color: '#2f9e44' },
    { key: 'expense',   label: 'Expense',   color: '#e03131' },
    { key: 'transfers', label: 'Transfers', color: '#1971c2' },
    { key: 'interest',  label: 'Interest',  color: '#f08c00' },
  ];

  const hasInterest = data.some((d) => d.interest !== 0);

  return (
    <Paper withBorder p={14} radius="md">
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Group gap={6}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          <Text fw={600} size="sm">{account.name}</Text>
          {account.literals && (
            <Badge size="xs" variant="filled" style={{ background: color, fontFamily: 'monospace' }}>
              {account.literals}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">{account.type}</Text>
      </Group>

      {/* Тогглы */}
      <Group gap={6} mb={10} wrap="wrap">
        {toggles.map(({ key, label, color: c }) => {
          if (key === 'interest' && !hasInterest) return null;
          return (
            <Badge
              key={key} size="xs"
              variant={lines[key] ? 'filled' : 'outline'}
              style={{ cursor: 'pointer', background: lines[key] ? c : undefined, borderColor: c, color: lines[key] ? 'white' : c }}
              onClick={() => toggle(key)}
            >
              {label}
            </Badge>
          );
        })}
      </Group>

      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${account.id}-balance`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            {[
              { key: 'income',    c: '#2f9e44' },
              { key: 'expense',   c: '#e03131' },
              { key: 'transfers', c: '#1971c2' },
              { key: 'interest',  c: '#f08c00' },
            ].map(({ key, c }) => (
              <linearGradient key={key} id={`grad-${account.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.12} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
          <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={formatAxisMoney} tick={{ fontSize: 10 }} width={48} />
          <ReTooltip content={<CustomTooltip currency={currency} />} />
          <ReferenceLine y={0} stroke="var(--mantine-color-gray-4)" strokeDasharray="4 2" />

          {lines.income && (
            <Area type="monotone" dataKey="income" name="Income"
              stroke="#2f9e44" strokeWidth={1.5}
              fill={`url(#grad-${account.id}-income)`} dot={false} connectNulls />
          )}
          {lines.expense && (
            <Area type="monotone" dataKey="expense" name="Expense"
              stroke="#e03131" strokeWidth={1.5}
              fill={`url(#grad-${account.id}-expense)`} dot={false} connectNulls />
          )}
          {lines.transfers && (
            <Area type="monotone" dataKey="transfers" name="Transfers"
              stroke="#1971c2" strokeWidth={1.5}
              fill={`url(#grad-${account.id}-transfers)`} dot={false} connectNulls />
          )}
          {lines.interest && (
            <Area type="monotone" dataKey="interest" name="Interest"
              stroke="#f08c00" strokeWidth={1.5}
              fill={`url(#grad-${account.id}-interest)`} dot={false} connectNulls />
          )}
          {lines.balance && (
            <Area type="monotone" dataKey="balance" name="Balance"
              stroke={color} strokeWidth={2}
              fill={`url(#grad-${account.id}-balance)`}
              dot={false} activeDot={{ r: 3 }} connectNulls />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

// ─── StatsView ────────────────────────────────────────────────────

export const StatsView = () => {
  const [searchParams] = useSearchParams();
  const [activeCurrency, setActiveCurrency] = useState('RUB');

  const startParam = searchParams.get('start') || dayjs().subtract(5, 'month').format('YYYY-MM');
  const endParam   = searchParams.get('end')   || dayjs().format('YYYY-MM');

  const { data: allAccounts = [], isLoading: accountsLoading } = useAccounts();

  // Фильтруем не архивные счета выбранной валюты
  const accounts = useMemo(() =>
    allAccounts.filter((a) => !a.is_archived && a.currency === activeCurrency),
    [allAccounts, activeCurrency]
  );

  // Все доступные валюты
  const currencies = useMemo(() =>
    [...new Set(allAccounts.filter((a) => !a.is_archived).map((a) => a.currency))],
    [allAccounts]
  );

  const accountIds = accounts.map((a) => a.id).join(',');

  // Запрашиваем тоталы за диапазон + предыдущий месяц (для opening первого месяца)
  const prevMonthKey = dayjs(startParam + '-01').subtract(1, 'month').format('YYYY-MM');
  const { data: allTotals = [], isLoading: totalsLoading } = useMonthTotals({
    start:      prevMonthKey,
    end:        endParam,
    account_id: accountIds || undefined,
  });

  // Строим monthKeys — все месяцы в диапазоне
  const monthKeys = useMemo(() => {
    const keys = [];
    let cur = dayjs(startParam + '-01');
    const end = dayjs(endParam + '-01');
    while (cur.isSameOrBefore(end, 'month')) {
      keys.push(cur.format('YYYY-MM'));
      cur = cur.add(1, 'month');
    }
    return keys;
  }, [startParam, endParam]);

  // totalsByAccount: { accId: { 'YYYY-MM': total } }
  const totalsByAccount = useMemo(() => {
    const map = {};
    for (const t of allTotals) {
      if (!map[t.account_id]) map[t.account_id] = {};
      map[t.account_id][t.month_key] = t;
    }
    return map;
  }, [allTotals]);

  // Данные для сводного графика — агрегат по всем счетам
  const summaryData = useMemo(() =>
    monthKeys.map((mk) => {
      let balance = 0, income = 0, expense = 0, transfersIn = 0, transfersOut = 0, interest = 0;
      let hasAny = false;
      for (const acc of accounts) {
        const t = totalsByAccount[acc.id]?.[mk];
        if (!t) continue;
        hasAny    = true;
        balance  += t.closing_balance   ?? 0;
        income   += t.income_total      ?? 0;
        expense  += t.expense_total     ?? 0;
        transfersIn  += t.transfer_in_total  ?? 0;
        transfersOut += t.transfer_out_total ?? 0;
        interest += t.interest_total    ?? 0;
      }
      return {
        month:     mk,
        balance:   hasAny ? balance : null,
        income:    hasAny ? income  : null,
        expense:   hasAny ? -expense : null,   // отрицательный для наглядности
        transfers: hasAny ? transfersIn - transfersOut : null,
        interest:  hasAny ? interest : null,
      };
    }),
    [monthKeys, accounts, totalsByAccount]
  );

  // Данные для карточек счетов
  const accountData = useMemo(() =>
    accounts.map((acc) => ({
      account: acc,
      data: monthKeys.map((mk) => {
        const t = totalsByAccount[acc.id]?.[mk];
        return {
          month:     mk,
          balance:   t?.closing_balance  ?? null,
          income:    t?.income_total     ?? 0,
          expense:   -(t?.expense_total  ?? 0), // отрицательный для отображения
          transfers: (t?.transfer_in_total ?? 0) - (t?.transfer_out_total ?? 0),
          interest:  t?.interest_total   ?? 0,
        };
      }),
    })),
    [accounts, monthKeys, totalsByAccount]
  );

  const isLoading = accountsLoading || totalsLoading;

  if (isLoading) return <Center h={300}><Loader size="sm" color="green" /></Center>;

  if (accounts.length === 0) return (
    <Center h={300}>
      <Text c="dimmed" size="sm">No accounts for {activeCurrency}</Text>
    </Center>
  );

  return (
    <>
      <LedgerStatsToolbar
        currencies={currencies}
        activeCurrency={activeCurrency}
        onCurrencyChange={setActiveCurrency}
      />

      <Stack gap={16} p={16} style={{ maxWidth: 1400 }}>

        {/* Сводный график */}
        <SummaryChart
          data={summaryData}
          currency={activeCurrency}
        />

        {/* Карточки по счетам */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={16}>
          {accountData.map(({ account, data }, i) => (
            <AccountCard
              key={account.id}
              account={account}
              data={data}
              currency={activeCurrency}
              color={account.color || CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </SimpleGrid>

      </Stack>
    </>
  );
};
