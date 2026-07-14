import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon, Button, Group, Modal, Select, SimpleGrid,
  Stack, Text, TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { CONTACT_GROUPS } from '../../api/contactorMocks';
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
  met_context: '',
  details: [],
};

const emptyDetail = () => ({ kind: 'phone', label: '', value: '', sort_order: Date.now() });

export const ContactEditor = () => {
  const {
    contactEditorOpen, contactEditorParams, closeContactEditor, contacts, saveContact,
  } = useContactorStore();
  const [form, setForm] = useState(emptyForm);

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
      met_context: editing.met_context || '',
      nickname: editing.nickname || '',
    } : emptyForm);
  }, [contactEditorOpen, editing]);

  const patch = (key, value) => setForm((state) => ({ ...state, [key]: value }));

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

    saveContact({
      ...form,
      id: editing?.id,
      name,
      nickname: form.nickname.trim(),
      met_at: form.met_at || null,
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
          <TextInput
            label="Met at"
            type="date"
            value={form.met_at}
            onChange={(event) => patch('met_at', event.currentTarget.value)}
          />
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
          <Button color="indigo" onClick={handleSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
