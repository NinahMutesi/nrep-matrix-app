# Architecture

## 1. Source data → data model

The uploaded matrix is a 5-level hierarchy:

```
Result (5)             "Result 1: Net zero energy NREP Museum."
 └─ Outcome (1 per Result, stored as a field on Result)
 └─ Output (27 total)   "Output 1.1 — Advancement in clean cooking energy adoption"
     └─ Target (64 total) "Target 1.1.1 — At least 6,000 ... cookers sold annually"
         ├─ Timeline, Lead Organization, Activities
         └─ Weighting + Year 1 / Year 2 actual scores (historical scorecard data)
```

Each **Target** is the unit of work people actually update day to day. Its
**Lead Organization** (e.g. "MEMD", "UNACC & WREAU") becomes a **Section** in the app —
the thing people belong to and the thing that gates edit rights.

```
results        →  5 docs   (the strategic pillars, shown as dashboard cards)
outputs        →  27 docs  (grouping under a result)
targets        →  64 docs  (the actual tracked tasks)
sections       →  27 docs  (one per lead organization; backed by an Appwrite Team)
profiles       →  1 per user (role, approval status, section memberships)
comments       →  free-text progress notes per target
reports        →  metadata for uploaded files per target (bytes live in Storage)
```

`weightTarget` / `weightOutput` / `weightOutcome` and the Year 1 / Year 2 actual score
columns from the spreadsheet are preserved on each target as read-only reference fields —
the original weighted-scorecard methodology is not lost, it sits alongside the new
operational `progressPercent` / `status` fields that sections update live.

## 2. Roles & permission model

Two layers, intentionally simple:

1. **App-level checks** (`src/lib/permissions.ts`) — the actual source of truth.
   `canEditTarget(profile, target)` returns true if:
   - `profile.role === 'admin'`, or
   - the target is in `profile.assignedUserIds` (works for any role), or
   - `profile.role === 'member'` and `profile.sectionSlugs` includes the target's section.

   Every **write** (progress/status update, comment, report) goes through a Next.js API
   route under `/api/...`. Each route re-derives the caller's identity from a short-lived
   Appwrite JWT (see below), loads their profile with the admin SDK, and calls the same
   `canEditTarget` / `canContributeToTarget` check before writing anything. Reads
   (`results`, `outputs`, `targets`, `sections`, `profiles`) are done directly from client
   components via the Appwrite Web SDK, gated only by "must be a logged-in user" — there's
   no sensitive data in the matrix itself, so broad read access keeps the UI simple and
   fast.

2. **Appwrite-native permissions** (set by `scripts/setup-appwrite.mjs` /
   `scripts/seed.mjs`) as defense in depth — each `targets` document also carries
   `Permission.update(Role.team(<section's teamId>))` and
   `Permission.update(Role.label('admin'))`, so even a direct Appwrite API call bypassing
   the Next.js layer is still constrained by team membership / admin label. Collections
   that should never be written by an ordinary client (`comments`, `reports`, `targets`'s
   create/delete) simply have no client-facing create/update permission at all — only the
   server's API key can write them, which is what the API routes use.

### Why a JWT, not a cookie session?

This app authenticates entirely with the **Appwrite Web SDK in the browser** (simplest
correct option for an internal tool, see `src/lib/auth-context.tsx`). Appwrite's own
session cookie is scoped to the Appwrite endpoint's domain, not this app's domain, so our
own `/api/...` routes can't read it directly. The standard fix: the client calls
`account.createJWT()` (a 15-minute-lived token) and sends it as `Authorization: Bearer ...`
on every call to our own API (`src/lib/authed-fetch.ts`). The API route verifies it by
spinning up a JWT-scoped Appwrite client and calling `account.get()`
(`src/lib/api-auth.ts`).

## 3. Self-signup & approval flow

1. `/signup` creates an Appwrite Auth account **and** a `profiles` document
   (`role: 'viewer'`, `status: 'pending'`) in the same call, client-side.
2. `/pending` is shown to anyone whose profile isn't `approved` yet — they cannot reach
   `/dashboard`, `/matrix`, or `/analysis`.
3. An admin opens `/admin`, sees the pending list, sets a role, ticks the sections this
   person belongs to, and clicks **Approve**. The API route
   (`/api/admin/users/[id]`) updates the profile and syncs Appwrite Team membership to
   match `sectionSlugs` (best-effort; wrapped so a Team-sync hiccup never blocks the
   profile update itself).
4. **Bootstrapping the first admin**: nobody can approve the first admin from the UI
   (chicken-and-egg), so `scripts/make-admin.mjs <email>` promotes a signed-up account
   directly with the API key. Use it exactly once.

## 4. Folder structure

```
src/
  app/
    page.tsx                     redirect router based on auth state
    login/, signup/, pending/    auth screens
    dashboard/                   strategy cards + CSV export
    matrix/                      filterable table (result / section / status)
    matrix/[targetId]/           task detail: progress, comments, reports
    analysis/                    charts: by result, by section, status mix, at-risk list
    admin/                       approvals + role/section assignment
    api/
      admin/users/               list + approve/patch (admin only)
      targets/[id]/              progress/status update
      targets/[id]/comments/     list + create
      targets/[id]/reports/      list + register upload metadata
  components/                    Sidebar, AppShell, ProgressDial, StatusBadge,
                                  StrategyCard, TargetTable, ProgressControls,
                                  CommentThread, ReportUploader, AuthShell
  lib/
    appwrite/client.ts            browser SDK (Account/Databases/Storage/Teams)
    appwrite/server.ts            admin SDK, API-key auth, server-only
    appwrite/config.ts            collection IDs + shared enums — single source of truth
    auth-context.tsx              React context wrapping account/session/profile
    api-auth.ts                   JWT → user/profile resolution for API routes
    authed-fetch.ts                client helper that attaches a fresh JWT
    permissions.ts                 canEditTarget / canContributeToTarget / isAdmin
    use-matrix-data.ts             client hook: loads results/outputs/targets/sections
    progress.ts, export-csv.ts     small presentation/export helpers
  types/index.ts                  shared TS types mirroring the collections
scripts/
  setup-appwrite.mjs              creates DB/collections/attributes/indexes/bucket/teams
  seed.mjs                        loads matrix-seed.json into the collections
  make-admin.mjs                  one-time bootstrap of the first admin
  data/matrix-seed.json           the real matrix, already parsed from the .xlsx
```

## 5. Extending this

- **Per-person task assignment**: the `assignedUserIds` field and the permission checks
  already support it; add a multi-select on the task detail page and a small API route to
  patch it (mirroring `/api/admin/users/[id]`'s pattern of updating both the document and,
  if you want native-permission parity, the document's `Permission.update(Role.user(id))`
  list).
- **Notifications**: hook into the comment/report API routes to fan out an email or Slack
  message — Appwrite Functions or a simple `fetch` to a webhook both work.
- **Multi-year scoring**: `y1Target/y1Initiatives/y1Kra` and `y2*` are already there for
  Year 1/2; add `y3*`...`y5*` attributes the same way as the plan extends.
