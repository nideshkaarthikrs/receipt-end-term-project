import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = requiredVars.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Firebase is not configured. Missing env variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in values from the Firebase console.',
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// =============================================================================
// Share-token generation
// =============================================================================
// 192 bits of entropy from the Web Crypto RNG. PRD requires >= 128 bits.
export function generateShareToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// SHA-256 hash chain
// =============================================================================
// Canonical JSON: object keys sorted alphabetically, values stringified by
// JSON.stringify with no extra whitespace. Two clients hashing the same logical
// payload must produce byte-identical input — that is what makes the chain
// reproducible.
function canonicalJSON(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJSON).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJSON(value[k]))
      .join(',') +
    '}'
  );
}

async function sha256Hex(text) {
  const buffer = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

// computeEntryHash takes the canonical fields that constitute an entry's
// identity inside the chain, builds a deterministic JSON string, and returns
// its SHA-256 hex digest. Order of fields in the input object does not matter.
export async function computeEntryHash(payload) {
  const canonical = {
    id: payload.id,
    type: payload.type,
    content: payload.content,
    file_sha256: payload.file_sha256 ?? null,
    created_at_iso: payload.created_at_iso,
    prev_hash: payload.prev_hash,
  };
  return sha256Hex(canonicalJSON(canonical));
}

// =============================================================================
// Entry creation — the two-step seal
// =============================================================================
// Firestore's serverTimestamp() resolves only at write time, so we cannot
// compute the SHA-256 hash before the first write. The flow:
//
//   1. addDoc with self_hash:null and prev_hash:null using serverTimestamp().
//   2. getDoc to read the resolved created_at.
//   3. Query the most recent SEALED entry (self_hash != null) to obtain prev_hash.
//      If none exists, prev_hash = "GENESIS".
//   4. Compute self_hash from the canonical payload + prev_hash.
//   5. updateDoc to fill in self_hash and prev_hash. The Firestore Security
//      Rules permit this update only while self_hash was null and every other
//      field is unchanged.
//
// Concurrent writes to the same project are serialized client-side via a per-
// project promise queue. The Spark plan + single-user-per-project usage model
// means cross-device concurrent writes are vanishingly rare; a server-side
// queue would require Cloud Functions (Blaze plan).
const projectWriteQueues = new Map();

export async function createEntry(projectId, payload) {
  const previous = projectWriteQueues.get(projectId) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() => sealNewEntry(projectId, payload));
  projectWriteQueues.set(
    projectId,
    next.catch(() => {}),
  );
  return next;
}

async function sealNewEntry(projectId, payload) {
  const entriesCol = collection(db, 'projects', projectId, 'entries');

  // Step 1 — initial write with null hash fields.
  const newRef = await addDoc(entriesCol, {
    type: payload.type,
    content: payload.content,
    file_url: payload.file_url ?? null,
    file_sha256: payload.file_sha256 ?? null,
    references_entry_id: payload.references_entry_id ?? null,
    created_at: serverTimestamp(),
    self_hash: null,
    prev_hash: null,
  });

  // Step 2 — read back to obtain the resolved server timestamp.
  const snap = await getDoc(newRef);
  const data = snap.data();
  const createdAtIso = data.created_at.toDate().toISOString();

  // Step 3 — find the most recent sealed entry's hash. Walk entries newest-first
  // and skip our own unsealed doc. Single-field orderBy needs no composite index.
  const prevQuery = query(
    entriesCol,
    orderBy('created_at', 'desc'),
    limit(5),
  );
  const prevSnap = await getDocs(prevQuery);
  let prevHash = 'GENESIS';
  for (const d of prevSnap.docs) {
    if (d.id === newRef.id) continue;
    const sealed = d.data().self_hash;
    if (sealed) {
      prevHash = sealed;
      break;
    }
  }

  // Step 4 — compute the hash.
  const selfHash = await computeEntryHash({
    id: newRef.id,
    type: data.type,
    content: data.content,
    file_sha256: data.file_sha256,
    created_at_iso: createdAtIso,
    prev_hash: prevHash,
  });

  // Step 5 — seal. Rules enforce that self_hash transitions from null to a
  // string exactly once and that no other field changes during this update.
  await updateDoc(newRef, { self_hash: selfHash, prev_hash: prevHash });

  return { id: newRef.id, self_hash: selfHash, prev_hash: prevHash };
}

// =============================================================================
// Project lookup by share token (for public SharePage)
// =============================================================================
export async function findProjectByShareToken(token) {
  if (!token) return null;
  const q = query(
    collection(db, 'projects'),
    where('share_token', '==', token),
    where('share_token_revoked_at', '==', null),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// Project doc reference helper.
export function projectDoc(projectId) {
  return doc(db, 'projects', projectId);
}
