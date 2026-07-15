/**
 * NREP Matrix — Updated Bulk User Setup
 * Source: new_strategy.xlsx (latest version)
 *
 * KEY CHANGES from previous version:
 * - S. Muhumuza: dropped 1.2.1, output 6.1 added (no R6 codes in system yet)
 * - Ninah: dropped 1.8.1
 * - D. Natukwasa: dropped 3.4.1, gained 6.3 range (mapped to R6 targets)
 * - Nabaho: gained 5.1.1, 5.1.2
 * - Z. Gabriella: gained 1.2.1
 * - N. Clare: major change — now R1+R2+R3+R6, gained 1.8.1 and 3.4.1
 * - Rodney Bukusuba: dropped 5.1.x, gained 6.3 range
 * - Gorrette: same targets, gained 6.8 area
 * - P. Nduhuura: same targets, gained 6.9 area
 *
 * Usage: node --env-file=.env.local scripts/bulk-users.mjs
 */

import { Client, Users, Databases, Query, ID } from 'node-appwrite';

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey    = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const client    = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users     = new Users(client);
const databases = new Databases(client);
const DB  = 'nrep_matrix_db';
const PWD = 'NREP@2026!';

const staff = [
  // ── SYSTEM ADMIN (Dr. Nicholas — super admin, no targets) ──────────────────
  {
    email: 'mukisanic@nrep.ug',
    name:  'Dr. Nicholas Mukisa',
    role:  'super_admin',
    sections: ['nrep-secretariat'],
    targets: [],
  },

  // ── SECTION ADMINS ──────────────────────────────────────────────────────────

  // M. Kizza | Admin R1&R3 | R3 targets (unchanged)
  {
    email: 'mkizza@nrep.ug',
    name:  'M. Kizza',
    role:  'admin',
    sections: ['nrep-secretariat'],
    targets: ['3.1.1','3.1.2','3.2.1','3.5.1'],
  },

  // Nabaho | Admin R2&R6 | gained 5.1.1, 5.1.2
  {
    email: 'enabaho@nrep.ug',
    name:  'E. Nabaho',
    role:  'admin',
    sections: ['nrep-secretariat'],
    targets: ['2.3.1','2.3.2','5.1.1','5.1.2'],
  },

  // P. Nduhuura | Admin R4&R5 | same targets
  {
    email: 'pnduhuura@nrep.ug',
    name:  'P. Nduhuura',
    role:  'admin',
    sections: ['nrep-secretariat'],
    targets: ['4.1.1','4.1.2','4.6.1','4.6.2','4.6.3'],
  },

  // ── MEMBERS ─────────────────────────────────────────────────────────────────

  // S. Muhumuza | R1 | dropped 1.2.1 (given to Gabriella)
  {
    email: 'smuhumuza@nrep.ug',
    name:  'S. Muhumuza',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['1.1.1','1.1.2','1.5.1','1.5.2','1.6.1','1.6.2','1.6.3'],
  },

  // Ninah Mutesi | R1 | dropped 1.8.1 (given to Clare)
  {
    email: 'nmutesi@nrep.ug',
    name:  'Ninah Mutesi',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['1.3.1','1.3.2','1.4.1','1.4.2','1.4.3','1.9.1','1.9.2'],
  },

  // D. Natukwasa | R1&R3 | dropped 3.4.1, gained 6.3 range
  {
    email: 'dnatukwasa@nrep.ug',
    name:  'D. Natukwasa',
    role:  'member',
    sections: ['nrep-secretariat'],
    // 6.3.1–6.3.10 map to R6 financial recommendation targets in system
    targets: ['1.7.1','1.7.2','1.7.3','1.7.4','3.3.1','3.3.2','3.3.3'],
  },

  // Z. Gabriella | R2 | gained 1.2.1
  {
    email: 'zgabriella@nrep.ug',
    name:  'Z. Gabriella',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['1.2.1','2.2.1','2.2.2','2.2.3'],
  },

  // N. Clare | R1+R2+R3+R6 | major change: gained 1.8.1 and 3.4.1
  {
    email: 'cnamagala@nrep.ug',
    name:  'N. Clare',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['1.8.1','2.1.1','2.1.2','3.4.1'],
  },

  // Godfrey Kimuli | R6 | no specific codes in spreadsheet
  {
    email: 'gkimuli@nrep.ug',
    name:  'Godfrey Kimuli',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: [],
  },

  // Gorrette Nantayi | R4&R5 | same targets
  {
    email: 'gnantayi@nrep.ug',
    name:  'Gorrette Nantayi',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['4.4.1','4.4.2','4.4.3','4.5.1','4.5.2','5.3.1','5.3.2','5.3.3'],
  },

  // Rodney Bukusuba | R4&R5 | dropped 5.1.x (given to Nabaho), gained 6.3 range
  {
    email: 'rbukusuba@nrep.ug',
    name:  'Rodney Bukusuba',
    role:  'member',
    sections: ['nrep-secretariat'],
    // 6.3.11–6.3.19 will map to R6 targets when seeded
    targets: ['4.3.1','4.3.2','4.3.3','4.3.4','5.4.1','5.4.2','5.4.3'],
  },

  // R. Atukunda | R4&R5 | unchanged
  {
    email: 'ratukunda@nrep.ug',
    name:  'R. Atukunda',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: ['4.2.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.2.6'],
  },

  // M. Tusiime (not in spreadsheet)
  {
    email: 'm.tusiime@nrep.ug',
    name:  'M. Tusiime',
    role:  'member',
    sections: ['nrep-secretariat'],
    targets: [],
  },

  // Derrick Maiku — IT admin, no targets
  {
    email: 'dmaiku@nrep.ug',
    name:  'Derrick Maiku',
    role:  'admin',
    sections: [],
    targets: [],
  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function loadTargets() {
  const res = await databases.listDocuments(DB, 'targets', [Query.limit(500)]);
  const map = {};
  for (const t of res.documents) map[t.code] = t.$id;
  console.log(`Loaded ${res.documents.length} targets.\n`);
  return map;
}

async function ensureUser(p) {
  const e = p.email.trim();
  try {
    const u = await users.create(ID.unique(), e, undefined, PWD, p.name);
    console.log(`  ✓ Created: ${e}`);
    return u.$id;
  } catch (err) {
    if (err.code === 409) {
      const l = await users.list([Query.equal('email', e)]);
      if (l.users.length) { console.log(`  ~ Exists: ${e}`); return l.users[0].$id; }
    }
    throw err;
  }
}

async function ensureProfile(uid, p) {
  try {
    await databases.createDocument(DB, 'profiles', uid, {
      userId: uid, name: p.name, email: p.email.trim(),
      role: p.role, status: 'approved',
      sectionSlugs: p.sections, createdAt: new Date().toISOString(),
    });
    console.log(`  ✓ Profile: ${p.name} (${p.role})`);
  } catch (err) {
    if (err.code === 409) {
      await databases.updateDocument(DB, 'profiles', uid, {
        role: p.role, status: 'approved', sectionSlugs: p.sections,
      });
      console.log(`  ~ Updated: ${p.name} (${p.role})`);
    } else throw err;
  }
}

async function assignTargets(uid, p, map) {
  if (!p.targets.length) return;
  let done = 0; const miss = [];
  for (const code of p.targets) {
    const id = map[code.trim()];
    if (!id) { miss.push(code); continue; }
    try {
      const doc = await databases.getDocument(DB, 'targets', id);
      const ex  = (doc.assignedUserIds ?? []).filter(x => x !== uid);
      await databases.updateDocument(DB, 'targets', id, { assignedUserIds: [...ex, uid] });
      done++;
    } catch (e) { console.warn(`    ⚠ ${code}: ${e.message}`); }
    await sleep(80);
  }
  if (done)        console.log(`  ✓ ${done} targets assigned`);
  if (miss.length) console.warn(`  ⚠ Not found in DB: ${miss.join(', ')}`);
}

async function main() {
  console.log('━━━ NREP Bulk Setup — new_strategy.xlsx (updated) ━━━\n');
  const map = await loadTargets();
  let ok = 0, fail = 0;
  for (const p of staff) {
    console.log(`→ ${p.name} [${p.role}] — ${p.targets.length} targets`);
    try {
      const uid = await ensureUser(p); await sleep(200);
      await ensureProfile(uid, p);    await sleep(200);
      await assignTargets(uid, p, map);
      ok++;
    } catch (e) { console.error(`  ✗ ${e.message}`); fail++; }
    await sleep(300); console.log();
  }
  console.log(`━━━ Done: ${ok} set up · ${fail} failed ━━━`);
}

main().catch(e => { console.error(e); process.exit(1); });
