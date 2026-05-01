// ── Книги ─────────────────────────────────────────────────────────
export const MOCK_BOOKS = [
  {
    id: 'book-1',
    title: 'Архитектура фронтенда',
    description: 'Паттерны, подходы и решения для современных React-приложений. Живой документ.',
    cover_color: '#B5D4F4',
    access: 3,
    user_id: 'user-1',
    user: { id: 'user-1', name: 'Иван К.' },
    doc_count: 12,
    tags: ['react', 'architecture', 'patterns'],
    created_at: '2025-11-10',
    updated_at: '2026-04-28',
  },
  {
    id: 'book-2',
    title: 'Личные финансы',
    description: 'Система учёта, инвестиции, бюджет. Всё что нужно знать о деньгах.',
    cover_color: '#9FE1CB',
    access: 1,
    user_id: 'user-1',
    user: { id: 'user-1', name: 'Иван К.' },
    doc_count: 8,
    tags: ['finance', 'budget'],
    created_at: '2025-09-01',
    updated_at: '2026-04-20',
  },
  {
    id: 'book-3',
    title: 'UX паттерны',
    description: 'Сборник решений типичных задач проектирования интерфейсов.',
    cover_color: '#FAC775',
    access: 3,
    user_id: 'user-1',
    user: { id: 'user-1', name: 'Иван К.' },
    doc_count: 5,
    tags: ['ux', 'design', 'patterns'],
    created_at: '2026-01-15',
    updated_at: '2026-04-25',
  },
  {
    id: 'book-4',
    title: 'Физика для программистов',
    description: 'Механика, электродинамика, термодинамика — через призму кода.',
    cover_color: '#F4C0D1',
    access: 3,
    user_id: 'user-2',
    user: { id: 'user-2', name: 'Алекс Н.' },
    doc_count: 24,
    tags: ['physics', 'science'],
    created_at: '2024-06-01',
    updated_at: '2026-03-10',
  },
  {
    id: 'book-5',
    title: 'Биошок: нарративный разбор',
    description: 'Как Левин выстроил три игры вокруг одного философского конфликта.',
    cover_color: '#AFA9EC',
    access: 2,
    user_id: 'user-1',
    user: { id: 'user-1', name: 'Иван К.' },
    doc_count: 7,
    tags: ['games', 'narrative', 'bioshock'],
    created_at: '2026-02-14',
    updated_at: '2026-04-30',
  },
  {
    id: 'book-6',
    title: 'Laravel internals',
    description: 'Как устроен фреймворк изнутри: контейнер, pipeline, eloquent.',
    cover_color: '#F0997B',
    access: 3,
    user_id: 'user-2',
    user: { id: 'user-2', name: 'Алекс Н.' },
    doc_count: 9,
    tags: ['laravel', 'php', 'backend'],
    created_at: '2025-07-20',
    updated_at: '2026-04-15',
  },
];

// ── Документы ─────────────────────────────────────────────────────
export const MOCK_DOCUMENTS = {
  'book-3': [
    { id: 'doc-1', book_id: 'book-3', title: 'Введение', slug: 'intro', sort_order: 1, block_count: 3 },
    { id: 'doc-2', book_id: 'book-3', title: 'Навигация', slug: 'navigation', sort_order: 2, block_count: 5 },
    { id: 'doc-3', book_id: 'book-3', title: 'Формы и валидация', slug: 'forms', sort_order: 3, block_count: 7 },
    { id: 'doc-4', book_id: 'book-3', title: 'Типографика', slug: 'typography', sort_order: 4, block_count: 4 },
    { id: 'doc-5', book_id: 'book-3', title: 'Анимации', slug: 'animations', sort_order: 5, block_count: 6 },
  ],
};

// ── Блоки ─────────────────────────────────────────────────────────
export const MOCK_BLOCKS = {
  'doc-1': [
    {
      id: 'block-1',
      document_id: 'doc-1',
      type: 'md',
      sort_order: 1,
      content: '## Что такое UX паттерн\n\nUX паттерны — это повторяющиеся решения типичных задач проектирования интерфейсов. Они не являются готовыми компонентами — это **принципы**, которые нужно адаптировать под контекст.\n\nКаждый паттерн отвечает на вопрос: *как пользователь решает конкретную задачу?*',
    },
    {
      id: 'block-2',
      document_id: 'doc-1',
      type: 'md',
      sort_order: 2,
      content: '## Как пользоваться этой книгой\n\nКаждая глава посвящена одной зоне интерфейса. Структура везде одинакова:\n\n1. Постановка задачи\n2. Примеры решений\n3. Антипаттерны\n4. Чеклист',
    },
  ],
};

// ── Темы (для фильтрации) ─────────────────────────────────────────
export const MOCK_THEMES = [
  { id: 'theme-1', name: 'Разработка' },
  { id: 'theme-2', name: 'Дизайн' },
  { id: 'theme-3', name: 'Наука' },
  { id: 'theme-4', name: 'Игры' },
  { id: 'theme-5', name: 'Финансы' },
];

// ── Access ────────────────────────────────────────────────────────
export const ACCESS_OPTIONS = [
  { value: '1', label: 'Private' },
  { value: '2', label: 'Friends' },
  { value: '3', label: 'Public' },
];
