import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, Textarea,
  Button, Select, SegmentedControl, NumberInput,
  ActionIcon, Divider, Box, Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconX, IconCheck, IconTrash, IconExternalLink,
  IconPackage, IconCpu,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';

import { useStufferStore } from '../../store/stufferStore';
import { useThing, useSaveThing, useDeleteThing, useThings, useLocations } from '../../api/stufferApi';
import { useCategories } from '@/modules/badger/api/badgerApi';
import { buildLocationOptions } from '../../utils/stufferUtils';
import { THING_STATUSES } from '../../api/stufferMocks';
import { toMinor, toMajor } from '@/modules/badger/utils/badgerUtils';

const ENTITY_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'item',  label: 'Item' },
];

const STATUS_OPTIONS = Object.entries(THING_STATUSES).map(([value, { label }]) => ({
  value, label,
}));

const UNIT_OPTIONS = [
  { value: 'шт',  label: 'шт' },
  { value: 'л',   label: 'л' },
  { value: 'мл',  label: 'мл' },
  { value: 'кг',  label: 'кг' },
  { value: 'г',   label: 'г' },
  { value: 'м',   label: 'м' },
  { value: 'см',  label: 'см' },
  { value: 'упак',label: 'упак' },
];

export const ThingEditor = () => {
  const { editorOpen, editorParams, closeEditor } = useStufferStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isEdit = Boolean(editorParams?.id);

  // Данные существующей вещи (если редактируем)
  const { data: existing } = useThing(isEdit ? editorParams?.id : null);

  // Данные для селектов
  const { data: locations = [] } = useLocations();
  const { data: categories = [] } = useCategories();
  const { data: allThings = [] } = useThings();

  const saveThing   = useSaveThing();
  const deleteThing = useDeleteThing();

  // ── Форма ──────────────────────────────────────────────────────
  const [entityType,  setEntityType]  = useState('item');
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [vendor,      setVendor]      = useState('');
  const [url,         setUrl]         = useState('');
  const [parentId,    setParentId]    = useState(null);
  const [categoryId,  setCategoryId]  = useState(null);
  const [locationId,  setLocationId]  = useState(null);
  const [status,      setStatus]      = useState('active');
  const [serialNo,    setSerialNo]    = useState('');
  const [qty,         setQty]         = useState('');
  const [unit,        setUnit]        = useState('шт');
  const [priceRaw,    setPriceRaw]    = useState('');
  const [purchaseDate,setPurchaseDate]= useState(null);

  // Заполняем форму при редактировании
  useEffect(() => {
    if (isEdit && existing) {
      setEntityType(existing.entity_type || 'item');
      setName(existing.name || '');
      setDescription(existing.description || '');
      setVendor(existing.vendor || '');
      setUrl(existing.url || '');
      setParentId(existing.parent_id || null);
      setCategoryId(existing.category_id || null);
      setLocationId(existing.current_location_id || null);
      setStatus(existing.current_status || 'active');
      setSerialNo(existing.serial_no || '');
      setQty(existing.qty ? String(existing.qty) : '');
      setUnit(existing.unit || 'шт');
      setPriceRaw(existing.purchase_price ? String(toMajor(existing.purchase_price)) : '');
      setPurchaseDate(existing.purchase_date ? dayjs(existing.purchase_date).toDate() : null);
    } else if (!isEdit) {
      // Новая вещь — сброс + дефолты из params
      setEntityType('item');
      setName('');
      setDescription('');
      setVendor('');
      setUrl('');
      setParentId(editorParams?.parent_id || null);
      setCategoryId(null);
      setLocationId(editorParams?.location_id || null);
      setStatus('active');
      setSerialNo('');
      setQty('');
      setUnit('шт');
      setPriceRaw('');
      setPurchaseDate(null);
    }
  }, [isEdit, existing, editorOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      notifications.show({ message: 'Введите название', color: 'orange' });
      return;
    }

    const payload = {
      ...(isEdit ? { id: editorParams.id } : {}),
      entity_type:          entityType,
      name:                 name.trim(),
      description:          description || null,
      vendor:               vendor || null,
      url:                  url || null,
      parent_id:            parentId || null,
      category_id:          categoryId || null,
      current_location_id:  locationId || null,
      current_status:       status,
      serial_no:            entityType === 'asset' ? (serialNo || null) : null,
      qty:                  entityType === 'item'  ? (qty ? parseFloat(qty) : null) : null,
      unit:                 entityType === 'item'  ? (unit || null) : null,
      purchase_price:       priceRaw ? toMinor(parseFloat(priceRaw)) : null,
      purchase_date:        purchaseDate ? dayjs(purchaseDate).format('YYYY-MM-DD') : null,
    };

    saveThing.mutate(payload, {
      onSuccess: () => {
        notifications.show({
          message: isEdit ? 'Сохранено' : 'Вещь добавлена',
          color:   'green',
          autoClose: 2000,
        });
        closeEditor();
      },
      onError: () => notifications.show({ message: 'Ошибка сохранения', color: 'red' }),
    });
  };

  const handleDelete = () => {
    if (!confirm('Архивировать вещь?')) return;
    deleteThing.mutate(editorParams.id, {
      onSuccess: () => {
        notifications.show({ message: 'Архивировано', color: 'gray', autoClose: 2000 });
        closeEditor();
      },
    });
  };

  // Опции для селектов
  const locationOptions = buildLocationOptions(locations);

  const categoryOptions = categories
    .filter((c) => !c.is_archived)
    .map((c) => ({ value: c.id, label: '\u00A0'.repeat((c.depth || 0) * 3) + c.name }));

  // Вещи как возможные родители (только assets, не сама вещь)
  const parentOptions = allThings
    .filter((t) => t.entity_type === 'asset' && t.id !== editorParams?.id)
    .map((t) => ({ value: t.id, label: t.name }));

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      title={
        <Group gap={8}>
          {entityType === 'asset' ? <IconCpu size={16} /> : <IconPackage size={16} />}
          <Text size="sm" fw={600}>
            {isEdit ? 'Редактировать' : 'Добавить вещь'}
          </Text>
        </Group>
      }
      size="lg"
      fullScreen={isMobile}
      centered={!isMobile}
    >
      <Stack gap={12}>

        {/* Тип сущности */}
        <SegmentedControl
          fullWidth
          size="xs"
          value={entityType}
          onChange={setEntityType}
          data={ENTITY_TYPES}
        />

        {/* Название */}
        <TextInput
          label="Название"
          placeholder="Паяльник Forsthoff, Фильтр Mann W712/75..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          size="sm"
          autoFocus
        />

        {/* Описание */}
        <Textarea
          label="Описание"
          placeholder="Технические характеристики, заметки..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          size="sm"
        />

        <Divider />

        {/* Категория + Родитель */}
        <Group grow gap={10}>
          <Select
            label="Категория"
            placeholder="Выбрать..."
            data={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            searchable
            clearable
            size="sm"
          />
          <Select
            label="Относится к (Asset)"
            placeholder="Опционально..."
            data={parentOptions}
            value={parentId}
            onChange={setParentId}
            searchable
            clearable
            size="sm"
          />
        </Group>

        {/* Локация + Статус */}
        <Group grow gap={10}>
          <Select
            label="Локация"
            placeholder="Где сейчас?"
            data={locationOptions}
            value={locationId}
            onChange={setLocationId}
            searchable
            clearable
            size="sm"
          />
          <Select
            label="Статус"
            data={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            size="sm"
          />
        </Group>

        <Divider />

        {/* Asset-поля */}
        {entityType === 'asset' && (
          <TextInput
            label="Серийный номер"
            placeholder="SN, IMEI, VIN..."
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            size="sm"
          />
        )}

        {/* Item-поля */}
        {entityType === 'item' && (
          <Group grow gap={10}>
            <TextInput
              label="Количество"
              placeholder="3"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              size="sm"
              type="number"
            />
            <Select
              label="Единица"
              data={UNIT_OPTIONS}
              value={unit}
              onChange={setUnit}
              size="sm"
            />
          </Group>
        )}

        {/* Финансы */}
        <Group grow gap={10}>
          <TextInput
            label="Цена покупки (₽)"
            placeholder="2300"
            value={priceRaw}
            onChange={(e) => setPriceRaw(e.target.value)}
            type="number"
            size="sm"
          />
          <DatePickerInput
            label="Дата покупки"
            placeholder="Выбрать..."
            value={purchaseDate}
            onChange={setPurchaseDate}
            clearable
            size="sm"
            valueFormat="DD.MM.YYYY"
          />
        </Group>

        {/* Продавец + Ссылка */}
        <Group grow gap={10}>
          <TextInput
            label="Продавец / Магазин"
            placeholder="Ozon, DNS, ИП Сидоров..."
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            size="sm"
          />
          <TextInput
            label="Ссылка на товар"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            size="sm"
            rightSection={url ? (
              <Tooltip label="Открыть" withArrow>
                <ActionIcon size="xs" variant="subtle" component="a" href={url} target="_blank">
                  <IconExternalLink size={13} />
                </ActionIcon>
              </Tooltip>
            ) : null}
          />
        </Group>

        <Divider />

        {/* Кнопки */}
        <Group justify="space-between">
          {isEdit ? (
            <Button
              size="xs" variant="subtle" color="red"
              leftSection={<IconTrash size={13} />}
              onClick={handleDelete}
              loading={deleteThing.isPending}
            >
              Архивировать
            </Button>
          ) : (
            <Box />
          )}
          <Group gap={8}>
            <Button size="xs" variant="subtle" color="gray" onClick={closeEditor}>
              Отмена
            </Button>
            <Button
              size="xs"
              leftSection={<IconCheck size={13} />}
              onClick={handleSave}
              loading={saveThing.isPending}
            >
              {isEdit ? 'Сохранить' : 'Добавить'}
            </Button>
          </Group>
        </Group>

      </Stack>
    </Modal>
  );
};
