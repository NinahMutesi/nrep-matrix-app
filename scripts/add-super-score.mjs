import { Client, Databases } from 'node-appwrite';
const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);
try {
  await db.createIntegerAttribute('nrep_matrix_db', 'targets', 'scoreSuperAdmin', false, 0, 150);
  console.log('✓ scoreSuperAdmin field added');
} catch(e) {
  if(e.code === 409) console.log('~ already exists');
  else throw e;
}
