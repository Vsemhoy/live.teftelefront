import { useMemo, useEffect } from 'react';
import { Text, Center, Loader, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useBadgerStore } from '../../store/badgerStore';
import { useTransactions, useAccounts, useMonthTotals } from '../../api/badgerApi';
import { TransactionCard } from '../../components/TransactionCard/TransactionCard';
import { formatMoney } from '../../utils/badgerUtils';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ─── SlotBalance ─────────────────────────────────────────────────
const SlotBalance = ({ balance, mode, currency, totals }) => {
  if (mode === 'extended' && totals) {
    return (
      <div className="bud-slot-balance extended">
        {(totals.income_total ?? 0) > 0 && (
          <Text size="xs" c="teal">+{formatMoney(totals.income_total, currency)}</Text>
        )}
        {(totals.expense_total ?? 0) > 0 && (
          <Text size="xs" c="red">−{formatMoney(totals.expense_total, currency)}</Text>
        )}
        <Text size="xs" fw={600} c={(balance ?? 0) >= 0 ? 'dark' : 'red'}>
          {formatMoney(balance ?? 0, currency)}
        </Text>
      </div>
    );
  }
  return (
    <div className="bud-slot-balance">
      <Text size="xs" fw={500} c={(balance ?? 0) >= 0 ? 'dimmed' : 'red'}>
        {formatMoney(balance ?? 0, currency)}
      </Text>
    </div>
  );
};

