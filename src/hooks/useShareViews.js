import { useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// Best-effort log of a public share-link open. The Firestore Security Rules
// allow create-only on share_views (no read), so this is fire-and-forget.
export default function useShareViews(projectId) {
  useEffect(() => {
    if (!projectId) return;
    addDoc(collection(db, 'share_views'), {
      project_id: projectId,
      viewed_at: serverTimestamp(),
    }).catch(() => {
      // Silently swallow — view-logging failure must never break the page.
    });
  }, [projectId]);
}
