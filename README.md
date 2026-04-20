# Receipt

Tamper-evident proof-of-work logs for freelancers.

> End-Term Project · Building Web Applications with React · Scaler School of Technology
> Author: Nidesh Kaarthik R S

Every deliverable, message, and revision is timestamped and SHA-256 hashed
into an append-only chain. Share one URL with the client; if any entry is
edited after the fact, the verification badge turns red and pinpoints the
broken entry.

## Why this exists

Student freelancers in India lose money and time on disputes that could be
prevented with a clean, verifiable record of work. Email threads can be
deleted, Notion boards can be silently rewritten, WhatsApp messages can be
unsent. Receipt is the proof layer that sits beside whatever tools the
freelancer already uses.

## Features

- **Email + Google sign-in** (Firebase Auth)
- **Project CRUD** — name, client, scope, rate, optional deadline
- **Three entry types** — `deliverable` (with optional URL), `message`, `revision` (links back to a prior deliverable)
- **SHA-256 hash chain** — each entry's hash includes the previous entry's hash, so tampering is instantly detectable
- **Two-step seal pattern** — entries are sealed in a follow-up write so the server-resolved timestamp can be included in the hash
- **Public share links** — 192-bit random tokens, revocable and regeneratable
- **Read-only public view** — chain re-verified client-side on every load
- **PDF export** — lazy-loaded `@react-pdf/renderer` bundle, downloadable per project
- **Real-time** — Firestore `onSnapshot` listeners; new entries appear instantly across tabs

## Tech stack

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Frontend         | React 18 + Vite + JavaScript                                  |
| Routing          | React Router v6                                               |
| Styling          | Tailwind CSS                                                  |
| State            | Context + `useReducer`; Firestore `onSnapshot` for server cache |
| Backend          | Firebase Auth + Firestore                                     |
| Hashing          | Web Crypto API (`crypto.subtle.digest`)                       |
| PDF              | `@react-pdf/renderer`, lazy-loaded                            |
| Hosting          | Vercel                                                        |

> **Free-tier note:** Cloud Storage and Cloud Functions both require the
> Blaze plan, so this MVP is link-only for deliverables (paste a Drive /
> Dropbox URL) and does not send the "share link opened" email
> notification (PRD F10).

## Folder structure

```
src/
├── assets/                 Static images (currently empty besides .gitkeep)
├── components/             All UI lives here, including page-level screens
│   ├── AppHeader.jsx
│   ├── AuthProvider.jsx          Context + useReducer for auth state
│   ├── AddEntryForm.jsx
│   ├── ChainStatusBadge.jsx
│   ├── Dashboard.jsx
│   ├── Landing.jsx
│   ├── LoadingScreen.jsx
│   ├── Login.jsx
│   ├── Modal.jsx                 Reusable, focus-trapping dialog
│   ├── NewProjectModal.jsx
│   ├── NotFound.jsx
│   ├── PDFExportButton.jsx       Lazy-loaded
│   ├── ProjectCard.jsx
│   ├── ProjectView.jsx
│   ├── ProtectedRoute.jsx
│   ├── ReceiptPDF.jsx            React-PDF document
│   ├── SharePage.jsx             Lazy-loaded
│   ├── ShareControls.jsx
│   ├── Timeline.jsx
│   └── TimelineEntry.jsx         React.memo + forwardRef for scroll-into-view
├── hooks/
│   ├── useAuth.js
│   ├── useHashChain.js           useMemo-backed chain verifier
│   ├── useProject.js
│   ├── useProjectEntries.js
│   ├── useProjects.js
│   └── useShareViews.js
├── App.jsx                       Routes + Suspense for lazy chunks
├── App.css
├── firebase.js                   Firebase init + hash chain helpers + token generator
├── index.css                     Tailwind layers + design tokens
└── main.jsx
firestore.rules                   Deploy with `firebase deploy --only firestore:rules`
```

## React concepts coverage

Every concept on the syllabus maps to a concrete site in the code:

