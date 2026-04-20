import { useCallback, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import ReceiptPDF from './ReceiptPDF.jsx';

function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export default function PDFExportButton({ project, entries, chainValid = true }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = useCallback(async () => {
    if (entries.length === 0) {
      setError('Nothing to export yet — add at least one entry first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await pdf(
        <ReceiptPDF project={project} entries={entries} chainValid={chainValid} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${safeFileName(project.name)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [project, entries, chainValid]);

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? 'Generating…' : 'Export PDF'}
      </button>
      {error && (
        <p role="alert" className="ml-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
