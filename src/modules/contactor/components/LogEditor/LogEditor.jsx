import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { LOG_KINDS } from '../../api/contactorMocks';
import { useContactorStore } from '../../store/contactorStore';

const emptyForm = {
  contact_id: '',
  kind: 'note',
  occurred_at: '',
  title: '',
  content: '',
  is_pinned: false,
  eventor_event_id: null,
  stuffer_register_id: null,
  exploiter_event_id: null,
};

export const LogEditor = () => {
  const {
    logEditorOpen, logEditorParams, closeLogEditor, contacts, saveLog,
  } = useContactorStore();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!logEditorOpen) return;
    setForm({
      ...emptyForm,
      contact_id: logEditorParams?.contact_id || contacts.find((contact) => !contact.is_archived)?.id || '',
      kind: logEditorParams?.kind || 'note',
      occurred_at: new Date().toISOString().slice(0, 16),
    });
  }, [contacts, logEditorOpen, logEditorParams]);

  const patch = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const contactOptions = contacts
    .filter((contact) => !contact.is_archived)
    .map((contact) => ({ value: contact.id, label: contact.name }));

  const handleSave = () => {
    if (!form.contact_id || (!form.title.trim() && !form.content.trim())) return;

    saveLog({
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
    });
  };

  return (
    <Modal opened={logEditorOpen} onClose={closeLogEditor} title="New log entry" size="lg">
      <Stack gap="sm">
        <Group grow align="flex-start">
          <Select label="Contact" value={form.contact_id} data={contactOptions} onChange={(value) => patch('contact_id', value || '')} />
          <Select label="Kind" value={form.kind} data={LOG_KINDS} onChange={(value) => patch('kind', value || 'note')} />
        </Group>
        <Group grow align="flex-start">
          <TextInput
            label="Time"
            type="datetime-local"
            value={form.occurred_at}
            onChange={(event) => patch('occurred_at', event.currentTarget.value)}
          />
          <TextInput label="Title" value={form.title} onChange={(event) => patch('title', event.currentTarget.value)} />
        </Group>
        <Textarea
          label="Content"
          placeholder="What happened, what you learned, or what should be remembered."
          minRows={4}
          value={form.content}
          onChange={(event) => patch('content', event.currentTarget.value)}
        />
        <Checkbox
          label="Pin this entry"
          checked={form.is_pinned}
          onChange={(event) => patch('is_pinned', event.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={closeLogEditor}>Cancel</Button>
          <Button color="indigo" onClick={handleSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
