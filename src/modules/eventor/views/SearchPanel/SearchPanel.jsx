import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TextInput, Stack, Text, Group, Paper, Box,
  MultiSelect, Badge, Center, Loader, Divider,
  ActionIcon, Tooltip, Collapse,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconFilter, IconX, IconCalendar } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import dayjs from 'dayjs';
import { useEventorStore } from '../../store/eventorStore';
import { useEventSearch, useSections, useEventTypes } from '../../api/eventorApi';
import { ReadModal } from '../../components/ReadModal/ReadModal';
import Masonry from 'react-masonry-css';
import { useMasonryColumns } from '@/shared/hooks/useMasonryColumns';

const Snippet = ({ text, query }) => {
  if (!text || !query) return <Text size="xs" c="dimmed" lineClamp={2}>{text?.substring(0, 160)}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text size="xs" c="dimmed" lineClamp={2}>{text.substring(0, 160)}</Text>;
  const from = Math.max(0, idx - 80);
  const to   = Math.min(text.length, idx + query.length + 80);
  const before = (from > 0 ? '…' : '') + text.substring(from, idx);
  const match  = text.substring(idx, idx + query.length);
  const after  = text.substring(idx + query.length, to) + (to < text.length ? '…' : '');
  return (
    <Text size="xs" c="dimmed">
      {before}
      <Text component="span" size="xs" fw={600} c="blue.7" bg="blue.0" px={2} style={{ borderRadius: 2 }}>{match}</Text>
      {after}
    </Text>
  );
};

const SearchResultCard = ({ event, query, onDoubleClick }) => {
  const typeColor = event.type_bgcolor ? event.type_bgcolor.substring(0, 7) : null;
  const date = dayjs(event.occurred_at).format('D MMM YYYY');
  return (
    <Paper p={10} withBorder radius="sm"
      style={{ borderLeft: `3px solid ${typeColor || 'var(--mantine-color-gray-3)'}`, cursor: 'pointer', transition: 'box-shadow 0.1s', userSelect: 'none' }}
      onDoubleClick={() => onDoubleClick(event.id)}
      title="Double-click to view"
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
      <Group justify="space-between" mb={4}>
        <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
          {event.name || <Text component="span" c="dimmed" fw={400}>Untitled</Text>}
        </Text>
        <Group gap={6}>
          {event.type_name && <Badge size="xs" variant="light" color="gray">{event.type_name}</Badge>}
          <Text size="xs" c="dimmed">{date}</Text>
        </Group>
      </Group>
      {event.section_name && <Text size="xs" c="blue.6" mb={4}>{event.section_name}</Text>}
      <Snippet text={event.content} query={query} />
    </Paper>
  );
};

