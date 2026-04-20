import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, labelledBy }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;

    const focusable = dialogRef.current?.querySelector(
      'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = labelledBy ?? 'modal-title';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-50 w-full max-w-lg overflow-hidden rounded-lg
                   border border-ink-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
              aria-label="Close dialog"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
