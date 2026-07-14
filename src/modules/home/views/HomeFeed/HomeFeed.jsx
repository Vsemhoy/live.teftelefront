import { useState, useMemo } from 'react';
import { Text, Badge } from '@mantine/core';
import {
  IconCalendarEvent, IconTimeline, IconCurrencyDollar,
  IconHome, IconClock, IconCoin, IconAlertTriangle,
  IconCheck, IconChevronDown, IconArticle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useHomeFeed } from '../../api/homeApi';
import { useAuthStore } from '@/modules/auth/authStore';
import { lcById, isOverdue } from '@/shared/lifecycle';

const MONTHS_RU = ['', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const formatDayLabel = (dateStr) => {
  const t = today();
  const y = yesterday();
  if (dateStr === t) return 'Сегодня';
  if (dateStr === y) return 'Вчера';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth() + 1]} · ${WEEKDAYS[d.getDay()]}`;
};

const money = (kopecks) => {
  if (!kopecks) return null;
  const rub = Math.round(kopecks / 100);
  const sign = rub > 0 ? '+' : '';
  return sign + rub.toLocaleString('ru-RU') + ' ₽';
};

const fmtTime = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

const MODULE_ICONS = {
  eventor:   IconCalendarEvent,
  exploiter: IconTimeline,
  ledger:    IconCurrencyDollar,
};

const FILTERS = [
  { key: 'all',       label: 'Всё' },
  { key: 'eventor',   icon: IconCalendarEvent },
  { key: 'exploiter', icon: IconTimeline },
  { key: 'ledger',    icon: IconCurrencyDollar },
];

// ── Карточки по типу модуля ────────────────────────────────────────

const EventorCard = ({ item, onClick }) => (
  <div className="home-card" onClick={onClick}>
    <div className="home-card-icon eventor"><IconCalendarEvent size={16} /></div>
    <div className="home-card-body">
      <div className="home-card-title">{item.name}</div>
      <div className="home-card-meta">
        {item.section_name && <span>{item.section_name}</span>}
        {item.snippet && <><br />{item.snippet}</>}
      </div>
    </div>
    <div className="home-card-right">
      <Text size="xs" c="dimmed">{item.occurred_at.slice(8, 10)}.{item.occurred_at.slice(5, 7)}</Text>
    </div>
  </div>
);

const ExploiterCard = ({ item, onClick }) => {
  const overdue = item.is_overdue;
  const isDone = item.status === 22;
  const total = (item.part_cost || 0) + (item.labor_cost || 0);

  return (
    <div className={`home-card ${overdue ? 'overdue' : ''}`} onClick={onClick}>
      <div className={`home-card-icon exploiter`} style={overdue ? { background: 'var(--mantine-color-red-0)', color: 'var(--mantine-color-red-6)' } : undefined}>
        {overdue ? <IconAlertTriangle size={16} /> : <IconTimeline size={16} />}
      </div>
      <div className="home-card-body">
        <div className="home-card-title">
          {item.name}
          {isDone && <Badge size="xs" variant="light" color="green">done</Badge>}
          {overdue && <Badge size="xs" variant="light" color="red">просрочено</Badge>}
          {item.ledger_linked && <IconCoin size={12} color="var(--mantine-color-gray-5)" />}
          {item.eventor_linked && <IconCalendarEvent size={12} color="var(--mantine-color-gray-5)" />}
        </div>
        <div className="home-card-meta">{item.thing_name}{item.note ? ` · ${item.note}` : ''}</div>
        {total > 0 && (
          <div className="home-card-costs">
            {item.part_cost > 0 && <span style={{ color: 'var(--mantine-color-gray-6)' }}>Деталь <span style={{ fontWeight: 500, color: 'var(--mantine-color-gray-8)' }}>{money(item.part_cost)}</span></span>}
            {item.labor_cost > 0 && <span style={{ color: 'var(--mantine-color-gray-6)' }}>Работа <span style={{ fontWeight: 500, color: 'var(--mantine-color-gray-8)' }}>{money(item.labor_cost)}</span></span>}
            {item.time_total_min > 0 && <span style={{ color: 'var(--mantine-color-gray-5)' }}><IconClock size={13} style={{ verticalAlign: -2 }} /> {fmtTime(item.time_total_min)}</span>}
          </div>
        )}
      </div>
      <div className="home-card-right">
        <Text size="xs" c="dimmed">{item.occurred_at.slice(8, 10)}.{item.occurred_at.slice(5, 7)}</Text>
      </div>
    </div>
  );
};

const LedgerCard = ({ item, onClick }) => {
  const isPositive = (item.amount || 0) > 0;
  return (
    <div className="home-card" onClick={onClick}>
      <div className="home-card-icon ledger"><IconCurrencyDollar size={16} /></div>
      <div className="home-card-body">
        <div className="home-card-title">{item.name}</div>
        <div className="home-card-meta">{item.account_name}{item.category_name ? ` · ${item.category_name}` : ''}</div>
      </div>
      <div className="home-card-right">
        <Text size="sm" fw={500} c={isPositive ? 'green.7' : 'red.7'}>{money(item.amount)}</Text>
      </div>
    </div>
  );
};

const CARD_RENDERERS = { eventor: EventorCard, exploiter: ExploiterCard, ledger: LedgerCard };

// ── Main View ──────────────────────────────────────────────────────

export const HomeFeed = () => {
  const [filter, setFilter] = useState('all');
  const { data: items = [], isLoading, isError } = useHomeFeed({ filter });
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const todayStr = today();
  const d = new Date(todayStr);
  const greeting = `${d.getDate()} ${MONTHS_RU[d.getMonth() + 1]} · ${WEEKDAYS[d.getDay()]}`;

  // Группировка по дням
  const dayGroups = useMemo(() => {
    const groups = {};
    [...items]
      .sort((a, b) => {
        const byDate = new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
        if (byDate !== 0) return byDate;
        return String(b.id).localeCompare(String(a.id));
      })
      .forEach((item) => {
      const dk = item.occurred_at.slice(0, 10);
      if (!groups[dk]) groups[dk] = [];
      groups[dk].push(item);
      });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, events]) => ({ date, events }));
  }, [items]);

  // Недельная сводка
  const weekSummary = useMemo(() => {
    let evtCount = 0, expCount = 0, ledSum = 0;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().slice(0, 10);
    items.forEach((item) => {
      if (item.occurred_at < weekStr) return;
      if (item.source === 'eventor') evtCount++;
      if (item.source === 'exploiter') expCount++;
      if (item.source === 'ledger') ledSum += (item.amount || 0);
    });
    return { evtCount, expCount, ledSum };
  }, [items]);

  const handleCardClick = (item) => {
    if (item.source === 'eventor')   navigate(`/eventor/flow`);
    if (item.source === 'exploiter') navigate(`/exploiter/timeline`);
    if (item.source === 'ledger')    navigate(`/ledger/timeline`);
  };

  return (
    <div className="home-feed">
      {/* Приветствие */}
      <div className="home-header">
        <div className="home-avatar" style={{ background: 'var(--mantine-color-orange-0)' }}>
          <IconHome size={20} color="var(--mantine-color-orange-6)" />
        </div>
        <div>
          <Text size="md" fw={500}>Привет{user?.name ? `, ${user.name}` : ''}</Text>
          <Text size="xs" c="dimmed">{greeting}</Text>
        </div>
        <div style={{ flex: 1 }} />
        <div className="home-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.icon ? <f.icon size={13} style={{ verticalAlign: -2 }} /> : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Группы по дням */}
      {isLoading && (
        <div className="home-feed-state">Загружаем ленту...</div>
      )}

      {isError && (
        <div className="home-feed-state error">Не удалось загрузить ленту</div>
      )}

      {!isLoading && !isError && dayGroups.length === 0 && (
        <div className="home-feed-state">Пока нечего показать</div>
      )}

      {dayGroups.map(({ date, events }) => (
        <div key={date}>
          <div className="home-day-label">{formatDayLabel(date)}</div>
          <div className="home-day-group">
            {events.map((item) => {
              const Renderer = CARD_RENDERERS[item.source];
              if (!Renderer) return null;
              return <Renderer key={item.id} item={item} onClick={() => handleCardClick(item)} />;
            })}
          </div>
        </div>
      ))}

      {/* Сводка недели */}
      {dayGroups.length > 0 && (
        <div className="home-week-summary">
          <div>
            <div className="label">Eventor</div>
            <div className="value" style={{ color: 'var(--mantine-color-blue-6)' }}>{weekSummary.evtCount}</div>
          </div>
          <div>
            <div className="label">Exploiter</div>
            <div className="value" style={{ color: 'var(--mantine-color-orange-6)' }}>{weekSummary.expCount}</div>
          </div>
          <div>
            <div className="label">Ledger</div>
            <div className="value" style={{ color: weekSummary.ledSum < 0 ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-green-6)' }}>
              {money(weekSummary.ledSum)}
            </div>
          </div>
        </div>
      )}

      {dayGroups.length > 0 && (
      <div className="home-load-more">
        <IconChevronDown size={14} style={{ verticalAlign: -3 }} /> Загрузить ещё
      </div>
      )}
    </div>
  );
};
