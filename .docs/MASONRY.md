# 📐 Masonry Layout — Памятка

> **Проект:** telefront · **Стек:** React + `react-masonry-css` + Mantine

---

## 1. Как это работает

Цепочка из трёх звеньев:

```
useMasonryColumns(targetColWidth)
        ↓
  columns (число ≥ 1)
        ↓
<Masonry breakpointCols={{ default: columns }}>
```

**Хук** смотрит на `window.innerWidth`, делит на `targetColWidth`, возвращает целое число колонок.  
**`<Masonry>`** раскладывает дочерние элементы по flex-колонкам — без JS-позиционирования, чистый CSS.

### Формула

```js
columns = Math.max(1, Math.floor(window.innerWidth / targetColWidth))
```

| targetColWidth | Окно   | → columns | Комментарий               |
|---------------|--------|-----------|---------------------------|
| 500           | 900px  | 1         | Мобилка / узкое окно      |
| 500           | 1100px | 2         | Ноутбук                   |
| 500           | 1600px | 3         | Широкий монитор           |
| 500           | 2100px | 4         | Ультраширокий             |
| **900 ⚠️**    | 1440px | **1**     | Типичный ноут — всегда 1! |

> ⚠️ **Главный баг-магнит:** если `targetColWidth` слишком большой — masonry не включится никогда.  
> При `targetColWidth=900` нужно окно шире 1800px чтобы получить 2 колонки. Это был исходный баг.

---

## 2. Где что находится

| Файл | За что отвечает |
|------|----------------|
| `src/shared/hooks/useMasonryColumns.js` | Вся логика расчёта колонок. Менять порог → **сюда** |
| `src/modules/eventor/views/FlowView/FlowView.jsx` | `useMasonryColumns(500)` — порог для дневных строк |
| `src/modules/eventor/views/DraftsView/DraftsView.jsx` | `useMasonryColumns(650)` — порог для карточек черновиков |
| `src/app/global.css` | CSS-классы `.masonry-grid` и `.masonry-grid-col` |

### Код хука

```js
// src/shared/hooks/useMasonryColumns.js

export const useMasonryColumns = (targetColWidth = 650) => {
  const ref = useRef(null); // заглушка — для совместимости с JSX в компонентах

  const calcColumns = () =>
    Math.max(1, Math.floor(window.innerWidth / targetColWidth));

  const [columns, setColumns] = useState(calcColumns);

  useEffect(() => {
    const observer = new ResizeObserver(() => setColumns(calcColumns()));
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [targetColWidth]);

  return { ref, columns };
};
```

### CSS

```css
/* src/app/global.css */

.masonry-grid {
  display: flex;
  margin-left: -10px; /* компенсирует padding колонок */
  width: 100%;
}

.masonry-grid-col {
  padding-left: 10px;  /* ← зазор между колонками */
  background-clip: padding-box;
  display: flex;
  flex-direction: column;
}

.masonry-grid-col > * {
  margin-bottom: 10px; /* ← зазор между карточками по вертикали */
}
```

---

## 3. Как регулировать

### Порог переключения числа колонок

Меняй `targetColWidth` при вызове хука в компоненте:

```js
// FlowView.jsx
const { ref: containerRef, columns: masonryColumns } = useMasonryColumns(500);
//                                                                         ^^^
//                                                              вот эту цифру
```

| Хочу...                        | Что делать                                              |
|--------------------------------|---------------------------------------------------------|
| Раньше включить 2 колонки      | Уменьши `targetColWidth` (напр. 400)                    |
| Позже включить 2 колонки       | Увеличь `targetColWidth` (напр. 700)                    |
| Максимум 2 колонки всегда      | `Math.min(2, Math.floor(...))`  в хуке                  |
| Максимум N колонок             | `Math.min(N, Math.floor(...))`  в хуке                  |

> FlowView (500) и DraftsView (650) имеют разные значения намеренно:  
> FlowView рендерит masonry внутри узкой колонки событий → порог меньше.  
> DraftsView занимает всю ширину → 650 норм.

### Зазор между колонками

Оба значения должны совпадать по модулю:

```css
.masonry-grid     { margin-left: -16px; } /* ← поменяй оба */
.masonry-grid-col { padding-left: 16px; } /* ← на одно значение */
```

### Зазор между карточками по вертикали

```css
.masonry-grid-col > * { margin-bottom: 10px; } /* ← вот сюда */
```

---

## 4. Диагностика — «masonry сломался»

### Симптом: всегда одна колонка

1. **Проверь `targetColWidth`** — открой `FlowView.jsx` / `DraftsView.jsx`, найди `useMasonryColumns(X)`.  
   `X` должен быть ≤ половины типичной ширины экрана. Обычно 400–650.

2. **Проверь console** — добавь временно в хук:
   ```js
   console.log('innerWidth:', window.innerWidth, '→ columns:', calcColumns());
   ```

3. **Проверь CSS** — в DevTools найди `.masonry-grid`. Должен быть `display: flex`.  
   Если нет — CSS не подключён или класс переопределён.

4. **Проверь условие `masonryColumns === 1`** — в компонентах есть защита:
   ```jsx
   {masonryColumns === 1
     ? <Stack>...</Stack>      // ← если хук вернул 1, masonry не рендерится вообще
     : <Masonry>...</Masonry>
   }
   ```
   Если хук всегда возвращает 1 — `<Masonry>` никогда не увидишь.

### Симптом: колонки есть, но карточки перекрываются

- Карточка сама ставит себя `position: absolute` — конфликт с flex-flow.
- Задан явный `height` на `.masonry-grid-col` — убери его.

### Симптом: не реагирует на ресайз

Хук вешает `ResizeObserver` на `document.body` и отключает его при размонтировании.  
Если компонент размонтируется и монтируется заново — observer пересоздаётся, это нормально.  
Если observer молчит — проверь, не завёрнут ли компонент в что-то с `display: none`.

---

## 5. Быстрый рецепт «нарукожоплил — чиним»

Скажи мне три вещи:

1. **Симптом** — «всегда одна колонка» / «колонки есть но криво» / «не реагирует на ресайз»
2. **Значение** — какой `targetColWidth` стоит в проблемном компоненте + ширина твоего окна при тестировании
3. **Файл** — скинь `FlowView.jsx` или `DraftsView.jsx` — баг обычно там, не в хуке

> **TL;DR**  
> Единственный файл с логикой: `useMasonryColumns.js`  
> Единственный параметр: `targetColWidth`  
> Единственный CSS: `.masonry-grid` + `.masonry-grid-col`
