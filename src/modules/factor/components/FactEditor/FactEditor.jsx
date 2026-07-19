import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useDeleteFact, useSaveFact } from '../../api/factorApi';
import { FACT_DISPLAY_MODES, FACT_FORMATS, FACT_KINDS } from '../../api/factorMocks';
import { useFactorStore } from '../../store/factorStore';

const cleanKeywords = (value) => String(value || '')
  .split(',')
  .map((keyword) => keyword.trim())
  .filter(Boolean);

export const FactEditor = () => {
  const { factEditorOpen, factEditorParams, closeFactEditor } = useFactorStore();
  const saveFact = useSaveFact();
  const deleteFact = useDeleteFact();
  const [form, setForm] = useState({
    label: '',
    value: '',
    format: 'text',
    language: '',
    unit: '',
    context: '',
    search_keywords: '',
    kind: 'other',
    display_mode: 'plain',
    valid_from: null,
    valid_to: null,
    is_pinned: false,
    is_sensitive: false,
    is_expert: false,
  });

  useEffect(() => {
    if (!factEditorOpen) return;
    setForm({
      id: factEditorParams?.id,
      label: factEditorParams?.label || '',
      value: factEditorParams?.value || '',
      format: factEditorParams?.format || 'text',
      language: factEditorParams?.language || '',
      unit: factEditorParams?.unit || '',
      context: factEditorParams?.context || '',
      search_keywords: (factEditorParams?.search_keywords || factEditorParams?.search_aliases || factEditorParams?.tags || []).join(', '),
      kind: factEditorParams?.kind || 'other',
      display_mode: factEditorParams?.display_mode || 'plain',
      valid_from: factEditorParams?.valid_from ? new Date(factEditorParams.valid_from) : null,
      valid_to: factEditorParams?.valid_to ? new Date(factEditorParams.valid_to) : null,
      is_pinned: Boolean(factEditorParams?.is_pinned),
      is_sensitive: Boolean(factEditorParams?.is_sensitive),
      is_expert: Boolean(factEditorParams?.is_expert),
    });
  }, [factEditorOpen, factEditorParams]);

  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const canDelete = Boolean(form.id);

  const handleSave = async () => {
    if (!form.label.trim() || !form.value.trim()) {
      notifications.show({ message: 'Label and value are required', color: 'red' });
      return;
    }

    const payload = {
      ...form,
      label: form.label.trim(),
      value: form.value.trim(),
      format: form.format || 'text',
      language: form.language.trim() || null,
      unit: form.unit.trim() || null,
      context: form.context.trim(),
      search_keywords: cleanKeywords(form.search_keywords),
      valid_from: form.valid_from ? form.valid_from.toISOString().slice(0, 10) : null,
      valid_to: form.valid_to ? form.valid_to.toISOString().slice(0, 10) : null,
      kind: form.kind || 'other',
      display_mode: form.display_mode || 'plain',
    };

    try {
      await saveFact.mutateAsync(payload);
      notifications.show({ message: 'Fact saved', color: 'cyan' });
    } catch (error) {
      notifications.show({ message: 'Fact saved locally', color: 'yellow' });
    }
    closeFactEditor();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm('Delete this fact?')) return;

    try {
      await deleteFact.mutateAsync(form);
      notifications.show({ message: 'Fact deleted', color: 'red' });
    } catch (error) {
      notifications.show({ message: 'Could not delete fact', color: 'red' });
      return;
    }

    closeFactEditor();
  };

  return (
    <Modal opened={factEditorOpen} onClose={closeFactEditor} title="Fact" size="lg">
      <Stack>
        <TextInput
          label="Label"
          placeholder="VIN BMW E90"
          value={form.label}
          onChange={(event) => patch('label', event.currentTarget.value)}
          required
        />
        <Textarea
          label="Value"
          placeholder="WBA3G510X0NS47291"
          value={form.value}
          onChange={(event) => patch('value', event.currentTarget.value)}
          minRows={2}
          required
        />
        <Group grow align="flex-start">
          <Select
            label="Format"
            value={form.format}
            data={FACT_FORMATS}
            onChange={(value) => patch('format', value || 'text')}
            allowDeselect={false}
          />
          <Select
            label="Display"
            value={form.display_mode}
            data={FACT_DISPLAY_MODES}
            onChange={(value) => patch('display_mode', value || 'plain')}
            allowDeselect={false}
          />
        </Group>
        <Group grow align="flex-start">
          <TextInput
            label="Language"
            placeholder="bash, js, php, sql"
            value={form.language}
            onChange={(event) => patch('language', event.currentTarget.value)}
          />
          <TextInput
            label="Unit"
            placeholder="kg, km, TB, m3"
            value={form.unit}
            onChange={(event) => patch('unit', event.currentTarget.value)}
          />
        </Group>
        <Textarea
          label="Context"
          placeholder="Where this fact came from"
          value={form.context}
          onChange={(event) => patch('context', event.currentTarget.value)}
          minRows={2}
        />
        <Group grow align="flex-start">
          <Select
            label="Kind"
            value={form.kind}
            data={FACT_KINDS.filter((kind) => kind.value !== 'all')}
            onChange={(value) => patch('kind', value || 'other')}
            allowDeselect={false}
          />
          <TextInput
            label="Search keywords"
            placeholder="bmw, vin, service"
            value={form.search_keywords}
            onChange={(event) => patch('search_keywords', event.currentTarget.value)}
          />
        </Group>
        <Group grow align="flex-start">
          <DatePickerInput
            label="Valid from"
            value={form.valid_from}
            onChange={(value) => patch('valid_from', value)}
            clearable
          />
          <DatePickerInput
            label="Valid to"
            value={form.valid_to}
            onChange={(value) => patch('valid_to', value)}
            clearable
          />
        </Group>
        <Group>
          <Checkbox
            label="Pinned"
            checked={form.is_pinned}
            onChange={(event) => patch('is_pinned', event.currentTarget.checked)}
          />
          <Checkbox
            label="Sensitive"
            checked={form.is_sensitive}
            onChange={(event) => patch('is_sensitive', event.currentTarget.checked)}
          />
          <Checkbox
            label="Expert only"
            checked={form.is_expert}
            onChange={(event) => patch('is_expert', event.currentTarget.checked)}
          />
        </Group>
        <Group justify="space-between">
          <div>
            {canDelete && (
              <Button variant="subtle" color="red" onClick={handleDelete} loading={deleteFact.isPending}>
                Delete
              </Button>
            )}
          </div>
          <Group gap={8}>
            <Button variant="default" onClick={closeFactEditor}>Cancel</Button>
            <Button color="blue" onClick={handleSave} loading={saveFact.isPending}>Save</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
