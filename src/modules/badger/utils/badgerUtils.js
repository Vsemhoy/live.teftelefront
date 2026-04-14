// ─────────────────────────────────────────────────────────────────
// Закон проекта: все суммы хранятся как INT (копейки/центы).
// Конвертация ТОЛЬКО здесь, ТОЛЬКО для UI.
// ─────────────────────────────────────────────────────────────────

/** Рубли → копейки: 1500 → 150000 */
export const toMinor = (amount) => Math.round(amount * 100);

/** Копейки → рубли: 150000 → 1500 */
export const toMajor = (minor) => minor / 100;

/** Форматировать минорные единицы в строку валюты */
export const formatMoney = (minor, currency = 'RUB') =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(minor / 100);

/** Форматировать без символа валюты, только число */
export const formatAmount = (minor, currency = 'RUB') =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(minor / 100);

/**
 * Знаковое число для отображения суммы в UI.
 * expense/transfer_out → отрицательное, income/transfer_in → положительное.
 */
export const signedAmount = (amount, flowKind) => {
  if (['expense', 'transfer_out'].includes(flowKind)) return -amount;
  return amount;
};

/**
 * Посчитать running balance внутри месяца.
 * transactions — плоский массив за месяц, отсортированный по occurred_at ASC + sort_order ASC.
 * Возвращает Map<'YYYY-MM-DD', balance_at_end_of_day>.
 */
export const calcDailyBalances = (openingBalance, transactions) => {
  const map = new Map();
  let running = openingBalance;

  for (const tx of transactions) {
    if (Boolean(tx.is_disabled)) continue;
    running += signedAmount(tx.amount, tx.flow_kind);
    map.set(tx.occurred_at, running);
  }

  return map;
};

/** month_key из Date или строки: '2026-04' */
export const toMonthKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 7);
};

/** Цвет суммы по flow_kind */
export const flowKindColor = (flowKind, isDisabled = false) => {
  if (isDisabled) return 'dimmed';
  switch (flowKind) {
    case 'income':          return 'teal';
    case 'expense':         return 'red';
    case 'transfer_out':    return 'blue';
    case 'transfer_in':     return 'blue';
    case 'adjustment':      return 'gray';
    case 'reconciliation':  return 'violet';
    default:                return 'gray';
  }
};

/** Префикс знака для отображения (+/-) */
export const flowKindSign = (flowKind) => {
  if (['income', 'transfer_in'].includes(flowKind)) return '+';
  if (['expense', 'transfer_out'].includes(flowKind)) return '−';
  if (flowKind === 'reconciliation') return '⚖';
  return '';
};

// ─── Процентная ставка — хранится как INT (23.5% → 2350) ─────────
// Никакого DECIMAL на бэке — только INT, как и суммы.

/** 23.5 → 2350 */
export const rateToInt   = (rate)    => Math.round(parseFloat(rate) * 100);
/** 2350 → 23.5 */
export const rateToFloat = (rateInt) => rateInt / 100;
/** 2350 → "23.50" для отображения */
export const rateToStr   = (rateInt) => (rateInt / 100).toFixed(2);

/**
 * Считает ежедневное начисление процентов для кредитного счёта.
 * balance  — текущий баланс в минорных единицах (отрицательный = долг)
 * rateInt  — годовая ставка как INT (2350 = 23.50%)
 * date     — dayjs объект текущего дня
 * Возвращает начисление в минорных единицах (отрицательное — долг растёт)
 */
export const calcDailyInterest = (balance, rateInt, date) => {
  if (!rateInt || balance >= 0) return 0;
  const daysInYear = date.isLeapYear() ? 366 : 365;
  // rateInt / 10000 = ставка в долях (2350 / 10000 = 0.235)
  return Math.round(balance * rateInt / 10000 / daysInYear);
};
