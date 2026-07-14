import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { RELATION_KINDS } from '../../api/contactorMocks';
import { useContactorStore } from '../../store/contactorStore';

const emptyForm = {
  contact_a_id: '',
  contact_b_id: '',
  kind: 'friend',
  context: '',
  valid_from: '',
  valid_to: '',
  note: '',
};

export const RelationEditor = () => {
  const {
    relationEditorOpen, relationEditorParams, closeRelationEditor, contacts, saveRelation,
  } = useContactorStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!relationEditorOpen) return;
    const activeContacts = contacts.filter((contact) => !contact.is_archived);
    const contactA = relationEditorParams?.contact_id || activeContacts[0]?.id || '';
    const contactB = activeContacts.find((contact) => contact.id !== contactA)?.id || '';
    setForm({ ...emptyForm, contact_a_id: contactA, contact_b_id: contactB });
  }, [contacts, relationEditorOpen, relationEditorParams?.contact_id]);

  const patch = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const contactOptions = contacts
    .filter((contact) => !contact.is_archived)
    .map((contact) => ({ value: contact.id, label: contact.name }));

  const handleSave = () => {
    if (!form.contact_a_id || !form.contact_b_id || form.contact_a_id === form.contact_b_id) return;

    saveRelation({
      ...form,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
    });
  };

  return (
    <Modal opened={relationEditorOpen} onClose={closeRelationEditor} title="New relation" size="lg">
      <Stack gap="sm">
        <Group grow align="flex-start">
          <Select label="Contact A" value={form.contact_a_id} data={contactOptions} onChange={(value) => patch('contact_a_id', value || '')} />
          <Select label="Contact B" value={form.contact_b_id} data={contactOptions} onChange={(value) => patch('contact_b_id', value || '')} />
        </Group>
        <Group grow align="flex-start">
          <Select label="Kind" value={form.kind} data={RELATION_KINDS} onChange={(value) => patch('kind', value || 'friend')} />
          <TextInput
            label="Context"
            placeholder="University 2015, Teftele 2026, neighborhood"
            value={form.context}
            onChange={(event) => patch('context', event.currentTarget.value)}
          />
        </Group>
        <Group grow align="flex-start">
          <TextInput
            label="Valid from"
            type="date"
            value={form.valid_from}
            onChange={(event) => patch('valid_from', event.currentTarget.value)}
          />
          <TextInput
            label="Valid to"
            type="date"
            description="Leave empty if still active"
            value={form.valid_to}
            onChange={(event) => patch('valid_to', event.currentTarget.value)}
          />
        </Group>
        <Textarea
          label="Note"
          placeholder="Optional details about this relation"
          minRows={2}
          value={form.note}
          onChange={(event) => patch('note', event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={closeRelationEditor}>Cancel</Button>
          <Button color="indigo" onClick={handleSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
