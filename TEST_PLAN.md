# Pre-deployment test plan

Run every check below on `npm run dev` at `http://localhost:5173` before
pushing to GitHub and importing into Vercel. All tests use the live Firebase
project — no mocks.

Open the browser DevTools Console for every test. A successful test means
**no red errors in the console** in addition to the expected UI result.

---

## 1. Auth

| # | Action | Expected |
|---|--------|----------|
| 1.1 | Open `/` (Landing) | Hero + "Get started" / "Sign in" links render |
| 1.2 | Click "Sign in" → `/login` → sign up with a new email/password | Redirects to `/dashboard` with empty-state copy |
| 1.3 | Sign out from header | Redirects to `/` |
| 1.4 | Sign back in with the same credentials | Lands on `/dashboard` |
| 1.5 | Sign out, click "Continue with Google" on `/login` | Google popup → redirects to `/dashboard` |
| 1.6 | Try wrong password | Inline error shown, no redirect |
| 1.7 | Visit `/dashboard` while signed out | Redirects to `/login` |

---

## 2. Project CRUD

| # | Action | Expected |
|---|--------|----------|
| 2.1 | From `/dashboard` click "+ New project", fill name + client, submit | New card appears; URL stays at `/dashboard` |
| 2.2 | Fill all optional fields (scope, rate, deadline) on a second project | Card shows rate; both projects visible |
| 2.3 | Click a project card | Navigates to `/projects/:id`; header shows name + client |
| 2.4 | Reload `/projects/:id` | Data re-fetches without flicker; empty timeline state visible |
| 2.5 | Navigate to `/projects/bogusid123` | Shows "Project not found" empty/error state (not a crash) |

---

## 3. Entry creation + hash chain

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Add a **deliverable** with content only | Entry appears in timeline; chain badge stays green |
| 3.2 | Add a **deliverable** with a URL (e.g., Drive link) | "Link" row renders with clickable anchor |
| 3.3 | Add a **message** | Appears with type "message" |
| 3.4 | Add a **revision** referencing the deliverable in 3.1 | Revision links to the original (click-through scrolls to it) |
| 3.5 | Add 3 entries quickly in a row | All seal, chain stays green, no duplicate prev_hash |
| 3.6 | Hover over an entry's short hash | Shows full hex on tooltip / expanded view |
| 3.7 | Open the same project in a second tab, add an entry in tab A | Tab B updates in real time (Firestore onSnapshot) |

---

## 4. Tamper detection

This proves the chain actually catches edits. **Do this on a throwaway
project** — the entry will be permanently broken.

| # | Action | Expected |
|---|--------|----------|
| 4.1 | Add 3 entries to a test project | Badge green |
| 4.2 | In Firebase Console → Firestore → `projects/{id}/entries/{middle entry id}`, edit the `content` field | Firestore should **deny the write** (rule blocks updates to sealed entries) |
| 4.3 | If 4.2 is blocked, the rule works — no tampering possible. Move on. | ✅ Rule enforcement confirmed |
| 4.4 | (Optional, for demo) Temporarily relax rules in Rules tab to `allow write: if true`, edit the content, reload app | Badge turns RED at the tampered entry; entry row highlighted |
| 4.5 | Restore real `firestore.rules` and redeploy | Badge behavior back to normal |

---

## 5. Share links

| # | Action | Expected |
|---|--------|----------|
| 5.1 | On a project view, click "Generate share link" | Long URL appears, copy button works |
| 5.2 | Open the URL in an **incognito window** (not signed in) | Read-only timeline loads, no edit UI, chain badge green |
| 5.3 | In incognito, try to navigate to `/dashboard` | Redirects to `/login` (or Landing) |
| 5.4 | Back in the owner tab, click "Revoke share link" | Confirms the action |
| 5.5 | Refresh the incognito tab | Shows "Link revoked" or 404-style state, not the timeline |
| 5.6 | Click "Regenerate" — copy the new URL, open incognito | New URL works; old one still revoked |
| 5.7 | Tamper with the URL (change one char in the token) | Shows "Link invalid" / not-found state |

---

## 6. PDF export

