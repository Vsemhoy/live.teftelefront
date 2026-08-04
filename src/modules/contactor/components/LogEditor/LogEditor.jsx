import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, MultiSelect, Select, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { LOG_KINDS } from '../../api/contactorMocks';
import { useContacts, useSaveLog } from '../../api/contactorApi';
import { useContactorStore } from '../../store/contactorStore';
import { useTags } from '@/modules/eventor/api/eventorApi';
import { useExpertStore } from '@/shared/expertStore';
import { MdEditor } from '@/shared/components/MdEditor';

const emptyForm = {
  contact_id: '',
  kind: 'note',
  occurred_at: '',
  title: '',
  content: '',
  tag_ids: [],
  mentioned_contact_ids: [],
  is_pinned: false,
  is_expert: false,
  eventor_event_id: null,
  stuffer_register_id: null,
  exploiter_event_id: null,
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
  error?.message ||
  'Failed to save log entry';

const MarkdownField = ({ value, onChange }) => (
  <MdEditor
    value={value}
    onChange={onChange}
    placeholder="What happened, what you learned, or what should be remembered."
    className="cnt-md-editor"
    contentEditableClassName="cnt-md-contenteditable"
    toolbarClassName="cnt-md-toolbar"
  />
);

export const LogEditor = () => {
  const {
    logEditorOpen, logEditorParams, closeLogEditor,
  } = useContactorStore();
  const { data: contacts = [] } = useContacts({ group: 'all', q: '', sort: 'name', dir: 'asc' });
  const { data: tags = [] } = useTags();
  const saveLog = useSaveLog();
  const expertMode = useExpertStore((s) => s.expertMode);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!logEditorOpen) return;
    setForm({
      ...emptyForm,
      contact_id: logEditorParams?.contact_id || contacts.find((contact) => !contact.is_archived)?.id || '',
      kind: logEditorParams?.kind || 'note',
      occurred_at: new Date().toISOString().slice(0, 16),
      tag_ids: Array.isArray(logEditorParams?.tag_ids) ? logEditorParams.tag_ids : [],
      mentioned_contact_ids: Array.isArray(logEditorParams?.mentioned_contact_ids) ? logEditorParams.mentioned_contact_ids : [],
    });
  }, [contacts, logEditorOpen, logEditorParams]);

  const patch = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const contactOptions = contacts
    .filter((contact) => !contact.is_archived)
    .map((contact) => ({ value: contact.id, label: contact.name }));
  const tagOptions = tags.map((tag) => ({ value: tag.id, label: tag.name }));

  const handleSave = () => {
    if (!form.contact_id || (!form.title.trim() && !form.content.trim())) return;

    saveLog.mutate({
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      body_md: form.content.trim(),
      tag_ids: form.tag_ids,
      mentioned_contact_ids: form.mentioned_contact_ids,
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
    }, {
      onSuccess: closeLogEditor,
      onError: (error) => notifications.show({ message: getErrorMessage(error), color: 'red' }),
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
        <Group grow align="flex-start">
          <MultiSelect
            label="Tags"
            data={tagOptions}
            value={form.tag_ids}
            onChange={(value) => patch('tag_ids', value)}
            searchable
            clearable
          />
          <MultiSelect
            label="Mentioned people"
            data={contactOptions.filter((contact) => contact.value !== form.contact_id)}
            value={form.mentioned_contact_ids}
            onChange={(value) => patch('mentioned_contact_ids', value)}
            searchable
            clearable
          />
        </Group>
        <MarkdownField value={form.content} onChange={(value) => patch('content', value)} />
        <Group gap="xl">
          <Checkbox
            label="Pin this entry"
            checked={form.is_pinned}
            onChange={(e) => patch('is_pinned', e.currentTarget.checked)}
          />
          {expertMode && (
            <Checkbox
              label="Expert only"
              color="indigo"
              checked={form.is_expert}
              onChange={(e) => patch('is_expert', e.currentTarget.checked)}
            />
          )}
        </Group>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={closeLogEditor}>Cancel</Button>
          <Button color="indigo" onClick={handleSave} loading={saveLog.isPending}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
