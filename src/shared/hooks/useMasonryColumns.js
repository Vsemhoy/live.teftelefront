import { useState, useEffect, useRef } from 'react';

/**
 * Хук для динамического расчёта числа колонок масонри.
 * Следит за шириной окна через ResizeObserver на document.body.
 *
 * @param {number} targetColWidth — желаемая ширина колонки в пикселях (default: 650)
 * @returns {{ ref, columns }} — ref-заглушка (для обратной совместимости), columns — число колонок
 */
export const useMasonryColumns = (targetColWidth = 650) => {
  const ref = useRef(null); // заглушка — оставляем для совместимости с существующим JSX

  const calcColumns = () =>
    Math.max(1, Math.floor(window.innerWidth / targetColWidth));

  const [columns, setColumns] = useState(calcColumns);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setColumns(calcColumns());
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [targetColWidth]);

  return { ref, columns };
};
