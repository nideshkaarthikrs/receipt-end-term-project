import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AppHeader from './AppHeader.jsx';
import ProjectCard from './ProjectCard.jsx';
import NewProjectModal from './NewProjectModal.jsx';
import useAuth from '../hooks/useAuth.js';
import useProjects from '../hooks/useProjects.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, loading, error } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreated = (id) => {
    navigate(`/projects/${id}`);
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome
              {user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {projects.length === 0
                ? 'Create your first project to start logging work.'
                : `${projects.length} active ${projects.length === 1 ? 'project' : 'projects'}.`}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            + New project
          </button>
        </div>

        {loading && (
          <p className="mt-10 text-sm text-ink-500" role="status">
            Loading projects…
          </p>
        )}

        {error && (
          <p className="mt-10 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && projects.length === 0 && (
          <section className="mt-10 rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center">
            <p className="text-base text-ink-700">No projects yet.</p>
            <p className="mt-1 text-sm text-ink-500">
              Each project is its own tamper-evident timeline.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => setModalOpen(true)}
            >
              Create your first project
            </button>
          </section>
        )}

        {!loading && projects.length > 0 && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
        )}
      </main>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
