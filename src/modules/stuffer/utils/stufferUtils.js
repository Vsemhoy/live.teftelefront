import { MOCK_LOCATIONS } from '../api/stufferMocks';

// Форматирование суммы из минорных единиц
export const formatPrice = (minor) => {
  if (!minor) return null;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(minor / 100);
};

// Построить плоский список локаций с отступами (для Select)
// Сортировка рекурсивная: сначала корневые по sort_order, потом сразу их дети
export const buildLocationOptions = (locations = MOCK_LOCATIONS) => {
  const map = {};
  locations.forEach((l) => { map[l.id] = l; });

  const getDepth = (loc) => {
    let depth = 0;
    let cur = loc;
    while (cur.parent_id) {
      depth++;
      cur = map[cur.parent_id];
      if (!cur) break;
    }
    return depth;
  };

  // Рекурсивно строим плоский список в правильном порядке
  const result = [];

  const visit = (parentId, depth) => {
    const children = locations
      .filter((l) => (l.parent_id || null) === (parentId || null))
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const loc of children) {
      result.push({
        value: loc.id,
        label: '\u00A0'.repeat(depth * 3) + loc.name,
        depth,
      });
      visit(loc.id, depth + 1);
    }
  };

  visit(null, 0);
  return result;
};

// Построить дерево для сайдбара
export const buildLocationTree = (locations = MOCK_LOCATIONS) => {
  const map = {};
  locations.forEach((l) => { map[l.id] = { ...l, children: [] }; });

  const roots = [];
  locations.forEach((l) => {
    if (l.parent_id && map[l.parent_id]) {
      map[l.parent_id].children.push(map[l.id]);
    } else {
      roots.push(map[l.id]);
    }
  });

  return roots.sort((a, b) => a.sort_order - b.sort_order);
};

// Найти название локации по id
export const getLocationName = (id, locations = MOCK_LOCATIONS) => {
  if (!id) return null;
  return locations.find((l) => l.id === id)?.name || null;
};

// Получить полный путь локации: "Квартира / Кладовка"
export const getLocationPath = (id, locations = MOCK_LOCATIONS) => {
  if (!id) return null;
  const map = {};
  locations.forEach((l) => { map[l.id] = l; });

  const parts = [];
  let cur = map[id];
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parent_id ? map[cur.parent_id] : null;
  }
  return parts.join(' / ');
};
