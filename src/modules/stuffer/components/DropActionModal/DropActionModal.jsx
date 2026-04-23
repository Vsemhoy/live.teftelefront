import { useState } from 'react';
import {
  Modal, Stack, Text, TextInput, Select, Textarea,
  Button, Group, Badge,
} from '@mantine/core';
import {
  IconMapPin, IconUser, IconCurrencyRubel,
  IconTool, IconTrash, IconArrowRight,
} from '@tabler/icons-react';
import { MOCK_LOCATIONS, REGISTER_EVENT_TYPES } from '../../api/stufferMocks';
import { buildLocationOptions } from '../../utils/stufferUtils';

const ZONE_CONFIG = {
  'location-picker': {
    title: 'Выбрать локацию',
    icon: IconMapPin,
    color: 'teal',
    fields: ['location'],
    eventType: 'moved',
  },
  lent: {
    title: 'Одолжить',
    icon: IconUser,
    color: 'yellow',
    fields: ['contact', 'return_date', 'note'],
    eventType: 'lent',
  },
  sold: {
    title: 'Продать',
    icon: IconCurrencyRubel,
    color: 'green',
    fields: ['price', 'note'],
    eventType: 'sold',
  },
  repaired: {
    title: 'Сломалось / в ремонт',
    icon: IconTool,
    color: 'orange',
    fields: ['note'],
    eventType: 'repaired',
  },
  disposed: {
    title: 'Выбросить',
    icon: IconTrash,
    color: 'gray',
    fields: ['note'],
    eventType: 'disposed',
    confirm: true,
  },
};

export const DropActionModal = ({ opened, onClose, thing, dropData, onConfirm }) => {
  const [locationId, setLocationId] = useState(null);
  const [contact, setContact] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  if (!thing || !dropData) return null;

  const actionKey = dropData.type === 'location-picker' ? 'location-picker' : dropData.event_type;
  const config = ZONE_CONFIG[actionKey];
  if (!config) return null;

  const locationOptions = buildLocationOptions(MOCK_LOCATIONS);
  const Icon = config.icon;

  const handleConfirm = () => {
    const payload = {
      thing_id: thing.id,
      event_type: config.eventType,
      to_location_id: dropData.type === 'location-picker' ? locationId : null,
      status: dropData.status || null,
      contact: contact || null,
      return_date: returnDate || null,
      price: price ? Math.round(parseFloat(price) * 100) : null,
      note: note || null,
      occurred_at: new Date().toISOString().slice(0, 10),
    };
    onConfirm(payload);
    // Сброс
    setLocationId(null);
    setContact('');
    setReturnDate('');
    setPrice('');
    setNote('');
  };

  const canConfirm = dropData.type !== 'location-picker' || locationId;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <Icon size={16} />
          <Text size="sm" fw={600}>{config.title}</Text>
        </Group>
      }
      size="sm"
      centered
    >
      <Stack gap={12}>
        {/* Что перемещаем */}
        <Group gap={6}>
          <Text size="xs" c="dimmed">Вещь:</Text>
          <Badge size="sm" variant="light" color="violet">{thing.name}</Badge>
          {thing.current_location_id && (
            <>
              <IconArrowRight size={12} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Text size="xs" c="dimmed">{config.title}</Text>
            </>
          )}
        </Group>

        {/* Поля по типу действия */}
        {config.fields.includes('location') && (
          <Select
            label="Куда перемещаем"
            placeholder="Выберите локацию..."
            data={locationOptions}
            value={locationId}
            onChange={setLocationId}
            searchable
            required
            size="sm"
          />
        )}

        {config.fields.includes('contact') && (
          <TextInput
            label="Кому одолжили"
            placeholder="Имя или контакт"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            size="sm"
          />
        )}

        {config.fields.includes('return_date') && (
          <TextInput
            label="Вернуть до"
            placeholder="YYYY-MM-DD"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            size="sm"
          />
        )}

        {config.fields.includes('price') && (
          <TextInput
            label="Сумма продажи (₽)"
            placeholder="2500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            size="sm"
          />
        )}

        {config.fields.includes('note') && (
          <Textarea
            label="Заметка"
            placeholder={config.confirm ? 'Необязательно...' : 'Подробности...'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            size="sm"
          />
        )}

        {/* Подтверждение выброса */}
        {config.confirm && (
          <Text size="xs" c="red.6" fw={500}>
            Вещь будет помечена как утилизированная. Это действие можно отменить через Register.
          </Text>
        )}

        <Group justify="flex-end" gap={8} mt={4}>
          <Button size="xs" variant="subtle" color="gray" onClick={onClose}>Отмена</Button>
          <Button
            size="xs"
            color={config.color}
            disabled={!canConfirm}
            onClick={handleConfirm}
            leftSection={<Icon size={13} />}
          >
            {config.confirm ? 'Подтвердить' : 'Сохранить'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
