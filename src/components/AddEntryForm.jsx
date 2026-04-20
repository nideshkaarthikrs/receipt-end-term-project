import { useState } from 'react';
import { createEntry } from '../firebase.js';
import Modal from './Modal.jsx';

const TYPES = [
  { value: 'deliverable', label: 'Deliverable', hint: 'A file, link, or completed unit of work.' },
  { value: 'message', label: 'Message', hint: 'A note or external communication you want logged.' },
  { value: 'revision', label: 'Revision', hint: 'A change to a previous deliverable. References the original entry.' },
];

const empty = { type: 'deliverable', content: '', file_url: '', references_entry_id: '' };

export default function AddEntryForm({ open, onClose, projectId, deliverables, onCreated }) {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.content.trim()) {
      setError('Content cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const sealed = await createEntry(projectId, {
        type: form.type,
        content: form.content.trim(),
        file_url: form.type === 'deliverable' && form.file_url.trim() ? form.file_url.trim() : null,
        file_sha256: null,
        references_entry_id:
          form.type === 'revision' && form.references_entry_id ? form.references_entry_id : null,
      });
      setForm(empty);
      onCreated?.(sealed.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeType = TYPES.find((t) => t.value === form.type);

  return (
    <Modal open={open} onClose={onClose} title="Add entry" labelledBy="add-entry-title">
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Type</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TYPES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm transition
                  ${
                    form.type === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-300 bg-white text-ink-700 hover:border-ink-500'
                  }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={form.type === t.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
          {activeType && (
            <p className="mt-2 text-xs text-ink-500">{activeType.hint}</p>
          )}
        </fieldset>

        <div>
          <label htmlFor="content" className="mb-1 block text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            className="input min-h-[100px]"
            placeholder={
              form.type === 'message'
                ? 'Sent over email at 6 PM. Confirmed scope of next two sessions.'
                : form.type === 'revision'
                  ? 'Replaced thumbnail per feedback. v2 attached.'
                  : 'Session 4 complete — covered Pythagoras and worked through 12 problems.'
            }
            required
          />
        </div>

        {form.type === 'deliverable' && (
          <div>
            <label htmlFor="file_url" className="mb-1 block text-sm font-medium">
              File or link <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="file_url"
              name="file_url"
              type="url"
              value={form.file_url}
              onChange={handleChange}
              className="input"
              placeholder="https://drive.google.com/…"
            />
            <p className="mt-1 text-xs text-ink-500">
              Paste a Drive, Dropbox, or any URL. Files aren&apos;t hosted by Receipt.
            </p>
          </div>
        )}

        {form.type === 'revision' && deliverables.length > 0 && (
          <div>
            <label htmlFor="references_entry_id" className="mb-1 block text-sm font-medium">
              Revises which deliverable?
            </label>
            <select
              id="references_entry_id"
              name="references_entry_id"
              value={form.references_entry_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">— none —</option>
              {deliverables.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.content.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Sealing…' : 'Add to chain'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
