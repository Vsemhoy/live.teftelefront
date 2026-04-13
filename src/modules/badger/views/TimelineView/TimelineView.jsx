import { useMemo, useEffect, useState, useCallback } from 'react';
import { Text, Center, Loader, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter  from 'dayjs/plugin/isSameOrAfter';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useBadgerStore } from '../../store/badgerStore';
import { useTransactions, useAccounts, useMonthTotals, useMoveTransaction, useSaveTransaction } from '../../api/badgerApi';
import { formatMoney, flowKindColor, flowKindSign } from '../../utils/badgerUtils';
import { notifications } from '@mantine/notifications';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ─── DraggableCard ────────────────────────────────────────────────
const DraggableCard = ({ transaction, onDoubleClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: transaction.id,
    data: { transaction },
  });

  const disabled  = Boolean(transaction.is_disabled);
  const isPending = transaction.status === 'pending';
  const kindColor = flowKindColor(transaction.flow_kind, disabled);
  const kindSign  = flowKindSign(transaction.flow_kind);

  const notePreview = transaction.note
    ? transaction.note.split('\n')[0].slice(0, 60) +
      (transaction.note.split('\n')[0].length > 60 || transaction.note.includes('\n') ? '…' : '')
    : null;

  return (
    <div
      ref={setNodeRef}
      className="bud-transaction-card"
      style={{
        opacity:    isDragging ? 0.35 : disabled ? 0.5 : 1,
        cursor:     'grab',
        borderStyle: isPending ? 'dashed' : 'solid',
        border:     `1px solid var(--mantine-color-gray-3)`,
        borderRadius: 6,
        padding:    '5px 8px',
        background: 'white',
        userSelect: 'none',
        transition: 'box-shadow 0.15s',
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(transaction.id); }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
        <Text size="sm" fw={600} c={disabled ? 'dimmed' : kindColor} style={{ whiteSpace: 'nowrap' }}>
          {kindSign}{formatMoney(transaction.amount)}
        </Text>
      </div>
      {transaction.title && (
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }} lineClamp={1}>{transaction.title}</Text>
      )}
      {notePreview && (
        <Text size="xs" c="dimmed"
          style={{ fontStyle: 'italic', opacity: 0.7, fontFamily: 'monospace', fontSize: 11 }}
          lineClamp={1}>{notePreview}</Text>
      )}
    </div>
  );
};

