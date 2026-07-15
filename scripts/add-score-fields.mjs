/**
 * Adds the missing scoreUser and scoreAdmin fields to the targets collection.
 * Run this once: node --env-file=.env.local scripts/add-score-fields.mjs
 */
import { Client, Databases } from 'node-appwrite';

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey    = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const DB = 'nrep_matrix_db';

async function addAttr(fn) {
  try { await fn(); console.log('  ✓ Added'); }
  catch (e) { if (e.code === 409) console.log('  ~ Already exists'); else throw e; }
}

async function main() {
  console.log('Adding scoreUser and scoreAdmin to targets collection...');
  await addAttr(() => databases.createIntegerAttribute(DB, 'targets', 'scoreUser', false, 0, 150));
  await addAttr(() => databases.createIntegerAttribute(DB, 'targets', 'scoreAdmin', false, 0, 150));
  console.log('\nDone. Wait ~10 seconds for Appwrite to index the new fields, then restart npm run dev.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