export const SearchPanel = () => {
  const { openReader } = useEventorStore();
  const { data: sections } = useSections();
  const { data: types } = useEventTypes();

  // Динамические колонки масонри
  const { ref: containerRef, columns: masonryColumns } = useMasonryColumns(650);

  // URL — source of truth для всех параметров поиска
  const [searchParams, setSearchParams] = useSearchParams();

  // Локальный стейт строки — синхронизируется с URL
  const [localQuery, setLocalQuery] = useState(() => searchParams.get('q') || '');
  const [filterSections, setFilterSections] = useState(() => searchParams.getAll('section'));
  const [filterTypes,    setFilterTypes]    = useState(() => searchParams.getAll('type'));
  const [dateFrom, setDateFrom] = useState(() => { const d = searchParams.get('from'); return d ? new Date(d) : null; });
  const [dateTo,   setDateTo]   = useState(() => { const d = searchParams.get('to');   return d ? new Date(d) : null; });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Синхронизируем все параметры → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (localQuery) params.set('q', localQuery);
    filterSections.forEach((s) => params.append('section', s));
    filterTypes.forEach((t) => params.append('type', t));
    if (dateFrom) params.set('from', dayjs(dateFrom).format('YYYY-MM-DD'));
    if (dateTo)   params.set('to',   dayjs(dateTo).format('YYYY-MM-DD'));
    setSearchParams(params, { replace: true });
  }, [localQuery, filterSections, filterTypes, dateFrom, dateTo]);

  const [debouncedQuery] = useDebouncedValue(localQuery, 350);

  const { data, isLoading, isFetching } = useEventSearch({
    q: debouncedQuery,
    sections: filterSections.length ? filterSections : undefined,
    types:    filterTypes.length ? filterTypes : undefined,
    dateFrom: dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : undefined,
    dateTo:   dateTo   ? dayjs(dateTo).format('YYYY-MM-DD')   : undefined,
  });

  const results = data?.content || [];
  const total   = data?.meta?.total ?? results.length;

  // Двойной клик → reader
  const handleDoubleClick = useCallback((id) => {
    openReader({ id });
  }, [openReader]);

  const clearAll = () => {
    setLocalQuery(''); setFilterSections([]); setFilterTypes([]);
    setDateFrom(null); setDateTo(null);
  };

  const hasActiveFilters = filterSections.length > 0 || filterTypes.length > 0 || dateFrom || dateTo;
  const sectionOptions = sections?.map((s) => ({ value: s.id, label: s.name })) || [];
  const typeOptions    = types?.map((t)    => ({ value: t.id, label: t.name })) || [];

  return (
    <div className="content-scroll" ref={containerRef}>
      <Box px={16} pt={12} pb={0}>
        {/* Строка поиска — подхватывает ?q= из URL (в т.ч. из хедера) */}
        <TextInput
          placeholder="Search events…"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          leftSection={<IconSearch size={15} />}
          rightSection={localQuery ? (
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setLocalQuery('')}>
              <IconX size={13} />
            </ActionIcon>
          ) : null}
          size="sm"
          autoFocus
        />

        <Group mt={8} justify="space-between">
          <Group gap={6}>
            <Tooltip label={filtersOpen ? 'Hide filters' : 'Show filters'}>
              <ActionIcon variant={filtersOpen ? 'light' : 'subtle'} color={hasActiveFilters ? 'blue' : 'gray'}
                size="sm" onClick={() => setFiltersOpen((v) => !v)}>
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
            {hasActiveFilters && (
              <>
                <Badge size="xs" color="blue" variant="light">Filters active</Badge>
                <ActionIcon variant="subtle" color="gray" size="xs" onClick={clearAll}><IconX size={11} /></ActionIcon>
              </>
            )}
          </Group>
          {debouncedQuery.length >= 2 && !isLoading && (
            <Text size="xs" c="dimmed">{total} result{total !== 1 ? 's' : ''}</Text>
          )}
        </Group>

        <Collapse in={filtersOpen}>
          <Stack gap="sm" mt={8} pb={8}>
            <Group grow gap="sm">
              <MultiSelect label="Sections" data={sectionOptions} value={filterSections}
                onChange={setFilterSections} size="xs" placeholder="All sections" clearable />
              <MultiSelect label="Types" data={typeOptions} value={filterTypes}
                onChange={setFilterTypes} size="xs" placeholder="All types" clearable />
            </Group>
            <Group grow gap="sm">
              <DatePickerInput label="From" value={dateFrom} onChange={setDateFrom} size="xs" clearable
                placeholder="Any date" valueFormat="DD MMM YYYY" leftSection={<IconCalendar size={13} />} />
              <DatePickerInput label="To" value={dateTo} onChange={setDateTo} size="xs" clearable
                placeholder="Any date" valueFormat="DD MMM YYYY" leftSection={<IconCalendar size={13} />} />
            </Group>
          </Stack>
        </Collapse>

        <Divider mt={8} />
      </Box>

      <Stack gap={6} px={16} pt={10} pb={40}>
        {debouncedQuery.length < 2 && (
          <Center h={140}>
            <Stack align="center" gap={6}>
              <IconSearch size={32} color="var(--mantine-color-gray-4)" />
              <Text size="sm" c="dimmed">Type at least 2 characters to search</Text>
            </Stack>
          </Center>
        )}
        {isLoading && debouncedQuery.length >= 2 && <Center h={140}><Loader size="sm" /></Center>}
        {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
          <Center h={140}><Text size="sm" c="dimmed">Nothing found for "{debouncedQuery}"</Text></Center>
        )}
        {results.length > 0 && (
          masonryColumns === 1 ? (
            results.map((event) => (
              <SearchResultCard key={event.id} event={event} query={debouncedQuery} onDoubleClick={handleDoubleClick} />
            ))
          ) : (
            <Masonry
              breakpointCols={{ default: masonryColumns }}
              className="masonry-grid"
              columnClassName="masonry-grid-col"
            >
              {results.map((event) => (
                <SearchResultCard key={event.id} event={event} query={debouncedQuery} onDoubleClick={handleDoubleClick} />
              ))}
            </Masonry>
          )
        )}
        {isFetching && !isLoading && <Text size="xs" c="dimmed" ta="center">Updating…</Text>}
      </Stack>
    </div>
  );
};
