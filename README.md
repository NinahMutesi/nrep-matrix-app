# NREP Strategic Plan — Implementation Matrix

A tracker for the National Renewable Energy Policy (NREP) Strategic Plan implementation
matrix: 5 strategic results, 27 outputs, 64 targets — each owned by a lead organization
("section"), with live progress tracking, comments, and report uploads.

Built with **Next.js 14 (App Router)** + **Appwrite** (auth, database, storage).

The real matrix data from `NREP___SP_Implementation_Matrix.xlsx` is already parsed into
`scripts/data/matrix-seed.json` and is what the seed script loads — you don't need to
re-export anything from the spreadsheet to get a fully populated demo.

---

## 1. Create an Appwrite project (skip if you already have one)

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) and create a free account, **or**
   self-host Appwrite ([self-hosting docs](https://appwrite.io/docs/advanced/self-hosting)).
2. Create a new **Project**. Note its **Project ID** (Project Settings → General).
3. Note your **API Endpoint** (Project Settings → General → usually
   `https://cloud.appwrite.io/v1` for Cloud).
4. Go to **Auth → Settings** and make sure the **Email/Password** method is enabled.
5. Go to **Project Settings → API Keys → Create API Key**. Give it a name like
   `setup-script` and these scopes: `databases.read`, `databases.write`, `storage.read`,
   `storage.write`, `teams.read`, `teams.write`, `users.read`, `users.write`. Copy the key
   — Appwrite only shows it once.
6. Go to **Overview** (or **Platforms** in older versions) and add a **Web platform**
   with hostname `localhost` (and later your production domain) so the browser SDK is
   allowed to talk to your project.

## 2. Configure this project

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=the-key-you-just-created
```

```bash
npm install
```

## 3. Create the database schema

This creates the database, every collection/attribute/index, the storage bucket, and one
Appwrite **Team** per section (lead organization) — team membership is what determines who
can edit a section's tasks.

```bash
node --env-file=.env.local scripts/setup-appwrite.mjs
```

Re-run safely any time — it skips anything that already exists. Attribute creation is
asynchronous on Appwrite's side; if the seed step below complains about a missing
attribute, wait ~10 seconds and re-run setup once more.

## 4. Seed the real matrix data

```bash
node --env-file=.env.local scripts/seed.mjs
```

This loads `scripts/data/matrix-seed.json` (already extracted from the provided `.xlsx`)
and creates the 5 results, 27 outputs, 64 targets, and 27 sections.

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Request access**, and sign up
with your own name/email/password.

## 6. Make yourself an admin

New accounts start as a `pending` `viewer` — there's no admin yet to approve you, so this
one time you do it from the command line:

```bash
node --env-file=.env.local scripts/make-admin.mjs you@example.com
```

Refresh the app. You're now an approved admin and will see an **Admin** tab in the sidebar.

## 7. Approve everyone else from the UI

From here on, every other person signs up themselves and shows up under **Admin → Pending
requests**. Approve them, set their role, and tick which sections (lead organizations) they
belong to — that's what lets them edit a task's progress, comment, and upload reports for
that section.

---

## Roles

| Role      | Can view matrix & analysis | Can edit a task                              | Admin console |
|-----------|----------------------------|-----------------------------------------------|----------------|
| `viewer`  | ✅                          | only tasks they're personally assigned to     | ❌             |
| `analyst` | ✅                          | only tasks they're personally assigned to     | ❌             |
| `member`  | ✅                          | any task whose section they belong to          | ❌             |
| `admin`   | ✅                          | every task                                     | ✅             |

A person whose `status` is `pending` or `rejected` cannot see the matrix at all — they're
held on the **Awaiting approval** screen.

## What's in the box

- **Self-signup + admin approval** (`/signup`, `/pending`, `/admin`)
- **Dashboard** with a card per strategic Result, an overall progress dial, and a
  one-click CSV export of the whole matrix
- **Matrix view** (`/matrix`) — filter by result, by section (with each section's live
  progress % shown right in the dropdown), or by status; export the filtered view to CSV
- **Task detail** (`/matrix/[id]`) — progress % and status dropdowns (editable only by the
  assigned section or an admin), a comment thread, and a report/document uploader with a
  download link per file
- **Analysis** (`/analysis`) — progress by result, by section, status breakdown, and a
  live "yet to be accomplished" at-risk list
- Scripts to set up and seed Appwrite from a cold start, plus a one-time admin bootstrap

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the data model, permission model, and
folder structure.

## Known limitations / suggested next steps

- Auth is handled client-side via the Appwrite Web SDK (no server-rendered session check on
  first paint), which is simple and works well for an internal tool, but means there's a
  brief "Loading…" flash before a logged-out visitor is redirected. For a public-facing
  deployment, consider adding SSR session validation via a cookie-forwarding middleware.
- Individual (not just section-level) task assignment is modelled in the data
  (`assignedUserIds`) but there's no dedicated UI for it yet — add an "assign people" picker
  on the task detail page if you need finer-grained ownership than whole-section access.
- CSV export is client-generated; if you need branded PDF exports of the dashboard cards,
  that's a good next addition (e.g. via a serverless PDF-rendering route).
