/**
 * Fix R6 target assignments — clears all assignedUserIds on R6 targets
 * and reassigns based on new_strategy.xlsx.
 *
 * R6 Output mapping from spreadsheet:
 *   6.1 → S. Muhumuza, Z. Gabriella
 *   6.2 → Nabaho
 *   6.3 → D. Natukwasa, R. Bukusuba, Z. Gabriella
 *   6.4 → Z. Gabriella, N. Clare
 *
 * Usage: node --env-file=.env.local scripts/fix-r6.mjs
 */

import { Client, Databases, Users, Query } from 'node-appwrite';

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey    = process.env.APPWRITE_API_KEY;

const client    = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const users     = new Users(client);
const DB = 'nrep_matrix_db';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// R6 output → assigned emails (from new_strategy.xlsx)
const R6_ASSIGNMENTS = {
  '6.1': ['smuhumuza@nrep.ug', 'zgabriella@nrep.ug'],
  '6.2': ['enabaho@nrep.ug'],
  '6.3': ['dnatukwasa@nrep.ug', 'rbukusuba@nrep.ug', 'zgabriella@nrep.ug'],
  '6.4': ['zgabriella@nrep.ug', 'cnamagala@nrep.ug'],
};

async function getUserId(email) {
  const res = await users.list([Query.equal('email', email)]);
  if (!res.users.length) { console.warn(`  ⚠ User not found: ${email}`); return null; }
  return res.users[0].$id;
}

async function main() {
  console.log('━━━ Fix R6 Target Assignments ━━━\n');

  // Load all R6 targets
  const targetsRes = await databases.listDocuments(DB, 'targets', [Query.limit(500)]);
  const r6Targets  = targetsRes.documents.filter(t => t.code?.startsWith('6.'));
  console.log(`Found ${r6Targets.length} R6 targets\n`);

  if (!r6Targets.length) {
    console.log('No R6 targets found. Make sure seed.mjs has been run.');
    return;
  }

  // Cache user IDs
  const userIdCache = {};
  const allEmails   = [...new Set(Object.values(R6_ASSIGNMENTS).flat())];
  for (const email of allEmails) {
    userIdCache[email] = await getUserId(email);
    await sleep(100);
  }

  // Process each R6 target
  for (const target of r6Targets) {
    const code    = target.code; // e.g. "6.1.1", "6.2.1", etc.
    const output  = code.split('.').slice(0, 2).join('.'); // "6.1", "6.2", etc.
    const emails  = R6_ASSIGNMENTS[output] ?? [];
    const userIds = emails.map(e => userIdCache[e]).filter(Boolean);

    console.log(`→ Target ${code} (Output ${output})`);
    if (!userIds.length) {
      console.log(`  No assignment — clearing`);
      await databases.updateDocument(DB, 'targets', target.$id, { assignedUserIds: [] });
    } else {
      console.log(`  Assigning: ${emails.join(', ')}`);
      await databases.updateDocument(DB, 'targets', target.$id, { assignedUserIds: userIds });
    }
    await sleep(150);
  }

  console.log('\n━━━ Done ━━━');
  console.log('R6 targets now assigned correctly per new_strategy.xlsx');
}

main().catch(e => { console.error(e.message); process.exit(1); });