| Concept                | Where                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| Functional components  | every component                                                   |
| Props & composition    | `TimelineEntry` ⊂ `Timeline` ⊂ `ProjectView` / `SharePage`       |
| `useState`             | every form, modal toggle                                          |
| `useEffect`            | `useProjects`, `useProject`, `useProjectEntries`, `useShareViews`, `useHashChain`, `Modal` (focus + Escape) |
| `useRef`               | `Modal` (focus restore), `Timeline` (scroll-into-view ref map)    |
| `useMemo`              | `useHashChain` fingerprint, `Timeline` grouping + reference map   |
| `useCallback`          | `ProjectView` handlers passed to memoized children                |
| Conditional rendering  | loading / empty / error / chain-broken / revoked-share states     |
| Lists & keys           | projects grid, timeline entries                                   |
| Lifting state up       | `AddEntryForm` reports new entry id up to `ProjectView`           |
| Controlled components  | every form field across `Login`, `NewProjectModal`, `AddEntryForm`|
| React Router v6        | 5 routes in `App.jsx` (1 lazy)                                    |
| Context API            | `AuthProvider` + `useAuth`                                        |
| `React.lazy` + Suspense| `SharePage` route, `PDFExportButton` inside `ProjectView`         |
| `React.memo`           | `TimelineEntry`                                                   |

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at <https://console.firebase.google.com> (Spark plan is enough).
2. Enable **Authentication** → Email/Password and Google providers.
3. Enable **Firestore** in the region nearest you (start in test mode for development).
4. Project settings → Your apps → register a Web app and copy the config.
5. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=…
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_STORAGE_BUCKET=…
   VITE_FIREBASE_MESSAGING_SENDER_ID=…
   VITE_FIREBASE_APP_ID=…
   ```

   The values are not secrets in the cryptographic sense (they ship to the
   browser), but trust is enforced by Firestore Security Rules — see below.

### 3. Run locally

```bash
npm run dev
```

Open <http://localhost:5173>.

### 4. Deploy security rules

Once you have the Firebase CLI installed and run `firebase init firestore`
in the project, deploy:

```bash
firebase deploy --only firestore:rules
```

The rules in [`firestore.rules`](./firestore.rules) enforce:

- only owners can write to their projects and entries;
- entries are append-only — once `self_hash` is non-null, no further writes;
- public read on a project requires a valid, non-revoked `share_token`;
- `share_views` is create-only (no client read);
- the two-step seal write is the only allowed entry update.

**Test the rules in the Firebase Rules Playground** for these scenarios:
1. Owner reads/writes own project — allowed.
2. Other signed-in user reads someone else's project without token — denied.
3. Anonymous viewer reads a project with a valid share_token — allowed.
4. Anonymous viewer reads a project with revoked or wrong token — denied.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. On <https://vercel.com>, import the repo. Framework preset auto-detects Vite.
3. **Environment variables**: add all six `VITE_FIREBASE_*` vars from your `.env`.
4. **Authorized domains**: in Firebase console → Authentication → Settings,
   add your `*.vercel.app` domain so Google sign-in works in production.
5. Deploy. Subsequent pushes to `main` auto-deploy.

## How the hash chain works

```
Entry N
  ├─ id, type, content, file_sha256, created_at_iso
  ├─ prev_hash  ← Entry N-1's self_hash (or "GENESIS" for first)
  └─ self_hash  ← SHA-256( canonical JSON of all of the above )
```

Canonical JSON sorts object keys alphabetically and uses `JSON.stringify`'s
default whitespace-free output, so the same logical payload always hashes to
the same digest regardless of insertion order.

`useHashChain` walks the timeline in order, recomputing each entry's hash
client-side, and reports `valid` only if every link reproduces. If any
entry's `content`, `created_at`, or `prev_hash` was edited in the database,
the computed `self_hash` won't match the stored one and the badge turns red
at that exact entry.

The two-step write (in `firebase.js → sealNewEntry`) is required because
Firestore's `serverTimestamp()` resolves only at write time. The Firestore
rules permit exactly one update per entry — the seal — and only while
`self_hash` is null and every other field is unchanged.

## Limitations and future work

- **Single-device serialization** — concurrent writes from multiple devices
  to the same project could race. Single-user MVP usage is the assumed case;
  multi-device anchoring needs Cloud Functions (Blaze plan).
- **No file uploads** — paste any URL (Drive, Dropbox, Notion) instead.
- **No share-view email notification** — would need Cloud Functions.
- **No team projects** — one owner per project.

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # production build to dist/
npm run preview    # preview production build locally
```
