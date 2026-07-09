import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, TextInput, Textarea,
  Button, Select, SegmentedControl, ActionIcon, Divider,
  Box, Tooltip, Switch,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCheck, IconCpu, IconExternalLink, IconPackage, IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';

import { useStufferStore } from '../../store/stufferStore';
import { useThing, useSaveThing, useDeleteThing, useThings, useLocations } from '../../api/stufferApi';
import { useCategories } from '@/modules/ledger/api/ledgerApi';
import { buildLocationOptions } from '../../utils/stufferUtils';
import { THING_STATUSES } from '../../api/stufferMocks';
import { toMinor, toMajor } from '@/modules/ledger/utils/ledgerUtils';

const ENTITY_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'item', label: 'Item' },
];

const STATUS_OPTIONS = Object.entries(THING_STATUSES).map(([value, { label }]) => ({
  value,
  label,
}));

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'pcs' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'm', label: 'm' },
  { value: 'cm', label: 'cm' },
  { value: 'pack', label: 'pack' },
];

const getErrorMessage = (error) => (
  error?.response?.data?.message
  || Object.values(error?.response?.data?.errors || {})?.flat()?.[0]
  || 'Save failed'
);

export const ThingEditor = () => {
  const { editorOpen, editorParams, closeEditor } = useStufferStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isEdit = Boolean(editorParams?.id);

  const { data: existing } = useThing(isEdit ? editorParams?.id : null);
  const { data: locations = [] } = useLocations();
  const { data: categories = [] } = useCategories();
  const { data: allThings = [] } = useThings();

  const saveThing = useSaveThing();
  const deleteThing = useDeleteThing();

  const [entityType, setEntityType] = useState('item');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [status, setStatus] = useState('active');
  const [serialNo, setSerialNo] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [priceRaw, setPriceRaw] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(null);
  const [trackLocation, setTrackLocation] = useState(true);
  const [trackLifecycle, setTrackLifecycle] = useState(false);

  const handleEntityTypeChange = (value) => {
    setEntityType(value);

    if (value === 'asset') {
      setQty('');
      setUnit('pcs');
      return;
    }

    setSerialNo('');
  };

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
      setUnit(existing.unit || 'pcs');
      setPriceRaw(existing.purchase_price ? String(toMajor(existing.purchase_price)) : '');
      setPurchaseDate(existing.purchase_date ? dayjs(existing.purchase_date).toDate() : null);
      setTrackLocation(existing.track_location ?? true);
      setTrackLifecycle(existing.track_lifecycle ?? false);
    } else if (!isEdit) {
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
      setUnit('pcs');
      setPriceRaw('');
      setPurchaseDate(null);
      setTrackLocation(true);
      setTrackLifecycle(Boolean(editorParams?.track_lifecycle));
    }
  }, [isEdit, existing, editorOpen, editorParams?.parent_id, editorParams?.location_id, editorParams?.track_lifecycle]);

  const handleSave = () => {
    if (!name.trim()) {
      notifications.show({ message: 'Enter a name', color: 'orange' });
      return;
    }

    const payload = {
      ...(isEdit ? { id: editorParams.id } : {}),
      entity_type: entityType,
      name: name.trim(),
      description: description || null,
      vendor: vendor || null,
      url: url || null,
      parent_id: parentId || null,
      category_id: categoryId || null,
      current_location_id: locationId || null,
      current_status: status,
      serial_no: entityType === 'asset' ? (serialNo || null) : null,
      qty: entityType === 'item' ? (qty ? parseFloat(qty) : null) : null,
      unit: entityType === 'item' ? (unit || null) : null,
      purchase_price: priceRaw ? toMinor(parseFloat(priceRaw)) : null,
      purchase_date: purchaseDate ? dayjs(purchaseDate).format('YYYY-MM-DD') : null,
      track_location: trackLocation,
      track_lifecycle: trackLifecycle,
    };

    saveThing.mutate(payload, {
      onSuccess: () => {
        notifications.show({
          message: isEdit ? 'Saved' : 'Thing added',
          color: 'green',
          autoClose: 2000,
        });
        closeEditor();
      },
      onError: (error) => notifications.show({ message: getErrorMessage(error), color: 'red' }),
    });
  };

  const handleDelete = () => {
    if (!confirm('Archive this thing?')) return;

    deleteThing.mutate(editorParams.id, {
      onSuccess: () => {
        notifications.show({ message: 'Archived', color: 'gray', autoClose: 2000 });
        closeEditor();
      },
    });
  };

  const locationOptions = buildLocationOptions(locations);
  const categoryOptions = categories
    .filter((category) => !category.is_archived)
    .map((category) => ({
      value: category.id,
      label: '\u00A0'.repeat((category.depth || 0) * 3) + category.name,
    }));
  const parentOptions = allThings
    .filter((thing) => thing.entity_type === 'asset' && thing.id !== editorParams?.id)
    .map((thing) => ({ value: thing.id, label: thing.name }));

  return (
    <Modal
      opened={editorOpen}
      onClose={closeEditor}
      title={(
        <Group gap={8}>
          {entityType === 'asset' ? <IconCpu size={16} /> : <IconPackage size={16} />}
          <Text size="sm" fw={600}>{isEdit ? 'Edit thing' : 'Add thing'}</Text>
        </Group>
      )}
      size="lg"
      fullScreen={isMobile}
      centered={!isMobile}
    >
      <Stack gap={12}>
        <SegmentedControl
          fullWidth
          size="xs"
          value={entityType}
          onChange={handleEntityTypeChange}
          data={ENTITY_TYPES}
        />

        <TextInput
          label="Name"
          placeholder="Soldering station, oil filter, bike..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          size="sm"
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="Specs, notes, model details..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          size="sm"
        />

        <Divider />

        <Group grow gap={10}>
          <Select
            label="Category"
            placeholder="Select..."
            data={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            searchable
            clearable
            size="sm"
          />
          <Select
            label="Parent asset"
            placeholder="Optional..."
            data={parentOptions}
            value={parentId}
            onChange={setParentId}
            searchable
            clearable
            size="sm"
          />
        </Group>

        <Group grow gap={10}>
          <Select
            label="Location"
            placeholder="Where is it now?"
            data={locationOptions}
            value={locationId}
            onChange={setLocationId}
            searchable
            clearable
            size="sm"
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            size="sm"
          />
        </Group>

        <Group grow gap={10}>
          <Switch
            label="Track location"
            description="Show and manage this thing in Stuffer"
            checked={trackLocation}
            onChange={(event) => setTrackLocation(event.currentTarget.checked)}
          />
          <Switch
            label="Track lifecycle"
            description="Show this thing in Exploiter"
            checked={trackLifecycle}
            onChange={(event) => setTrackLifecycle(event.currentTarget.checked)}
          />
        </Group>

        <Divider />

        {entityType === 'asset' && (
          <TextInput
            label="Serial number"
            placeholder="SN, IMEI, VIN..."
            value={serialNo}
            onChange={(event) => setSerialNo(event.target.value)}
            size="sm"
          />
        )}

        {entityType === 'item' && (
          <Group grow gap={10}>
            <TextInput
              label="Quantity"
              placeholder="3"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              size="sm"
              type="number"
            />
            <Select
              label="Unit"
              data={UNIT_OPTIONS}
              value={unit}
              onChange={setUnit}
              size="sm"
            />
          </Group>
        )}

        <Group grow gap={10}>
          <TextInput
            label="Purchase price"
            placeholder="2300"
            value={priceRaw}
            onChange={(event) => setPriceRaw(event.target.value)}
            type="number"
            size="sm"
          />
          <DatePickerInput
            label="Purchase date"
            placeholder="Select..."
            value={purchaseDate}
            onChange={setPurchaseDate}
            clearable
            size="sm"
            valueFormat="YYYY-MM-DD"
          />
        </Group>

        <Group grow gap={10}>
          <TextInput
            label="Vendor"
            placeholder="Amazon, DNS, local store..."
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
            size="sm"
          />
          <TextInput
            label="Product URL"
            placeholder="https://..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            size="sm"
            rightSection={url ? (
              <Tooltip label="Open" withArrow>
                <ActionIcon size="xs" variant="subtle" component="a" href={url} target="_blank">
                  <IconExternalLink size={13} />
                </ActionIcon>
              </Tooltip>
            ) : null}
          />
        </Group>

        <Divider />

        <Group justify="space-between">
          {isEdit ? (
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={13} />}
              onClick={handleDelete}
              loading={deleteThing.isPending}
            >
              Archive
            </Button>
          ) : (
            <Box />
          )}
          <Group gap={8}>
            <Button size="xs" variant="subtle" color="gray" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              size="xs"
              leftSection={<IconCheck size={13} />}
              onClick={handleSave}
              loading={saveThing.isPending}
            >
              {isEdit ? 'Save' : 'Add'}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
