import { createTheme, rem } from '@mantine/core';

// Тема максимально приближена к Microsoft Fluent Design / Outlook
export const theme = createTheme({
  // Шрифт — Segoe UI как у Outlook, с фоллбэком
  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"Cascadia Code", "Fira Code", "Consolas", monospace',
  headings: {
    fontFamily: '"Segoe UI Semibold", "Segoe UI", system-ui, sans-serif',
    fontWeight: '600',
  },

  // Основной цвет — Fluent blue
  primaryColor: 'blue',
  primaryShade: { light: 6, dark: 5 },

  // Скруглённые углы — как в Fluent Design
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(6),
    lg: rem(8),
    xl: rem(12),
  },

  // Высота компонентов
  defaultRadius: 'sm',

  components: {
    // Кнопки в стиле Fluent — немного плоские
    Button: {
      defaultProps: {
        radius: 'sm',
      },
      styles: {
        root: {
          fontWeight: 400,
          letterSpacing: '0.01em',
        },
      },
    },

    // Инпуты
    TextInput: {
      defaultProps: { radius: 'sm' },
    },
    Select: {
      defaultProps: { radius: 'sm' },
    },
    Textarea: {
      defaultProps: { radius: 'sm' },
    },

    // Навигационные ссылки
    NavLink: {
      styles: {
        root: {
          borderRadius: rem(4),
          '&[dataActive]': {
            fontWeight: 600,
          },
        },
      },
    },

    // Модалки
    Modal: {
      defaultProps: {
        radius: 'md',
        centered: true,
      },
    },

    // Тултипы
    Tooltip: {
      defaultProps: {
        radius: 'xs',
        withArrow: true,
      },
    },
  },

  // Цветовая палитра — чуть кастомизированный Fluent blue
  colors: {
    // Fluent brand blue
    blue: [
      '#EEF3FB',
      '#D4E3F7',
      '#A9C8F0',
      '#7DACE8',
      '#5291E0',
      '#2B72D7',
      '#0F62C3', // primaryShade light
      '#0B4F9E',
      '#083C7A',
      '#052956',
    ],
  },
});