// ─── AccountSlot ──────────────────────────────────────────────────
const AccountSlot = ({ account, transactions, balance, totals, mode, onAdd, dateStr }) => (
  <div
    className="bud-account-slot"
    onDoubleClick={(e) => {
      if (e.target.closest('.bud-transaction-card')) return;
      onAdd({ date: dateStr, account_id: account?.id });
    }}
    title="Double-click to add"
  >
    <div className="bud-slot-cards">
      {(transactions || []).map((tx) => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}
      <div className="bud-slot-add">
        <Button variant="subtle" color="gray" size="compact-xs"
          leftSection={<IconPlus size={11} />}
          onClick={() => onAdd({ date: dateStr, account_id: account?.id })}
          styles={{ root: { fontSize: 11 } }}
        >Add</Button>
      </div>
    </div>
    <SlotBalance balance={balance} totals={totals} mode={mode} currency={account?.currency || 'RUB'} />
  </div>
);

// ─── MonthTotalsRow ───────────────────────────────────────────────
// Строка итогов — показывается СВЕРХУ каждого месяца (DESC порядок).
// closingDateStr — последний день месяца, баланс на конец которого показываем.
const MonthTotalsRow = ({ monthKey, activeAccounts, accounts, transactions, balanceByAccount, closingDateStr, label }) => {
  // Считаем итоги по транзакциям этого месяца
  const totalsByAccount = useMemo(() => {
    const result = {};
    for (const accId of activeAccounts) {
      const accTx = transactions.filter(
        (tx) => tx.account_id === accId && tx.month_key === monthKey && !Boolean(tx.is_disabled)
      );
      result[accId] = {
        income:       accTx.filter((t) => t.flow_kind === 'income').reduce((s, t) => s + t.amount, 0),
        expense:      accTx.filter((t) => t.flow_kind === 'expense').reduce((s, t) => s + t.amount, 0),
        transfer_in:  accTx.filter((t) => t.flow_kind === 'transfer_in').reduce((s, t) => s + t.amount, 0),
        transfer_out: accTx.filter((t) => t.flow_kind === 'transfer_out').reduce((s, t) => s + t.amount, 0),
      };
    }
    return result;
  }, [transactions, activeAccounts, monthKey]);

  const activeCurrency = accounts.find((a) => a.id === activeAccounts[0])?.currency || 'RUB';

  const grandClosing = activeAccounts.reduce(
    (sum, accId) => sum + (balanceByAccount[accId]?.[closingDateStr] ?? 0), 0
  );

  return (
    <div className="bud-month-totals-row">
      {/* Лейбл */}
      <div className="bud-month-totals-label">
        <Text size="xs" c="green.6" fw={700}
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', lineHeight: 1 }}>
          {label}
        </Text>
      </div>

      {/* Итоги по каждому счёту */}
      {activeAccounts.map((accId) => {
        const acc     = accounts.find((a) => a.id === accId) || { currency: 'RUB' };
        const t       = totalsByAccount[accId] || {};
        const net     = (t.income ?? 0) - (t.expense ?? 0) + (t.transfer_in ?? 0) - (t.transfer_out ?? 0);
        // Баланс на конец месяца — берём из balanceByAccount по последнему дню
        const closing = balanceByAccount[accId]?.[closingDateStr] ?? 0;

        return (
          <div key={accId} className="bud-month-totals-slot">
            {(t.income ?? 0) > 0 && (
              <Text size="xs" c="teal">+ {formatMoney(t.income, acc.currency)}</Text>
            )}
            {(t.expense ?? 0) > 0 && (
              <Text size="xs" c="red">− {formatMoney(t.expense, acc.currency)}</Text>
            )}
            {(t.transfer_in ?? 0) > 0 && (
              <Text size="xs" c="blue">↓ {formatMoney(t.transfer_in, acc.currency)}</Text>
            )}
            {(t.transfer_out ?? 0) > 0 && (
              <Text size="xs" c="blue">↑ {formatMoney(t.transfer_out, acc.currency)}</Text>
            )}
            {net !== 0 && (
              <Text size="xs" fw={600} c={net >= 0 ? 'teal' : 'red'} style={{ borderTop: '1px solid var(--mantine-color-gray-2)', paddingTop: 2, marginTop: 2 }}>
                {net >= 0 ? '+' : ''}{formatMoney(net, acc.currency)}
              </Text>
            )}
            {/* Баланс на конец месяца — главная цифра */}
            <Text size="sm" fw={700} c={closing >= 0 ? 'dark' : 'red'}>
              {formatMoney(closing, acc.currency)}
            </Text>
          </div>
        );
      })}

      <div className="bud-month-totals-filler" />

      {/* Гранд-итог = сумма балансов всех счетов на конец месяца */}
      <div className="bud-month-totals-total">
        <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>balance</Text>
        <Text size="sm" fw={700} c={grandClosing >= 0 ? 'dark' : 'red'}>
          {formatMoney(grandClosing, activeCurrency)}
        </Text>
      </div>
    </div>
  );
};

// ─── DayRow ───────────────────────────────────────────────────────
const DayRow = ({
  date, activeAccounts, accounts,
  txByAccountByDate, balanceByAccount,
  balanceMode, onAdd, isToday, stripe,
}) => {
  const dateStr   = date.format('YYYY-MM-DD');
  const dayNum    = date.date();
  const dayName   = WEEKDAYS[date.day()];
  const isWeekend = date.day() === 0 || date.day() === 6;

  let rowBg;
  if (isToday)        rowBg = 'var(--mantine-color-green-0)';
  else if (isWeekend) rowBg = stripe ? 'rgba(255,200,200,0.28)' : 'rgba(255,200,200,0.14)';
  else                rowBg = stripe ? 'rgba(0,0,0,0.018)' : 'transparent';

  const activeCurrency = accounts.find((a) => a.id === activeAccounts[0])?.currency || 'RUB';
  const dayTotal = activeAccounts.reduce(
    (sum, accId) => sum + (balanceByAccount[accId]?.[dateStr] ?? 0), 0
  );

  return (
    <div className="bud-day-row" id={isToday ? 'today_row' : undefined} style={{ background: rowBg }}>
      <div className={`bud-date-label ${isToday ? 'today' : ''}`}>
        {isToday ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{
              background: 'var(--mantine-color-green-6)', color: 'white',
              borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 13,
            }}>{dayNum}</div>
            <div className="bud-day-name">{dayName}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div className="bud-day-num" style={{
              color: isWeekend ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-gray-7)',
            }}>{dayNum}</div>
            <div className="bud-day-name" style={{
              color: isWeekend ? 'var(--mantine-color-red-3)' : undefined,
            }}>{dayName}</div>
          </div>
        )}
      </div>

      {activeAccounts.map((accId) => {
        const account = accounts.find((a) => a.id === accId) || { id: accId, currency: 'RUB' };
        return (
          <AccountSlot
            key={accId}
            account={account}
            transactions={txByAccountByDate[accId]?.[dateStr] || []}
            balance={balanceByAccount[accId]?.[dateStr] ?? 0}
            totals={null}
            mode={balanceMode}
            onAdd={onAdd}
            dateStr={dateStr}
          />
        );
      })}

      <div className="bud-flex-filler" />

      {activeAccounts.length > 0 && (
        <div className="bud-day-total">
          <Text size="xs" c="dimmed" style={{ fontSize: 10, marginBottom: 2 }}>total</Text>
          <Text size="sm" fw={600} c={dayTotal >= 0 ? 'dark' : 'red'}>
            {formatMoney(dayTotal, activeCurrency)}
          </Text>
        </div>
      )}
    </div>
  );
};