// ─── DroppableSlot ────────────────────────────────────────────────
// id формат: "DATE__ACCOUNT_ID"
const DroppableSlot = ({ dateStr, accountId, children, onAdd }) => {
  const dropId = `${dateStr}__${accountId}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { dateStr, accountId } });

  return (
    <div
      ref={setNodeRef}
      className="bud-account-slot"
      style={{
        background: isOver ? 'var(--mantine-color-green-0)' : undefined,
        outline: isOver ? '2px dashed var(--mantine-color-green-4)' : undefined,
        transition: 'background 0.15s, outline 0.15s',
      }}
      onDoubleClick={(e) => {
        if (e.target.closest('.bud-transaction-card')) return;
        onAdd({ date: dateStr, account_id: accountId });
      }}
    >
      {children}
    </div>
  );
};

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

// ─── MonthTotalsRow ───────────────────────────────────────────────
const MonthTotalsRow = ({ monthKey, activeAccounts, accounts, transactions, balanceByAccount, closingDateStr, label, variant = 'closing' }) => {
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
  const isOpening = variant === 'opening';

  const grandClosing = activeAccounts.reduce(
    (sum, accId) => sum + (balanceByAccount[accId]?.[closingDateStr] ?? 0), 0
  );

  return (
    <div className={`bud-month-totals-row ${isOpening ? 'bud-month-totals-opening' : ''}`}>
      <div className="bud-month-totals-label">
        <Text size="xs" c={isOpening ? 'dimmed' : 'green.6'} fw={700}
          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', lineHeight: 1 }}>
          {label}
        </Text>
      </div>

      {activeAccounts.map((accId) => {
        const acc     = accounts.find((a) => a.id === accId) || { currency: 'RUB' };
        const t       = totalsByAccount[accId] || {};
        const net     = (t.income ?? 0) - (t.expense ?? 0) + (t.transfer_in ?? 0) - (t.transfer_out ?? 0);
        const closing = balanceByAccount[accId]?.[closingDateStr] ?? 0;

        return (
          <div key={accId} className="bud-month-totals-slot">
            {!isOpening && (t.income ?? 0) > 0 && <Text size="xs" c="teal">+ {formatMoney(t.income, acc.currency)}</Text>}
            {!isOpening && (t.expense ?? 0) > 0 && <Text size="xs" c="red">− {formatMoney(t.expense, acc.currency)}</Text>}
            {!isOpening && (t.transfer_in ?? 0) > 0 && <Text size="xs" c="blue">↓ {formatMoney(t.transfer_in, acc.currency)}</Text>}
            {!isOpening && (t.transfer_out ?? 0) > 0 && <Text size="xs" c="blue">↑ {formatMoney(t.transfer_out, acc.currency)}</Text>}
            {!isOpening && net !== 0 && (
              <Text size="xs" fw={600} c={net >= 0 ? 'teal' : 'red'}
                style={{ borderTop: '1px solid var(--mantine-color-gray-2)', paddingTop: 2, marginTop: 2 }}>
                {net >= 0 ? '+' : ''}{formatMoney(net, acc.currency)}
              </Text>
            )}
            <Text size="sm" fw={isOpening ? 500 : 700} c={closing >= 0 ? (isOpening ? 'dimmed' : 'dark') : 'red'}>
              {formatMoney(closing, acc.currency)}
            </Text>
          </div>
        );
      })}

      <div className="bud-month-totals-filler" />

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
const DayRow = ({ date, activeAccounts, accounts, txByAccountByDate, balanceByAccount, balanceMode, onAdd, onCardDoubleClick, isToday, stripe }) => {
  const dateStr   = date.format('YYYY-MM-DD');
  const dayNum    = date.date();
  const dayName   = WEEKDAYS[date.day()];
  const isWeekend = date.day() === 0 || date.day() === 6;

  let rowBg;
  if (isToday)        rowBg = 'var(--mantine-color-green-0)';
  else if (isWeekend) rowBg = stripe ? 'rgba(255,200,200,0.28)' : 'rgba(255,200,200,0.14)';
  else                rowBg = stripe ? 'rgba(0,0,0,0.018)' : 'transparent';

  const activeCurrency = accounts.find((a) => a.id === activeAccounts[0])?.currency || 'RUB';
  const dayTotal = activeAccounts.reduce((sum, accId) => sum + (balanceByAccount[accId]?.[dateStr] ?? 0), 0);

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
        const txList  = txByAccountByDate[accId]?.[dateStr] || [];
        const balance = balanceByAccount[accId]?.[dateStr] ?? 0;

        return (
          <DroppableSlot key={accId} dateStr={dateStr} accountId={accId} onAdd={onAdd}>
            <div className="bud-slot-cards">
              {txList.map((tx) => (
                <DraggableCard key={tx.id} transaction={tx} onDoubleClick={onCardDoubleClick} />
              ))}
              <div className="bud-slot-add">
                <Button variant="subtle" color="gray" size="compact-xs"
                  leftSection={<IconPlus size={11} />}
                  onClick={() => onAdd({ date: dateStr, account_id: accId })}
                  styles={{ root: { fontSize: 11 } }}>
                  Add
                </Button>
              </div>
            </div>
            <SlotBalance balance={balance} mode={balanceMode} currency={account.currency} totals={null} />
          </DroppableSlot>
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

// ─── DragOverlayCard — призрак при перетаскивании ────────────────
const DragOverlayCard = ({ transaction }) => {
  if (!transaction) return null;
  const kindColor = flowKindColor(transaction.flow_kind);
  const kindSign  = flowKindSign(transaction.flow_kind);
  return (
    <div style={{
      background: 'white',
      border: '2px solid var(--mantine-color-green-4)',
      borderRadius: 6,
      padding: '5px 8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      minWidth: 120,
      cursor: 'grabbing',
    }}>
      <Text size="sm" fw={700} c={kindColor}>{kindSign}{formatMoney(transaction.amount)}</Text>
      {transaction.title && <Text size="xs" c="dimmed" lineClamp={1}>{transaction.title}</Text>}
    </div>
  );
};

// ─── TimelineView ─────────────────────────────────────────────────
export const TimelineView = () => {
  const [searchParams] = useSearchParams();
  const [activeCard, setActiveCard] = useState(null); // для DragOverlay
  const [shiftHeld,  setShiftHeld]  = useState(false); // Shift зажат при drop

  // Слушаем Shift глобально — важно именно при drop, не при начале drag
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Shift') setShiftHeld(e.type === 'keydown'); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup',   onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup',   onKey);
    };
  }, []);

  const activeAccounts = useBadgerStore((s) => s.activeAccounts);
  const balanceMode    = useBadgerStore((s) => s.balanceMode);
  const openEditor     = useBadgerStore((s) => s.openEditor);
  const openReader     = useBadgerStore((s) => s.openReader);

  const startParam = searchParams.get('start') || dayjs().format('YYYY-MM');
  const endParam   = searchParams.get('end')   || dayjs().format('YYYY-MM');
  const start = dayjs(startParam + '-01').startOf('month');
  const end   = dayjs(endParam   + '-01').endOf('month');

  const { data: accounts = [] } = useAccounts();

  const prevMonthKey = dayjs(startParam + '-01').subtract(1, 'month').format('YYYY-MM');
  const { data: prevTotals = [] } = useMonthTotals({
    month_key:  prevMonthKey,
    account_id: activeAccounts.length > 0 ? activeAccounts.join(',') : undefined,
  });

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

  const moveTransaction  = useMoveTransaction();
  const saveTransaction  = useSaveTransaction();

  // DnD сенсоры
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 5 } }),
  );

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

  const monthKeys = useMemo(() => {
    const seen = new Set();
    return dateArray.map((d) => d.format('YYYY-MM')).filter((m) => { if (seen.has(m)) return false; seen.add(m); return true; });
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

      const opening = openingByAccount[accId] ?? 0;
      let running   = opening;
      const byDate  = {};

      for (const tx of accTx) {
        const sign = ['income', 'transfer_in'].includes(tx.flow_kind) ? 1 : -1;
        running += sign * (tx.amount || 0);
        byDate[tx.occurred_at] = running;
      }

      let last = opening;
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

  // ── DnD handlers ──────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    const tx = event.active.data.current?.transaction;
    if (tx) setActiveCard(tx);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const tx = active.data.current?.transaction;
    if (!tx) return;

    // over.id формат: "DATE__ACCOUNT_ID"
    const [targetDate, targetAccountId] = over.id.split('__');
    if (!targetDate || !targetAccountId) return;

    const sameDate    = targetDate === tx.occurred_at;
    const sameAccount = targetAccountId === tx.account_id;
    if (sameDate && sameAccount) return;

    // Проверяем валюту — нельзя тащить между счетами разных валют
    const srcAccount = accounts.find((a) => a.id === tx.account_id);
    const dstAccount = accounts.find((a) => a.id === targetAccountId);
    if (srcAccount && dstAccount && srcAccount.currency !== dstAccount.currency) {
      notifications.show({ message: 'Cannot move between accounts with different currencies', color: 'red' });
      return;
    }

    // isShift = Shift зажат в момент drop (читаем из state, обновляется live)
    const isShift = shiftHeld;

    if (isShift) {
      // Создаём копию транзакции в целевой ячейке
      const { id: _id, ...rest } = tx;
      saveTransaction.mutate({
        ...rest,
        occurred_at: targetDate,
        account_id:  targetAccountId,
        month_key:   targetDate.slice(0, 7),
      }, {
        onSuccess: () => notifications.show({ message: 'Transaction copied', color: 'green', autoClose: 1500 }),
        onError:   () => notifications.show({ message: 'Failed to copy', color: 'red' }),
      });
    } else {
      // Перемещаем
      moveTransaction.mutate({
        id:          tx.id,
        occurred_at: sameDate    ? undefined : targetDate,
        account_id:  sameAccount ? undefined : targetAccountId,
      }, {
        onError: () => notifications.show({ message: 'Failed to move', color: 'red' }),
      });
    }
  }, [accounts, moveTransaction, saveTransaction, shiftHeld]);

  const handleCardDoubleClick = useCallback((txId) => {
    openReader({ id: txId });
  }, [openReader]);

  if (isLoading) return <Center h={200}><Loader size="sm" /></Center>;
  if (isError)   return <Center h={200}><Text c="dimmed" size="sm">Could not load transactions</Text></Center>;
  if (activeAccounts.length === 0) return (
    <Center h={300}><Text c="dimmed" size="sm">Select accounts in the sidebar to get started</Text></Center>
  );

  const today = dayjs().format('YYYY-MM-DD');
  const todayMK = dayjs().format('YYYY-MM');
  let rowIndex  = 0;

  const datesByMonth = {};
  for (const date of dateArray) {
    const mk = date.format('YYYY-MM');
    if (!datesByMonth[mk]) datesByMonth[mk] = [];
    datesByMonth[mk].push(date);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="content-scroll bud-timeline" style={{ paddingBottom: 80 }}>

        {/* Шапка */}
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

        {monthKeys.map((monthKey, monthIndex) => {
          const monthDates     = datesByMonth[monthKey] || [];
          const monthDate      = dayjs(monthKey + '-01');
          const isCurrentMonth = monthKey === todayMK;
          const isLastMonth    = monthIndex === monthKeys.length - 1;
          const lastDayOfMonth  = monthDate.endOf('month').format('YYYY-MM-DD');
          const firstDayOfMonth = monthDate.startOf('month').format('YYYY-MM-DD');

          return (
            <div key={monthKey}>
              <MonthTotalsRow
                monthKey={monthKey} activeAccounts={activeAccounts}
                accounts={accounts} transactions={transactions}
                balanceByAccount={balanceByAccount}
                closingDateStr={lastDayOfMonth}
                label={isCurrentMonth ? 'now' : 'end'}
                variant="closing"
              />

              <div className="bud-month-header">
                {monthDate.format('MMMM YYYY')}
                {isCurrentMonth && <Text component="span" size="xs" c="green.5" ml={8}>← current</Text>}
              </div>

              {monthDates.map((date) => {
                const dateStr = date.format('YYYY-MM-DD');
                const isToday = dateStr === today;
                const stripe  = rowIndex % 2 === 1;
                rowIndex++;
                return (
                  <DayRow
                    key={dateStr} date={date}
                    activeAccounts={activeAccounts} accounts={accounts}
                    txByAccountByDate={txByAccountByDate}
                    balanceByAccount={balanceByAccount}
                    balanceMode={balanceMode}
                    onAdd={openEditor}
                    onCardDoubleClick={handleCardDoubleClick}
                    isToday={isToday} stripe={stripe}
                  />
                );
              })}

              {isLastMonth && (
                <MonthTotalsRow
                  monthKey={monthKey} activeAccounts={activeAccounts}
                  accounts={accounts} transactions={transactions}
                  balanceByAccount={balanceByAccount}
                  closingDateStr={firstDayOfMonth}
                  label="start" variant="opening"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Призрак при перетаскивании */}
      <DragOverlay dropAnimation={null}>
        {activeCard ? <DragOverlayCard transaction={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
