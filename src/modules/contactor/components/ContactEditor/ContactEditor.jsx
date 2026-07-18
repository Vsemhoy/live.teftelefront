import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon, Button, Group, Modal, Select, SimpleGrid,
  Stack, Text, TextInput, NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { CONTACT_GROUPS } from '../../api/contactorMocks';
import { useContacts, useSaveContact } from '../../api/contactorApi';
import { useContactorStore } from '../../store/contactorStore';
import { normalizeDetails } from '../../utils/contactorUtils';

const DETAIL_KINDS = [
  { value: 'phone', label: 'Phone' },
  { value: 'tg', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Address' },
  { value: 'link', label: 'Link' },
  { value: 'custom', label: 'Custom' },
];

const emptyForm = {
  name: '',
  nickname: '',
  group: 'friends',
  role: '',
  company: '',
  met_at: '',
  met_precision: null,
  met_context: '',
  details: [],
};

const emptyDetail = () => ({ kind: 'phone', label: '', value: '', sort_order: 0 });

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
  error?.message ||
  'Failed to save contact';

const splitPartialDate = (value, precision) => {
  if (!value) return { year: '', month: '', day: '' };

  const [year, month, day] = String(value).slice(0, 10).split('-');
  return {
    year: year || '',
    month: precision === 'year' ? '' : (month || ''),
    day: precision === 'day' ? (day || '') : '',
  };
};

const buildPartialDate = ({ year, month, day }) => {
  if (!year) return { met_at: null, met_precision: null };

  const safeYear = String(year).padStart(4, '0');
  if (!month) return { met_at: `${safeYear}-01-01`, met_precision: 'year' };

  const safeMonth = String(month).padStart(2, '0');
  if (!day) return { met_at: `${safeYear}-${safeMonth}-01`, met_precision: 'month' };

  return { met_at: `${safeYear}-${safeMonth}-${String(day).padStart(2, '0')}`, met_precision: 'day' };
};

export const ContactEditor = () => {
  const {
    contactEditorOpen, contactEditorParams, closeContactEditor,
  } = useContactorStore();
  const { data: contacts = [] } = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const saveContact = useSaveContact();
  const [form, setForm] = useState(emptyForm);
  const [metParts, setMetParts] = useState({ year: '', month: '', day: '' });

  const editing = useMemo(
    () => contacts.find((contact) => contact.id === contactEditorParams?.id),
    [contacts, contactEditorParams?.id]
  );

  useEffect(() => {
    if (!contactEditorOpen) return;
    setForm(editing ? {
      ...emptyForm,
      ...editing,
      details: normalizeDetails(editing.details),
      met_at: editing.met_at || '',
      met_precision: editing.met_precision || null,
      met_context: editing.met_context || '',
      nickname: editing.nickname || '',
    } : emptyForm);
    setMetParts(editing ? splitPartialDate(editing.met_at, editing.met_precision) : { year: '', month: '', day: '' });
  }, [contactEditorOpen, editing]);

  const patch = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  const patchMet = (key, value) => setMetParts((state) => {
    const next = { ...state, [key]: value || '' };
    if (key === 'year' && !value) return { year: '', month: '', day: '' };
    if (key === 'month' && !value) return { ...next, day: '' };
    return next;
  });

  const patchDetail = (idx, key, value) => setForm((state) => ({
    ...state,
    details: state.details.map((detail, index) => (index === idx ? { ...detail, [key]: value } : detail)),
  }));

  const addDetail = () => setForm((state) => ({
    ...state,
    details: [...state.details, emptyDetail()],
  }));

  const removeDetail = (idx) => setForm((state) => ({
    ...state,
    details: state.details.filter((_, index) => index !== idx),
  }));

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;

    const details = normalizeDetails(form.details)
      .filter((detail) => detail.value?.trim())
      .map((detail, index) => ({
        ...detail,
        label: detail.label?.trim() || detail.kind,
        value: detail.value.trim(),
        sort_order: index + 1,
      }));

    saveContact.mutate({
      ...form,
      id: editing?.id,
      name,
      nickname: form.nickname.trim(),
      ...buildPartialDate(metParts),
      details,
    }, {
      onSuccess: closeContactEditor,
      onError: (error) => notifications.show({ message: getErrorMessage(error), color: 'red' }),
    });
  };

  return (
    <Modal
      opened={contactEditorOpen}
      onClose={closeContactEditor}
      title={editing ? 'Edit contact' : 'New contact'}
      size="lg"
    >
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Name" value={form.name} onChange={(event) => patch('name', event.currentTarget.value)} />
          <TextInput
            label="Nickname"
            placeholder="Private short name"
            value={form.nickname}
            onChange={(event) => patch('nickname', event.currentTarget.value)}
          />
          <Select
            label="Group"
            value={form.group}
            data={CONTACT_GROUPS.filter((group) => group.value !== 'all')}
            onChange={(value) => patch('group', value || 'friends')}
          />
          <TextInput label="Role" value={form.role} onChange={(event) => patch('role', event.currentTarget.value)} />
          <TextInput label="Company" value={form.company} onChange={(event) => patch('company', event.currentTarget.value)} />
          <Group grow align="flex-start">
            <NumberInput
              label="Met year"
              placeholder="2021"
              min={1900}
              max={2200}
              value={metParts.year}
              onChange={(value) => patchMet('year', value)}
              hideControls
            />
            <NumberInput
              label="Month"
              placeholder="Optional"
              min={1}
              max={12}
              value={metParts.month}
              onChange={(value) => patchMet('month', value)}
              disabled={!metParts.year}
              hideControls
            />
            <NumberInput
              label="Day"
              placeholder="Optional"
              min={1}
              max={31}
              value={metParts.day}
              onChange={(value) => patchMet('day', value)}
              disabled={!metParts.year || !metParts.month}
              hideControls
            />
          </Group>
        </SimpleGrid>
        <TextInput
          label="Met context"
          placeholder="Conference, university, friend intro..."
          value={form.met_context}
          onChange={(event) => patch('met_context', event.currentTarget.value)}
        />

        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mt={4}>Details</Text>
        <Stack gap={6}>
          {form.details.map((detail, idx) => (
            <Group key={detail.sort_order ?? idx} gap={6} align="flex-end" wrap="nowrap">
              <Select
                size="xs"
                value={detail.kind}
                data={DETAIL_KINDS}
                onChange={(value) => patchDetail(idx, 'kind', value || 'phone')}
                style={{ width: 110 }}
              />
              <TextInput
                size="xs"
                placeholder="Label"
                value={detail.label}
                onChange={(event) => patchDetail(idx, 'label', event.currentTarget.value)}
                style={{ width: 90 }}
              />
              <TextInput
                size="xs"
                placeholder="Value"
                value={detail.value}
                onChange={(event) => patchDetail(idx, 'value', event.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeDetail(idx)}>
                <IconTrash size={13} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            leftSection={<IconPlus size={13} />}
            onClick={addDetail}
            style={{ alignSelf: 'flex-start' }}
          >
            Add detail
          </Button>
        </Stack>

        <Group justify="flex-end" mt={4}>
          <Button variant="subtle" color="gray" onClick={closeContactEditor}>Cancel</Button>
          <Button color="indigo" onClick={handleSave} loading={saveContact.isPending}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
