import { useState, useEffect } from 'react';
import {
  Modal, Stack, Group, Text, Select, Textarea,
  Button, TextInput, Box, Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { notifications } from '@mantine/notifications';

import { useStufferStore } from '../../store/stufferStore';
import { useSaveRegister, useLocations, useThing } from '../../api/stufferApi';
import { buildLocationOptions } from '../../utils/stufferUtils';
import { REGISTER_EVENT_TYPES } from '../../api/stufferMocks';

const EVENT_OPTIONS = Object.entries(REGISTER_EVENT_TYPES).map(([value, { label, color }]) => ({
  value, label, color,
}));

// Поля которые показываем для каждого event_type
const FIELDS_BY_EVENT = {
  bought:    ['to_location', 'note'],
  ordered:   ['note'],
  received:  ['to_location', 'note'],
  moved:     ['from_location', 'to_location', 'note'],
  installed: ['to_location', 'note'],
  lent:      ['contact', 'return_expected', 'note'],
  returned:  ['to_location', 'note'],
  sold:      ['amount', 'contact', 'note'],
  lost:      ['note'],
  stolen:    ['note'],
  disposed:  ['note'],
  repaired:  ['note'],
  noted:     ['note'],
};

export const RegisterModal = () => {
  const { registerOpen, registerParams, closeRegister } = useStufferStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const saveRegister = useSaveRegister();
  const { data: locations = [] } = useLocations();

  // Грузим вещь чтобы знать текущую локацию
  const { data: thing } = useThing(registerOpen ? registerParams?.thing_id : null);

  const [eventType,       setEventType]       = useState('moved');
  const [fromLocationId,  setFromLocationId]   = useState(null);
  const [toLocationId,    setToLocationId]     = useState(null);
  const [contact,         setContact]         = useState('');
  const [returnExpected,  setReturnExpected]   = useState(null);
  const [amount,          setAmount]          = useState('');
  const [note,            setNote]            = useState('');
  const [occurredAt,      setOccurredAt]      = useState(new Date());

  // Сброс при открытии — подставляем текущую локацию вещи в "откуда"
  useEffect(() => {
    if (registerOpen) {
      setEventType('moved');
      setFromLocationId(thing?.current_location_id || null);
      setToLocationId(null);
      setContact('');
      setReturnExpected(null);
      setAmount('');
      setNote('');
      setOccurredAt(new Date());
    }
  }, [registerOpen, thing?.current_location_id]);

  const fields = FIELDS_BY_EVENT[eventType] || ['note'];
  const locationOptions = buildLocationOptions(locations);
  const et = REGISTER_EVENT_TYPES[eventType];

  const handleSave = () => {
    if (!registerParams?.thing_id) return;

    const payload = {
      thing_id:          registerParams.thing_id,
      event_type:        eventType,
      from_location_id:  fromLocationId || null,
      to_location_id:    toLocationId   || null,
      contact:           contact        || null,
      return_expected:   returnExpected ? dayjs(returnExpected).format('YYYY-MM-DD') : null,
      amount:            amount ? Math.round(parseFloat(amount) * 100) : null,
      note:              note   || null,
      occurred_at:       dayjs(occurredAt).format('YYYY-MM-DD'),
    };

    saveRegister.mutate(payload, {
      onSuccess: () => {
        notifications.show({
          message:   `${et?.label || eventType} записано`,
          color:     et?.color || 'green',
          autoClose: 2000,
        });
        closeRegister();
      },
      onError: () => notifications.show({ message: 'Ошибка сохранения', color: 'red' }),
    });
  };

  return (
    <Modal
      opened={registerOpen}
      onClose={closeRegister}
      title={
        <Group gap={8}>
          <Text size="sm" fw={600}>Добавить событие</Text>
          {et && <Badge size="xs" color={et.color} variant="light">{et.label}</Badge>}
        </Group>
      }
      size="sm"
      fullScreen={isMobile}
      centered={!isMobile}
    >
      <Stack gap={12}>

        {/* Тип события */}
        <Select
          label="Событие"
          data={EVENT_OPTIONS}
          value={eventType}
          onChange={setEventType}
          size="sm"
        />

        {/* Дата события */}
        <DatePickerInput
          label="Дата"
          value={occurredAt}
          onChange={setOccurredAt}
          size="sm"
          valueFormat="DD.MM.YYYY"
        />

        {/* Откуда */}
        {fields.includes('from_location') && (
          <Select
            label="Откуда"
            placeholder="Текущая локация..."
            data={locationOptions}
            value={fromLocationId}
            onChange={setFromLocationId}
            searchable clearable
            size="sm"
          />
        )}

        {/* Куда */}
        {fields.includes('to_location') && (
          <Select
            label="Куда"
            placeholder="Новая локация..."
            data={locationOptions}
            value={toLocationId}
            onChange={setToLocationId}
            searchable clearable
            size="sm"
          />
        )}

        {/* Кому (lent/sold) */}
        {fields.includes('contact') && (
          <TextInput
            label={eventType === 'sold' ? 'Кому продал' : 'Кому одолжил'}
            placeholder="Имя или контакт"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            size="sm"
          />
        )}

        {/* Дата возврата */}
        {fields.includes('return_expected') && (
          <DatePickerInput
            label="Вернуть до"
            value={returnExpected}
            onChange={setReturnExpected}
            clearable
            size="sm"
            valueFormat="DD.MM.YYYY"
          />
        )}

        {/* Сумма (sold) */}
        {fields.includes('amount') && (
          <TextInput
            label="Сумма (₽)"
            placeholder="5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            size="sm"
          />
        )}

        {/* Заметка */}
        {fields.includes('note') && (
          <Textarea
            label="Заметка"
            placeholder="Подробности..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            size="sm"
          />
        )}

        {/* Кнопки */}
        <Group justify="flex-end" gap={8} mt={4}>
          <Button size="xs" variant="subtle" color="gray" onClick={closeRegister}>
            Отмена
          </Button>
          <Button
            size="xs"
            leftSection={<IconCheck size={13} />}
            onClick={handleSave}
            loading={saveRegister.isPending}
            color={et?.color || 'blue'}
          >
            Сохранить
          </Button>
        </Group>

      </Stack>
    </Modal>
  );
};
