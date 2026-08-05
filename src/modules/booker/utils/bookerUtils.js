// Block type metadata used across PageView, sidebar, and AddBlockMenu.
export const BLOCK_META = {
  markdown: { label: 'MD', name: 'Markdown', icon: 'T', bg: '#EAF3DE', color: '#27500A' },
  excalidraw: { label: 'SVG', name: 'Drawing', icon: 'Draw', bg: '#FAECE7', color: '#712B13' },
  svg: { label: 'SVG', name: 'SVG asset', icon: '<svg>', bg: '#E6FCF5', color: '#087F5B' },
  table: { label: 'Table', name: 'Table', icon: 'Grid', bg: '#E7F5FF', color: '#0B4F6C' },
  code: { label: 'Code', name: 'Code', icon: '{}', bg: '#E7F0FF', color: '#17447D' },
  callout: { label: 'Note', name: 'Callout', icon: '!', bg: '#FFF3BF', color: '#5F3D00' },
  divider: { label: 'Line', name: 'Divider', icon: '--', bg: '#F1F3F5', color: '#495057' },
  embed: { label: 'Link', name: 'Embed', icon: '@', bg: '#E6FCF5', color: '#087F5B' },
  checklist: { label: 'Todo', name: 'Checklist', icon: '[x]', bg: '#F3F0FF', color: '#5B21B6' },
};

export const getBlockMeta = (type) =>
  BLOCK_META[type] ?? { label: type, name: type, icon: '?', bg: '#e9ecef', color: '#495057' };

export const svgTextToDataUrl = (svgText) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

export const getBookCoverSrc = (book) => {
  if (book?.cover_svg_url) return book.cover_svg_url;
  if (book?.cover_svg_text) return svgTextToDataUrl(book.cover_svg_text);
  return '';
};

export const getBlockPreview = (group) => {
  const mb = group.master_block;
  if (!mb) return '...';

  if (group.type === 'markdown' && mb.content) {
    return mb.content.replace(/^#+\s*/m, '').slice(0, 28);
  }

  const payload = mb.payload;
  if (!payload || typeof payload !== 'object') return getBlockMeta(group.type).name;

  if (group.type === 'code') return payload.caption || payload.language || 'Code';
  if (group.type === 'callout') return payload.title || payload.text || 'Callout';
  if (group.type === 'divider') return payload.label || 'Divider';
  if (group.type === 'embed') return payload.title || payload.url || 'Embed';
  if (group.type === 'svg') return payload.caption || payload.url || payload.file_name || 'SVG asset';
  if (group.type === 'table') return payload.caption || `${payload.rows?.length || 0} rows`;
  if (group.type === 'checklist') {
    const items = payload.items || [];
    return items.length ? `${items.filter((item) => item.checked).length}/${items.length}` : 'Checklist';
  }
  if (group.type === 'excalidraw') return 'Drawing';

  return getBlockMeta(group.type).name;
};

export const getDefaultContent = (type) => {
  switch (type) {
    case 'markdown':
      return { content: '' };
    case 'excalidraw':
      return { payload: {} };
    case 'svg':
      return { payload: { source: 'url', url: '', svg_text: '', file_name: '', caption: '', max_width: '', max_height: '' } };
    case 'table':
      return { payload: { caption: '', min_width: '720px', columns: ['Column 1', 'Column 2'], rows: [['', '']] } };
    case 'code':
      return { payload: { language: 'javascript', caption: '', code: '' } };
    case 'callout':
      return { payload: { tone: 'info', title: 'Note', text: '' } };
    case 'divider':
      return { payload: { label: '' } };
    case 'embed':
      return { payload: { title: '', url: '', description: '' } };
    case 'checklist':
      return { payload: { items: [{ text: '', checked: false }] } };
    default:
      return { content: '' };
  }
};

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends' },
  { value: 'registered', label: 'Registered' },
  { value: 'public', label: 'Public' },
];

export const COVER_COLORS = [
  '#B5D4F4',
  '#9FE1CB',
  '#FAC775',
  '#F4C0D1',
  '#AFA9EC',
  '#F0997B',
  '#C0DD97',
  '#85B7EB',
];
