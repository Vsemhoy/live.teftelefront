import { useEffect, useState } from 'react';

const OVERLAY_SELECTOR = [
  '.mantine-Modal-root',
  '.mantine-Drawer-root',
  '[data-radix-dialog-content]',
].join(',');

const isVisible = (element) => {
  if (!element || element.getAttribute('aria-hidden') === 'true') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const hasBlockingOverlay = () => {
  if (typeof document === 'undefined') return false;
  return Array.from(document.querySelectorAll(OVERLAY_SELECTOR)).some(isVisible);
};

export const useBlockingOverlay = () => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const sync = () => setBlocked(hasBlockingOverlay());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  return blocked;
};
