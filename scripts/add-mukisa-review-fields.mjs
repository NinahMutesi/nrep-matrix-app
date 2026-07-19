import { Client, Databases } from 'node-appwrite';
const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);
const DB = 'nrep_matrix_db';

async function add(fn) {
  try { await fn(); console.log('✓ Added'); }
  catch(e) { if(e.code===409) console.log('~ Exists'); else throw e; }
}

console.log('Adding Dr. Mukisa review fields to pending_updates...');
await add(() => db.createEnumAttribute(DB, 'pending_updates', 'mukisaStatus', ['pending','approved','rejected'], false));
await add(() => db.createStringAttribute(DB, 'pending_updates', 'mukisaNote', 2048, false));
await add(() => db.createDatetimeAttribute(DB, 'pending_updates', 'mukisaAt', false));
console.log('Done. Wait 10 seconds before restarting the app.');
