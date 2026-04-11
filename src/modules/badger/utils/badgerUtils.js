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
    case 'income':       return 'teal';
    case 'expense':      return 'red';
    case 'transfer_out': return 'blue';
    case 'transfer_in':  return 'blue';
    case 'adjustment':   return 'gray';
    default:             return 'gray';
  }
};

/** Префикс знака для отображения (+/-) */
export const flowKindSign = (flowKind) => {
  if (['income', 'transfer_in'].includes(flowKind)) return '+';
  if (['expense', 'transfer_out'].includes(flowKind)) return '−';
  return '';
};
