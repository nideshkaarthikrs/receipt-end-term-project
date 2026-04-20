import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import Modal from './Modal.jsx';

function toForm(project) {
  return {
    name: project?.name ?? '',
    client_name: project?.client_name ?? '',
    scope: project?.scope ?? '',
    rate: project?.rate != null ? String(project.rate) : '',
    deadline: project?.deadline ?? '',
  };
}

export default function EditProjectModal({ open, onClose, project }) {
  const [form, setForm] = useState(() => toForm(project));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && project) {
      setForm(toForm(project));
      setError(null);
    }
  }, [open, project]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!project) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        name: form.name.trim(),
        client_name: form.client_name.trim(),
        scope: form.scope.trim(),
        rate: form.rate ? Number(form.rate) : null,
        deadline: form.deadline || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit project"
      labelledBy="edit-project-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className="mb-1 block text-sm font-medium">
            Project name
          </label>
          <input
            id="edit-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="input"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="edit-client_name" className="mb-1 block text-sm font-medium">
            Client name
          </label>
          <input
            id="edit-client_name"
            name="client_name"
            type="text"
            value={form.client_name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label htmlFor="edit-scope" className="mb-1 block text-sm font-medium">
            Scope
          </label>
          <textarea
            id="edit-scope"
            name="scope"
            value={form.scope}
            onChange={handleChange}
            className="input min-h-[80px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-rate" className="mb-1 block text-sm font-medium">
              Rate (₹)
            </label>
            <input
              id="edit-rate"
              name="rate"
              type="number"
              min="0"
              step="1"
              value={form.rate}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="edit-deadline" className="mb-1 block text-sm font-medium">
              Deadline
            </label>
            <input
              id="edit-deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

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
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
