import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import AddEntryForm from './AddEntryForm.jsx';
import ChainStatusBadge from './ChainStatusBadge.jsx';
import ShareControls from './ShareControls.jsx';
import Timeline from './Timeline.jsx';
import useAuth from '../hooks/useAuth.js';
import useProject from '../hooks/useProject.js';
import useProjectEntries from '../hooks/useProjectEntries.js';
import useHashChain from '../hooks/useHashChain.js';

// PDF export bundles `@react-pdf/renderer`, which is large. Lazy-loaded to
// keep the initial Project view fast.
const PDFExportButton = lazy(() => import('./PDFExportButton.jsx'));

export default function ProjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { project, loading: projectLoading, error: projectError } = useProject(id);
  const { entries, loading: entriesLoading } = useProjectEntries(id);
  const chainResult = useHashChain(entries);

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [latestId, setLatestId] = useState(null);

  const handleEntryCreated = useCallback((newId) => setLatestId(newId), []);
  const handleCloseEntry = useCallback(() => setEntryModalOpen(false), []);
  const handleCloseShare = useCallback(() => setShareModalOpen(false), []);

  const deliverables = useMemo(
    () => entries.filter((e) => e.type === 'deliverable'),
    [entries],
  );

  const isOwner = project && user && project.owner_id === user.uid;

  if (projectLoading) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-ink-500" role="status">
            Loading project…
          </p>
        </main>
      </>
    );
  }

  if (projectError || !project) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <Link to="/dashboard" className="text-sm text-ink-500 hover:text-ink-700">
            ← Back to dashboard
          </Link>
          <p
            className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {projectError ?? 'Project not found.'}
          </p>
        </main>
      </>
    );
  }

  if (!isOwner) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            role="alert"
          >
            You don&apos;t have access to this project. Ask the owner for a share link.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/dashboard" className="text-sm text-ink-500 hover:text-ink-700">
          ← Back to dashboard
        </Link>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Client · <span className="text-ink-700">{project.client_name}</span>
              {project.rate ? (
                <>
                  {' '}
                  · ₹{project.rate}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ChainStatusBadge result={chainResult} />
          </div>
        </header>

        {project.scope && (
          <p className="mt-3 rounded-md bg-ink-100 p-3 text-sm text-ink-700">
            {project.scope}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setEntryModalOpen(true)}
          >
            + Add entry
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShareModalOpen(true)}
          >
            Share link
          </button>
          <Suspense
            fallback={
              <button type="button" className="btn-secondary" disabled>
                Loading PDF…
              </button>
            }
          >
            <PDFExportButton project={project} entries={entries} />
          </Suspense>
        </div>

        {entriesLoading ? (
          <p className="mt-8 text-sm text-ink-500" role="status">
            Loading entries…
          </p>
        ) : (
          <Timeline
            entries={entries}
            chainResult={chainResult}
            scrollToLatestId={latestId}
          />
        )}
      </main>

      <AddEntryForm
        open={entryModalOpen}
        onClose={handleCloseEntry}
        projectId={project.id}
        deliverables={deliverables}
        onCreated={handleEntryCreated}
      />

      <ShareControls
        project={project}
        open={shareModalOpen}
        onClose={handleCloseShare}
      />
    </>
  );
}
