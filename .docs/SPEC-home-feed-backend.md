# Бэк — Главная лента (Home Feed)

> ТЗ для `FeedController`. Один эндпоинт, один UNION-запрос, три модуля.

---

## Эндпоинт

```
GET /api/feed
Auth: auth.jwt
```

### Query-параметры

| Параметр | Тип | Дефолт | Описание |
|----------|-----|--------|----------|
| `filter` | string | `all` | `all` / `eventor` / `exploiter` / `ledger` |
| `before` | ISO datetime | null | Курсор пагинации: `occurred_at < before` |
| `limit` | int | 30 | Макс. кол-во записей (cap 100) |

### Ответ

```json
{
  "data": [
    {
      "id": "ULID",
      "source": "eventor",
      "name": "Рабочий день — среда",
      "occurred_at": "2026-07-09",
      "snippet": "Начало: 09:00 · Деплой Exploiter",
      "section_name": "Работа",
      "amount": null,
      "part_cost": null,
      "labor_cost": null,
      "time_total_min": null,
      "thing_name": null,
      "account_name": null,
      "category_name": null,
      "status": null,
      "priority": null,
      "is_overdue": false,
      "ledger_linked": false,
      "eventor_linked": false
    }
  ],
  "meta": {
    "has_more": true,
    "next_before": "2026-07-04T00:00:00"
  }
}
```

Все поля всегда присутствуют (null если не относится к модулю).
Фронт рендерит по `source`, остальное игнорирует.

---

## SQL — UNION-запрос

```sql
-- Eventor
SELECT
    e.id,
    'eventor' AS source,
    e.name,
    e.occurred_at,
    LEFT(c.body_md, 120) AS snippet,
    s.name AS section_name,
    NULL AS amount,
    NULL AS part_cost,
    NULL AS labor_cost,
    NULL AS time_total_min,
    NULL AS thing_name,
    NULL AS account_name,
    NULL AS category_name,
    NULL AS status,
    NULL AS priority,
    0 AS is_overdue,
    0 AS ledger_linked,
    0 AS eventor_linked
FROM evt_events e
LEFT JOIN evt_sections s ON s.id = e.section_id
LEFT JOIN cnt_contents c ON c.source_module = 'eventor'
    AND c.source_id = e.id
    AND c.is_primary = 1
WHERE e.user_id = :userId
    AND e.occurred_at <= :now

UNION ALL

-- Exploiter
SELECT
    r.id,
    'exploiter' AS source,
    COALESCE(r.note, '') AS name,
    r.occurred_at,
    NULL AS snippet,
    NULL AS section_name,
    NULL AS amount,
    r.part_cost,
    r.labor_cost,
    (r.time_self_min + r.time_service_min) AS time_total_min,
    t.name AS thing_name,
    NULL AS account_name,
    NULL AS category_name,
    r.status,
    r.priority,
    CASE WHEN r.status = 20 AND r.occurred_at < CURDATE() THEN 1 ELSE 0 END AS is_overdue,
    CASE WHEN EXISTS(
        SELECT 1 FROM led_transactions lt WHERE lt.exploiter_event_id = r.id
    ) THEN 1 ELSE 0 END AS ledger_linked,
    CASE WHEN EXISTS(
        SELECT 1 FROM evt_events ev WHERE ev.exploiter_event_id = r.id
    ) THEN 1 ELSE 0 END AS eventor_linked
FROM stf_register r
LEFT JOIN stf_things t ON t.id = r.thing_id
WHERE r.user_id = :userId
    AND r.status IS NOT NULL  -- только Exploiter-записи (со статусом)

UNION ALL

-- Ledger
SELECT
    tx.id,
    'ledger' AS source,
    tx.name,
    tx.occurred_at,
    NULL AS snippet,
    NULL AS section_name,
    tx.amount,
    NULL AS part_cost,
    NULL AS labor_cost,
    NULL AS time_total_min,
    NULL AS thing_name,
    a.name AS account_name,
    cat.name AS category_name,
    NULL AS status,
    NULL AS priority,
    0 AS is_overdue,
    0 AS ledger_linked,
    0 AS eventor_linked
FROM led_transactions tx
LEFT JOIN led_accounts a ON a.id = tx.account_id
LEFT JOIN led_categories cat ON cat.id = tx.category_id
WHERE tx.user_id = :userId
    AND tx.is_disabled = 0

-- Объединённая сортировка + пагинация
ORDER BY occurred_at DESC
LIMIT :limit
```

