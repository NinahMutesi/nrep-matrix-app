/**
 * Promotes a signed-up user to admin + approved, directly via the API key.
 * Use this once, to create your first administrator. After that, use the
 * in-app Admin page for everyone else.
 *
 * Usage: node --env-file=.env.local scripts/make-admin.mjs you@example.com
 */
import { Client, Databases, Users, Query } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const email = process.argv[2];

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing env vars. Copy .env.example to .env.local and fill them in.');
  process.exit(1);
}
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/make-admin.mjs you@example.com');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = 'nrep_matrix_db';

async function main() {
  const res = await databases.listDocuments(DATABASE_ID, 'profiles', [Query.equal('email', email), Query.limit(1)]);
  const profile = res.documents[0];
  if (!profile) {
    console.error(`No profile found for ${email}. Sign up in the app first, then re-run this.`);
    process.exit(1);
  }

  await databases.updateDocument(DATABASE_ID, 'profiles', profile.$id, {
    role: 'admin',
    status: 'approved',
  });
  await users.updateLabels(profile.userId, ['admin']);

  console.log(`${email} is now an approved admin.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
