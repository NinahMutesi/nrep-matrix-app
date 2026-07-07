/**
 * NREP Implementation Matrix — Bulk User Setup Script
 *
 * Creates all 12 staff accounts, approves them, sets roles and sections,
 * and assigns each person to their specific targets.
 *
 * Usage:
 *   node --env-file=.env.local scripts/bulk-users.mjs
 *
 * Each account is created with a common temporary password that staff
 * should change on first login.
 */

import { Client, Users, Databases, Query, ID } from 'node-appwrite';

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey    = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing env vars. Make sure .env.local is filled in.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users    = new Users(client);
const databases = new Databases(client);

const DATABASE_ID = 'nrep_matrix_db';

// ─── COMMON TEMPORARY PASSWORD ──────────────────────────────────────────────
// All accounts start with this password.
// Staff MUST change it on first login via their profile/account settings.
const TEMP_PASSWORD = 'NREP@2026!';

// ─── STAFF ASSIGNMENTS ──────────────────────────────────────────────────────
// role:         'admin' | 'member'
// sections:     section slugs from the matrix (used for broad section-level edit rights)
// targets:      specific target codes this person is personally assigned to
// results:      for reference only (used to log which results they cover)

const staff = [
  {
    email:    'mkizza@nrep.ug',
    name:     'M. Kizza',
    role:     'admin',
    sections: ['nrep-secretariat'],
    results:  'R1 & R3',
    targets:  ['3.1.1','3.1.2','3.2.1','3.5.1'],
  },
  {
    email:    'smuhumuza@nrep.ug',
    name:     'S. Muhumuza',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R1',
    targets:  ['1.1.1','1.1.2','1.2.1','1.5.1','1.5.2','1.6.1','1.6.2','1.6.3'],
  },
  {
    email:    'nmutesi@nrep.ug',
    name:     'Ninah Mutesi',
    role:     'admin',
    sections: ['nrep-secretariat'],
    results:  'R1',
    targets:  ['1.3.1','1.3.2','1.4.1','1.4.2','1.4.3','1.8.1','1.9.1','1.9.2'],
  },
  {
    email:    'dnatukwasa@nrep.ug',
    name:     'D. Natukwasa',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R1 & R3',
    targets:  ['1.7.1','1.7.2','1.7.3','1.7.4','3.3.1','3.3.2','3.3.3','3.4.1'],
  },
  {
    email:    'enabaho@nrep.ug',
    name:     'E. Nabaho',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R2 & R6',
    targets:  ['2.3.1','2.3.2'],
  },
  {
    email:    'zgabriella@nrep.ug',
    name:     'Z. Gabriella',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R2',
    targets:  ['2.2.1','2.2.2','2.2.3'],
  },
  {
    email:    'cnamagala@nrep.ug',
    name:     'N. Clare',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R2',
    targets:  ['2.1.1','2.1.2'],
  },
  {
    email:    'gkimuli@nrep.ug',
    name:     'Godfrey Kimuli',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R6',
    targets:  [],
  },
  {
    email:    'pnduhuura@nrep.ug',
    name:     'P. Nduhuura',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R4 & R5',
    targets:  ['4.1.1','4.1.2','4.6.1','4.6.2','4.6.3'],
  },
  {
    email:    'gnantayi@nrep.ug',
    name:     'Gorrette Nantayi',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R4 & R5',
    targets:  ['4.4.1','4.4.2','4.4.3','4.5.1','4.5.2','5.3.1','5.3.2','5.3.3'],
  },
  {
    email:    'rbukusuba@nrep.ug',
    name:     'R. Bukusuba',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R4 & R5',
    targets:  ['4.3.1','4.3.2','4.3.3','4.3.4','5.1.1','5.1.2','5.4.1','5.4.2','5.4.3'],
  },
  {
    email:    'ratukunda@nrep.ug',
    name:     'R. Atukunda',
    role:     'member',
    sections: ['nrep-secretariat'],
    results:  'R4 & R5',
    targets:  ['4.2.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.2.6'],
  },
];

// Also include these already-existing admins so their target assignments get set too
const existingAdmins = [
  { email: 'mukisanic@nrep.ug', name: 'Dr. Nicholas Mukisa', role: 'super_admin', sections: ['nrep-secretariat'], targets: [] },
  { email: 'dmaiku@nrep.ug',    name: 'Derrick Maiku',       role: 'admin',       sections: ['nrep-secretariat'], targets: [] },
];