### Фильтрация по модулю

Если `filter != 'all'` — оставляем только нужный SELECT,
убираем UNION ALL. Не фильтруем поверх UNION —
это медленнее, чем убрать ненужные ветки.

### Пагинация

`before` = `occurred_at` последней записи предыдущей страницы.
Добавляется в WHERE каждой ветки: `AND occurred_at < :before`.
`has_more` = true если вернулось `limit` записей.

---

## Контроллер

```
app/Http/Controllers/Feed/FeedController.php
```

```php
class FeedController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user('jwt')->id;
        $filter = $request->get('filter', 'all');
        $limit  = min((int) $request->get('limit', 30), 100);
        $before = $request->get('before'); // ISO datetime или null

        $queries = [];

        if ($filter === 'all' || $filter === 'eventor') {
            $queries[] = $this->eventorQuery($userId, $before);
        }
        if ($filter === 'all' || $filter === 'exploiter') {
            $queries[] = $this->exploiterQuery($userId, $before);
        }
        if ($filter === 'all' || $filter === 'ledger') {
            $queries[] = $this->ledgerQuery($userId, $before);
        }

        // UNION ALL
        $union = array_shift($queries);
        foreach ($queries as $q) {
            $union = $union->unionAll($q);
        }

        $items = DB::query()
            ->fromSub($union, 'feed')
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get();

        $hasMore = $items->count() === $limit;
        $nextBefore = $hasMore ? $items->last()->occurred_at : null;

        return response()->json([
            'data' => $items,
            'meta' => [
                'has_more'    => $hasMore,
                'next_before' => $nextBefore,
            ],
        ]);
    }
}
```

### Разделение Exploiter vs Stuffer записей

`stf_register` содержит и Stuffer-события (moved, lent…) и Exploiter-события.
Различие: Exploiter-записи имеют `status IS NOT NULL` (workflow-статус из lifecycle).
Stuffer-записи не имеют workflow-статуса — у них `status IS NULL`.

В ленту попадают **только Exploiter-записи** (`WHERE r.status IS NOT NULL`).
Stuffer-события (перемещения) в общую ленту не идут — это шум.

---

## Роуты

```php
// routes/api.php
Route::middleware('auth.jwt')->group(function () {
    Route::get('/feed', [FeedController::class, 'index']);
});
```

---

## Индексы (уже есть)

Запрос опирается на:
- `evt_events` — `user_id` + `occurred_at` (уже есть)
- `stf_register` — `stf_register_status_occurred_idx` (добавлен в exploiter migration)
- `led_transactions` — `user_id` + `occurred_at` (уже есть)
- `cnt_contents` — `cnt_source_primary_sort_idx` (добавлен в contentor migration)

Новых индексов не нужно.

---

## Фронт — подключение

Заменить мок в `homeApi.js`:

```js
export const useHomeFeed = ({ filter } = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['home_feed', filter],
    queryFn: () => api.get('/feed', {
      params: { filter, limit: 30 }
    }).then(r => r.data.data),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};
```

---

## Будущее (не сейчас)

- **Infinite scroll**: фронт передаёт `before = meta.next_before` → следующая страница
- **Подписки**: UNION добавляет ветку `WHERE user_id IN (SELECT author_id FROM sys_subscriptions) AND access = 3`
- **Shared ресурсы**: ветка `WHERE thing_id IN (SELECT resource_id FROM sys_sharing WHERE guest_id = :userId)`
- **Порог значимости**: Ledger в ленте только `WHERE ABS(amount) > 500000` (> 5000₽)
- **Eventor snippet**: `LEFT JOIN cnt_contents` уже заложен, snippet = первые 120 символов body_md