| # | Action | Expected |
|---|--------|----------|
| 6.1 | On a project with 0 entries, click "Export PDF" | Inline error: "Nothing to export yet…" (no download) |
| 6.2 | Add 3+ entries, click "Export PDF" | Button shows "Generating…", then a PDF downloads |
| 6.3 | Open the PDF | Shows project name, client, rate, each entry with prev/self hash short form, green "Chain intact" badge |
| 6.4 | Break the chain (via 4.4), export again | Badge on PDF reads "Chain BROKEN — verify in app" (red) |
| 6.5 | File name | Format: `receipt-<slugified-name>.pdf` |

---

## 7. Firestore Security Rules (live scenarios)

Owner = primary test account. Other = a second signed-in account you create
in Firebase Console or via a second browser profile.

| # | Scenario | Expected |
|---|----------|----------|
| 7.1 | Owner reads own project from `/projects/:id` | Allowed — data loads |
| 7.2 | Other user signs in, visits `/projects/<owner's project id>` directly | Denied — "Project not found" or permission error in console |
| 7.3 | Anonymous (incognito) visits `/share/<valid token>` | Allowed — read-only timeline |
| 7.4 | Anonymous visits `/share/<revoked token>` or `/share/<random garbage>` | Denied — link-invalid state |
| 7.5 | In DevTools, attempt a direct Firestore write to someone else's entries collection (you can paste a small snippet into the console) | Denied by rules |

---

## 8. Edge cases & UI states

| # | Action | Expected |
|---|--------|----------|
| 8.1 | Submit the New Project form with an empty name | Inline validation error, no write |
| 8.2 | Submit the Add Entry form with empty content | Inline error "Content cannot be empty." |
| 8.3 | Paste a non-URL into the deliverable file URL field | HTML5 `type="url"` validation blocks submit |
| 8.4 | Press **Escape** while a modal is open | Modal closes, focus returns to trigger button |
| 8.5 | Tab through a modal | Focus stays trapped inside (doesn't leak to the page behind) |
| 8.6 | Navigate to `/some-random-path` | Renders 404 component |
| 8.7 | Disconnect Wi-Fi, try to add an entry | Submit fails gracefully with an error, no app crash |

---

## 9. Build + bundle

Run before pushing:

```bash
npm run build
npm run preview   # open the preview URL and spot-check Landing + Login
```

| # | Check | Expected |
|---|-------|----------|
| 9.1 | `npm run build` exits 0 | No errors, no unresolved imports |
| 9.2 | Build output | Main bundle < ~700 KB gzip; `SharePage-*.js` and `ReceiptPDF-*.js` appear as separate chunks (code-splitting working) |
| 9.3 | Preview build loads at `http://localhost:4173` | Landing renders, sign-in works |

---

## 10. Pre-push checklist

- [ ] `.env` is in `.gitignore` and NOT tracked by git
- [ ] `.env.example` IS tracked (so other contributors know what's needed)
- [ ] `dist/` is in `.gitignore`
- [ ] `node_modules/` is in `.gitignore`
- [ ] `firestore.rules` and `firestore.indexes.json` are committed
- [ ] README renders correctly on GitHub (preview in `raw.githubusercontent.com` or just push and look)
- [ ] No console.log left behind in components (search the `src/` folder)
- [ ] No hard-coded Firebase config in source — everything via `import.meta.env.*`

---

## 11. On Vercel, after first deploy

| # | Action | Expected |
|---|--------|----------|
| 11.1 | In Firebase Console → Authentication → Settings → Authorized domains, add your `*.vercel.app` domain | Required for Google sign-in on prod |
| 11.2 | Visit the Vercel URL, sign in with Google | Works |
| 11.3 | Create a project, add an entry | Writes succeed, real-time update works |
| 11.4 | Open a share link in incognito on the Vercel URL | Read-only view works |
| 11.5 | Export a PDF from production | Downloads successfully |
| 11.6 | Check Vercel deployment logs | No runtime errors |

---

**Only deploy once everything above is ✅.** If anything fails, fix before
pushing — broken first impressions matter, and the hash chain promise is
the whole point of the product.