// ─── HELPER: sleep to avoid rate limits ─────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── STEP 1: Load all targets from the database ─────────────────────────────
async function loadAllTargets() {
  const res = await databases.listDocuments(DATABASE_ID, 'targets', [Query.limit(500)]);
  // Build code → $id map
  const map = {};
  for (const t of res.documents) {
    map[t.code] = t.$id;
  }
  console.log(`  Loaded ${res.documents.length} targets from database.`);
  return map;
}

// ─── STEP 2: Create or find a user account ──────────────────────────────────
async function ensureUser(person) {
  try {
    const user = await users.create(ID.unique(), person.email, undefined, TEMP_PASSWORD, person.name);
    console.log(`  ✓ Created account: ${person.email}`);
    return user.$id;
  } catch (err) {
    if (err.code === 409) {
      // Already exists — find by email
      const list = await users.list([Query.equal('email', person.email)]);
      if (list.users.length > 0) {
        console.log(`  ~ Account already exists: ${person.email}`);
        return list.users[0].$id;
      }
    }
    throw err;
  }
}

// ─── STEP 3: Create or update the profile document ──────────────────────────
async function ensureProfile(userId, person) {
  try {
    await databases.createDocument(DATABASE_ID, 'profiles', userId, {
      userId,
      name: person.name,
      email: person.email,
      role: person.role,
      status: 'approved',
      sectionSlugs: person.sections,
      createdAt: new Date().toISOString(),
    });
    console.log(`  ✓ Created profile: ${person.name} (${person.role})`);
  } catch (err) {
    if (err.code === 409) {
      await databases.updateDocument(DATABASE_ID, 'profiles', userId, {
        role: person.role,
        status: 'approved',
        sectionSlugs: person.sections,
      });
      console.log(`  ~ Updated profile: ${person.name} (${person.role})`);
    } else {
      throw err;
    }
  }
}

// ─── STEP 4: Assign user to their specific targets ──────────────────────────
async function assignTargets(userId, person, targetCodeMap) {
  let assigned = 0;
  let notFound = [];

  for (const code of person.targets) {
    const docId = targetCodeMap[code];
    if (!docId) {
      notFound.push(code);
      continue;
    }
    try {
      const target = await databases.getDocument(DATABASE_ID, 'targets', docId);
      const existing = target.assignedUserIds ?? [];
      if (!existing.includes(userId)) {
        await databases.updateDocument(DATABASE_ID, 'targets', docId, {
          assignedUserIds: [...existing, userId],
        });
        assigned++;
      }
    } catch (err) {
      console.warn(`    ⚠ Could not assign target ${code}: ${err.message}`);
    }
    await sleep(100); // avoid rate limiting
  }

  if (assigned > 0)  console.log(`  ✓ Assigned ${assigned} target(s) to ${person.name}`);
  if (notFound.length) console.warn(`  ⚠ Target codes not found: ${notFound.join(', ')}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('━━━ NREP Matrix — Bulk User Setup ━━━\n');
  console.log(`Temporary password for all new accounts: ${TEMP_PASSWORD}`);
  console.log('Staff must change this on first login.\n');

  console.log('Loading targets from database…');
  const targetCodeMap = await loadAllTargets();

  const allStaff = [...staff];

  let created = 0, skipped = 0, failed = 0;

  for (const person of allStaff) {
    console.log(`\n→ ${person.name} <${person.email}> [${person.role}] — ${person.results ?? ''}`);
    try {
      const userId = await ensureUser(person);
      await sleep(200);
      await ensureProfile(userId, person);
      await sleep(200);
      if (person.targets && person.targets.length > 0) {
        await assignTargets(userId, person, targetCodeMap);
      }
      created++;
    } catch (err) {
      console.error(`  ✗ Failed for ${person.email}: ${err.message}`);
      failed++;
    }
    await sleep(300);
  }

  console.log('\n━━━ Done ━━━');
  console.log(`  ${created} accounts set up`);
  if (failed > 0) console.log(`  ${failed} failed — re-run to retry`);
  console.log(`\nShare this with staff:`);
  console.log(`  App URL:  (your Vercel URL)`);
  console.log(`  Password: ${TEMP_PASSWORD}`);
  console.log(`  Action:   Sign in → go to Account Settings → Change Password`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
