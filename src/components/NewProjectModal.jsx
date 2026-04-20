import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, generateShareToken } from '../firebase.js';
import useAuth from '../hooks/useAuth.js';
import Modal from './Modal.jsx';

const empty = {
  name: '',
  client_name: '',
  scope: '',
  rate: '',
  deadline: '',
};

export default function NewProjectModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);
    try {
      const ref = await addDoc(collection(db, 'projects'), {
        owner_id: user.uid,
        name: form.name.trim(),
        client_name: form.client_name.trim(),
        scope: form.scope.trim(),
        rate: form.rate ? Number(form.rate) : null,
        deadline: form.deadline || null,
        created_at: serverTimestamp(),
        share_token: generateShareToken(),
        share_token_revoked_at: null,
      });
      setForm(empty);
      onCreated?.(ref.id);
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
      title="New project"
      labelledBy="new-project-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="input"
            placeholder="Class 10 maths tuition"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="client_name" className="mb-1 block text-sm font-medium">
            Client name
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            value={form.client_name}
            onChange={handleChange}
            className="input"
            placeholder="Sharma family"
            required
          />
        </div>
        <div>
          <label htmlFor="scope" className="mb-1 block text-sm font-medium">
            Scope
          </label>
          <textarea
            id="scope"
            name="scope"
            value={form.scope}
            onChange={handleChange}
            className="input min-h-[80px]"
            placeholder="Three sessions per week, weekly assignments, term-end report."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rate" className="mb-1 block text-sm font-medium">
              Rate (₹)
            </label>
            <input
              id="rate"
              name="rate"
              type="number"
              min="0"
              step="1"
              value={form.rate}
              onChange={handleChange}
              className="input"
              placeholder="800"
            />
          </div>
          <div>
            <label htmlFor="deadline" className="mb-1 block text-sm font-medium">
              Deadline
            </label>
            <input
              id="deadline"
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
            {submitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
