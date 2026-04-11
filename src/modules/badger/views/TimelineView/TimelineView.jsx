import { useMemo, useEffect } from 'react';
import { Text, Center, Loader, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useBadgerStore } from '../../store/badgerStore';
import { useTransactions, useAccounts } from '../../api/badgerApi';
import { TransactionCard } from '../../components/TransactionCard/TransactionCard';
import { formatMoney } from '../../utils/badgerUtils';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const SlotBalance = ({ balance, totals, mode, currency }) => {
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

const AccountSlot = ({ account, transactions, balance, totals, mode, onAdd, dateStr }) => (
  <div
    className="bud-account-slot"
    onDoubleClick={(e) => {
      // двойной клик на пустую ячейку — открыть редактор
      if (e.target.closest('.bud-transaction-card')) return;
      onAdd({ date: dateStr, account_id: account?.id });
    }}
    title="Double-click to add transaction"
  >
    <div className="bud-slot-cards">
      {(transactions || []).map((tx) => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}
      <div className="bud-slot-add">
        <Button
          variant="subtle" color="gray" size="compact-xs"
          leftSection={<IconPlus size={11} />}
          onClick={() => onAdd({ date: dateStr, account_id: account?.id })}
          styles={{ root: { fontSize: 11 } }}
        >
          Add
        </Button>
      </div>
    </div>
    <SlotBalance
      balance={balance}
      totals={totals}
      mode={mode}
      currency={account?.currency || 'RUB'}
    />
  </div>
);

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
    <div
      className="bud-day-row"
      id={isToday ? 'today_row' : undefined}
      style={{ background: rowBg }}
    >
      {/* Дата */}
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
        const txList  = txByAccountByDate[accId]?.[dateStr] || [];
        const balance = balanceByAccount[accId]?.[dateStr] ?? 0;
        return (
          <AccountSlot
            key={accId}
            account={account}
            transactions={txList}
            balance={balance}
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

export const TimelineView = () => {
  const [searchParams] = useSearchParams();

  const activeAccounts = useBadgerStore((s) => s.activeAccounts);
  const balanceMode    = useBadgerStore((s) => s.balanceMode);
  const openEditor     = useBadgerStore((s) => s.openEditor);

  // Читаем диапазон из URL (start/end вместо month)
  const startParam = searchParams.get('start') || dayjs().format('YYYY-MM');
  const endParam   = searchParams.get('end')   || dayjs().format('YYYY-MM');

  const start = dayjs(startParam + '-01').startOf('month');
  const end   = dayjs(endParam   + '-01').endOf('month');

  const { data: accounts = [] } = useAccounts();

  const { data: transactions = [], isLoading, isError } = useTransactions({
    start: start.format('YYYY-MM-DD'),
    end:   end.format('YYYY-MM-DD'),
    account_id: activeAccounts.length > 0 ? activeAccounts.join(',') : undefined,
  });

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

      let running = 0;
      const byDate = {};
      for (const tx of accTx) {
        const sign = ['income', 'transfer_in'].includes(tx.flow_kind) ? 1 : -1;
        running += sign * (tx.amount || 0);
        byDate[tx.occurred_at] = running;
      }

      let last = 0;
      for (const date of [...dateArray].reverse()) {
        const dateStr = date.format('YYYY-MM-DD');
        if (byDate[dateStr] !== undefined) last = byDate[dateStr];
        result[accId][dateStr] = last;
      }
    }
    return result;
  }, [transactions, activeAccounts, dateArray]);

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

  if (isError) return (
    <Center h={200}>
      <Text c="dimmed" size="sm">Could not load transactions — check your connection</Text>
    </Center>
  );

  if (activeAccounts.length === 0) return (
    <Center h={300}>
      <Text c="dimmed" size="sm">Select accounts in the sidebar to get started</Text>
    </Center>
  );

  const today    = dayjs().format('YYYY-MM-DD');
  let rowIndex   = 0;
  let lastMonth  = null;

  return (
    <div className="content-scroll bud-timeline" style={{ paddingBottom: 80 }}>

      {/* Шапка */}
      <div className="bud-timeline-header">
        <div className="bud-date-label" style={{ visibility: 'hidden' }}>00</div>
        {activeAccounts.map((accId) => {
          const acc = accounts.find((a) => a.id === accId);
          return (
            <div key={accId} className="bud-account-slot bud-account-header">
              <Text size="xs" fw={600} c="green.7" truncate>{acc?.name || '…'}</Text>
              {acc && (
                <Text size="xs" c="dimmed">
                  {formatMoney(acc.balance_today ?? 0, acc.currency)}
                </Text>
              )}
            </div>
          );
        })}
        <div className="bud-flex-filler" />
        <div className="bud-day-total">
          <Text size="xs" c="dimmed" fw={500}>Total</Text>
        </div>
      </div>

      {dateArray.map((date) => {
        const dateStr  = date.format('YYYY-MM-DD');
        const isToday  = dateStr === today;
        const stripe   = rowIndex % 2 === 1;
        const monthKey = date.format('YYYY-MM');

        // Разделитель месяца
        const showMonthHeader = monthKey !== lastMonth;
        lastMonth = monthKey;
        rowIndex++;

        return (
          <div key={dateStr}>
            {showMonthHeader && (
              <div className="bud-month-header">
                {date.format('MMMM YYYY')}
              </div>
            )}
            <DayRow
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
          </div>
        );
      })}
    </div>
  );
};
