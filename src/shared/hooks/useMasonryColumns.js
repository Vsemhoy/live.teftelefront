import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Хук для динамического расчёта числа колонок масонри.
 * Следит за шириной контейнера через ResizeObserver.
 * Считает первый раз сразу при маунте — не ждём первый resize.
 *
 * @param {number} targetColWidth — желаемая ширина колонки в пикселях (default: 650)
 * @returns {{ ref, columns }} — ref на контейнер, columns — число колонок
 */
export const useMasonryColumns = (targetColWidth = 650) => {
  const ref = useRef(null);
  const [columns, setColumns] = useState(1);

  const calcColumns = useCallback((width) => {
    if (width <= 0) return;
    setColumns(Math.max(1, Math.floor(width / targetColWidth)));
  }, [targetColWidth]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Считаем сразу при маунте
    calcColumns(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      calcColumns(entries[0]?.contentRect.width ?? 0);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [calcColumns]);

  return { ref, columns };
};