// ─── TimelineView ─────────────────────────────────────────────────
export const TimelineView = () => {
  const [searchParams] = useSearchParams();

  const activeAccounts = useBadgerStore((s) => s.activeAccounts);
  const balanceMode    = useBadgerStore((s) => s.balanceMode);
  const openEditor     = useBadgerStore((s) => s.openEditor);

  const startParam = searchParams.get('start') || dayjs().format('YYYY-MM');
  const endParam   = searchParams.get('end')   || dayjs().format('YYYY-MM');
  const start = dayjs(startParam + '-01').startOf('month');
  const end   = dayjs(endParam   + '-01').endOf('month');

  const { data: accounts = [] } = useAccounts();

  // Запрашиваем итоги предыдущего месяца перед началом диапазона
  // closing_balance(prev) = opening_balance(start) → с него начинается наш running balance
  const prevMonthKey = dayjs(startParam + '-01').subtract(1, 'month').format('YYYY-MM');
  const { data: prevTotals = [] } = useMonthTotals({
    month_key:  prevMonthKey,
    account_id: activeAccounts.length > 0 ? activeAccounts.join(',') : undefined,
  });

  // Map: account_id → opening_balance для первого месяца диапазона
  const openingByAccount = useMemo(() =>
    Object.fromEntries(
      (prevTotals?.content || prevTotals || []).map((t) => [t.account_id, t.closing_balance ?? 0])
    ),
  [prevTotals]);

  const { data: transactions = [], isLoading, isError } = useTransactions({
    start: start.format('YYYY-MM-DD'),
    end:   end.format('YYYY-MM-DD'),
    account_id: activeAccounts.length > 0 ? activeAccounts.join(',') : undefined,
  });

  // Массив дат DESC
  const dateArray = useMemo(() => {
    const days = [];
    let cur = end.clone();
    while (cur.isSameOrAfter(start, 'day')) {
      days.push(cur.clone());
      cur = cur.subtract(1, 'day');
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startParam, endParam]);

  // Уникальные месяцы в порядке отображения (DESC)
  const monthKeys = useMemo(() => {
    const seen = new Set();
    return dateArray
      .map((d) => d.format('YYYY-MM'))
      .filter((m) => { if (seen.has(m)) return false; seen.add(m); return true; });
  }, [dateArray]);

  const txByAccountByDate = useMemo(() => {
    const map = {};
    for (const tx of transactions) {
      if (!tx?.account_id || !tx?.occurred_at) continue;
      if (!map[tx.account_id]) map[tx.account_id] = {};
      if (!map[tx.account_id][tx.occurred_at]) map[tx.account_id][tx.occurred_at] = [];
      map[tx.account_id][tx.occurred_at].push(tx);
    }
    return map;
  }, [transactions]);

  const balanceByAccount = useMemo(() => {
    const result = {};
    for (const accId of activeAccounts) {
      result[accId] = {};
      const accTx = transactions
        .filter((tx) => tx?.account_id === accId && !Boolean(tx?.is_disabled))
        .sort((a, b) => (a.occurred_at || '').localeCompare(b.occurred_at || ''));

      // Стартуем от closing_balance предыдущего месяца, не от нуля
      const opening = openingByAccount[accId] ?? 0;
      let running = opening;
      const byDate = {};

      for (const tx of accTx) {
        const sign = ['income', 'transfer_in'].includes(tx.flow_kind) ? 1 : -1;
        running += sign * (tx.amount || 0);
        byDate[tx.occurred_at] = running;
      }

      // Протягиваем баланс на дни без транзакций
      let last = opening; // ← тоже стартуем от opening, не от 0
      for (const date of [...dateArray].reverse()) {
        const dateStr = date.format('YYYY-MM-DD');
        if (byDate[dateStr] !== undefined) last = byDate[dateStr];
        result[accId][dateStr] = last;
      }
    }
    return result;
  }, [transactions, activeAccounts, dateArray, openingByAccount]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        const el = document.getElementById('today_row');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) return <Center h={200}><Loader size="sm" /></Center>;
  if (isError)   return <Center h={200}><Text c="dimmed" size="sm">Could not load transactions</Text></Center>;
  if (activeAccounts.length === 0) return (
    <Center h={300}><Text c="dimmed" size="sm">Select accounts in the sidebar to get started</Text></Center>
  );

  const today   = dayjs().format('YYYY-MM-DD');
  const todayMK = dayjs().format('YYYY-MM');
  let rowIndex  = 0;

  // Группируем даты по месяцам для рендера
  const datesByMonth = {};
  for (const date of dateArray) {
    const mk = date.format('YYYY-MM');
    if (!datesByMonth[mk]) datesByMonth[mk] = [];
    datesByMonth[mk].push(date);
  }

  return (
    <div className="content-scroll bud-timeline" style={{ paddingBottom: 80 }}>

      {/* Шапка с названиями счетов */}
      <div className="bud-timeline-header">
        <div className="bud-date-label" style={{ visibility: 'hidden' }}>00</div>
        {activeAccounts.map((accId) => {
          const acc = accounts.find((a) => a.id === accId);
          return (
            <div key={accId} className="bud-account-slot bud-account-header">
              <Text size="xs" fw={600} c="green.7" truncate>{acc?.name || '…'}</Text>
              {acc && <Text size="xs" c="dimmed">{formatMoney(acc.balance_today ?? 0, acc.currency)}</Text>}
            </div>
          );
        })}
        <div className="bud-flex-filler" />
        <div className="bud-day-total">
          <Text size="xs" c="dimmed" fw={500}>Total</Text>
        </div>
      </div>

      {/* Рендерим помесячно DESC:
           [Итоги МАЯ]   ← конец мая = баланс на начало июня
           май 31..май 1
           [Итоги АПР]   ← конец апреля
           апр 30..апр 1
           ...
      */}
      {monthKeys.map((monthKey, monthIndex) => {
        const monthDates = datesByMonth[monthKey] || [];
        const monthDate  = dayjs(monthKey + '-01');

        // Последний день этого месяца — по нему берём closing balance
        const lastDayOfMonth = monthDate.endOf('month').format('YYYY-MM-DD');
        // Первый день следующего месяца — метка над строкой итогов
        const isCurrentMonth = monthKey === todayMK;
        // Лейбл итоговой строки
        const totalsLabel = isCurrentMonth ? 'now' : monthDate.format('MMM');

        return (
          <div key={monthKey}>
            {/* Итоговая строка — СВЕРХУ (конец месяца в DESC порядке) */}
            <MonthTotalsRow
              monthKey={monthKey}
              activeAccounts={activeAccounts}
              accounts={accounts}
              transactions={transactions}
              balanceByAccount={balanceByAccount}
              closingDateStr={lastDayOfMonth}
              label={totalsLabel}
            />

            {/* Заголовок месяца */}
            <div className="bud-month-header">
              {monthDate.format('MMMM YYYY')}
              {isCurrentMonth && (
                <Text component="span" size="xs" c="green.5" ml={8}>← current</Text>
              )}
            </div>

            {/* Строки дней */}
            {monthDates.map((date) => {
              const dateStr = date.format('YYYY-MM-DD');
              const isToday = dateStr === today;
              const stripe  = rowIndex % 2 === 1;
              rowIndex++;
              return (
                <DayRow
                  key={dateStr}
                  date={date}
                  activeAccounts={activeAccounts}
                  accounts={accounts}
                  txByAccountByDate={txByAccountByDate}
                  balanceByAccount={balanceByAccount}
                  balanceMode={balanceMode}
                  onAdd={openEditor}
                  isToday={isToday}
                  stripe={stripe}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
