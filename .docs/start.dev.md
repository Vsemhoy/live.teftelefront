Отлично, теперь у меня полная картина. Давай сделаю подробный план.Всё, у меня полная картина. Теперь пишу детальный план.Теперь у меня есть всё. Буду делать детальный план.Вот полная картина. Теперь детально по каждому пункту.

---

## Что я увидел в старом коде

**Фронт:** React CRA + Ant Design, Cookies для JWT, локальный кэш через кастомный `useEventorStorage`, MDXEditor + ReactMarkdown. Логика нормальная, но всё разбросано, нет нормального стейт-менеджмента для запросов, нет поиска вообще.

**Бэк:** Laravel 12, ULID как primary key (26 символов), JWT-авторизация кастомная, структура БД продуманная — `evt_events`, `evt_sections`, `evt_types`, `evt_categories`, `evt_media`, `evt_embeds`.

---

## Архитектура нового фронта

### Стек
- **Mantine v7** — максимально похоже на Fluent/Outlook по ощущениям, хорошая система тем
- **Vite** вместо CRA — на порядок быстрее
- **Zustand** — лёгкий стейт для UI (активная секция, вид, открытый эдитор)
- **TanStack Query** — запросы к API, кэш, оптимистичные обновления
- **React Router v6** — модульный роутинг
- **dayjs** — уже используется, оставляем
- **@mdxeditor + react-markdown + react-syntax-highlighter** — уже работает, переносим

### Структура проекта
```
src/
  app/           — роутер, провайдеры, shell
  modules/
    auth/        — логин/регистрация
    eventor/
      api/       — все запросы через TanStack Query
      store/     — Zustand: activeSection, viewMode, searchQuery
      views/
        FlowView/
        GridCalendar/
        SearchPanel/
      components/
        EventCard/
        EventEditor/
        SectionsSidenav/
        Toolbar/
  shared/        — ui-компоненты, хелперы
```

### Три вида Eventor'а
1. **Flow view** — как сейчас, хронологическая лента по дням. Переносим логику, переписываем на Mantine.
2. **Grid calendar** — классический месячный вид ячейками (как Outlook). Клик на день → список событий.
3. **Search panel** — отдельная вкладка с полнотекстовым поиском + фильтры по типу, секции, дате. **Главный новый фичей.**

### Auth
Оставляем JWT + cookies, просто переписываем форму на Mantine Modal, добавляем refresh token логику в interceptor Axios.

---

## ТЗ на бэк (для тебя)

### Новый эндпоинт поиска
```
POST /eventor/search
{
  "q": "string",           // поисковый запрос
  "sections": ["id1"],     // фильтр секций, null = все
  "types": ["id1"],        // фильтр типов
  "date_from": "YYYY-MM-DD",
  "date_to":   "YYYY-MM-DD",
  "page": 1,
  "per_page": 20
}
```
Реализация: `FULLTEXT INDEX` на `(name, content)` в `evt_events`, `MATCH(name, content) AGAINST(? IN BOOLEAN MODE)`. Возврат: `{ content: [], meta: { total, page, per_page } }`.

### Мелкие улучшения существующих эндпоинтов
- `getmyevents` — добавить `include_types=1` чтобы возвращал тип с цветом в одном запросе (сейчас типы грузятся отдельно)
- `saveevent` / `updateevent` — добавить возврат полного объекта события после сохранения (нужно для оптимистичного UI)

### Миграция данных
Никаких изменений в структуре таблиц не нужно — новый фронт работает с тем же API. Только добавить FULLTEXT индекс:
```sql
ALTER TABLE evt_events ADD FULLTEXT INDEX ft_search (name, content);
```

---

## С чего начнём

Предлагаю такой порядок:
1. **Scaffold** — Vite + Mantine + Router + Zustand + TanStack Query, базовый shell с nav
2. **Auth** — логин/логаут, protected routes
3. **Eventor Flow View** — переписываем существующий вид
4. **Search Panel** — новый полнотекстовый поиск
5. **Grid Calendar** — месячный вид

Что скажешь — начинаем с scaffold или есть правки по архитектуре?




---------------------------


Отлично, всё чётко. Фиксирую механику.

---

## Draft & Session — финальный дизайн

### Хранилище черновиков — IndexedDB

Используем **Dexie.js** (обёртка над IndexedDB, удобный API). База живёт в браузере без привязки к юзеру — намеренно:

```
IDB: teftele_drafts
  drafts table:
    localId     — uuid генерим на фронте (crypto.randomUUID)
    name
    content
    setdate
    section_id  — nullable, просто строка, без FK
    type_id     — nullable
    created_at
    updated_at
    syncStatus  — 'pending' | 'synced' | 'error'
    errorMsg    — nullable, что пошло не так при последней попытке sync
```

Никакого `user_id` в IDB — черновик виден всегда, даже если разлогинился. Это и есть суть.

---

### Логика создания события

```
Юзер нажимает Save
       │
       ▼
  Есть сеть И залогинен?
    ├── ДА  → POST /eventor/saveevent → успех → всё норм
    │                                 → ошибка сети → fallback в IDB (syncStatus: 'error')
    └── НЕТ → сохранить в IDB (syncStatus: 'pending')
              показать баннер "Saved as draft — no connection"
```

Никакой автоматики при восстановлении связи — только кнопка.

---

### UI черновиков

В сайднаве Eventor'а отдельный пункт **"Drafts"** со счётчиком — `Drafts (3)`. Вид — простой список карточек, каждая с кнопкой **"Upload to server"**. При клике:

1. Проверяем авторизацию — если нет, показываем "Login required to sync"
2. POST запрос с данными черновика
3. Сервер возвращает реальный `id` → удаляем из IDB, добавляем в основной список
4. Если ошибка — ставим `syncStatus: 'error'`, показываем причину

Никакого авто-матчинга по содержимому, никаких дублей — один черновик, одна ручная кнопка.

---

### Сессия — бессрочная

**Проблема старой реализации:** access token жил несколько часов, refresh token не использовался нормально.

**Новая схема:**

На бэке нужно два токена:
- **Access token** — короткий, 60 минут, в `httpOnly` cookie
- **Refresh token** — долгий, без срока истечения (или очень длинный — год), в отдельной `httpOnly` cookie, хранится в таблице `refresh_tokens`

На фронте Axios interceptor:

```javascript
// При 401 — тихо рефрешим и повторяем запрос
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await axiosInstance.post('/auth/refresh'); // обновляет access cookie
      return axiosInstance(error.config);        // повторяем оригинальный запрос
    }
    return Promise.reject(error);
  }
);
```

Выход — только явный `POST /auth/logout` который инвалидирует refresh token в БД и чистит обе куки.

**На бэке** таблица `refresh_tokens` уже есть в миграциях — просто надо реализовать эндпоинт `POST /auth/refresh` если его нет.

---

### ТЗ на бэк по сессиям

- `POST /auth/refresh` — принимает refresh cookie, возвращает новый access cookie. Если refresh невалиден/отсутствует — `401`.
- `POST /auth/logout` — удаляет запись из `refresh_tokens`, чистит обе куки.
- Access token TTL: 60 минут. Refresh token TTL: без ограничений (или 1 год — на твой вкус), `is_revoked` флаг в таблице.

---

Итого у нас теперь полное ТЗ — и на фронт, и на бэк. Готов стартовать scaffold?