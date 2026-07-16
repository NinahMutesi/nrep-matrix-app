import { Client, Users, Databases, Query } from 'node-appwrite';
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);
const u  = new Users(client);

const userRes = await u.list([Query.equal('email', 'smuhumuza@nrep.ug')]);
const userId  = userRes.users[0].$id;
console.log('Found S. Muhumuza:', userId);

const targetsRes = await db.listDocuments('nrep_matrix_db', 'targets', [
  Query.equal('code', '6.1.1'), Query.limit(10)
]);
console.log('Found', targetsRes.documents.length, 'target(s) with code 6.1.1');

for (const t of targetsRes.documents) {
  const existing = (t.assignedUserIds ?? []).filter(x => x !== userId);
  await db.updateDocument('nrep_matrix_db', 'targets', t.$id, {
    assignedUserIds: [...existing, userId],
  });
  console.log('Fixed: assigned smuhumuza to', t.$id, '(code:', t.code, ')');
}
console.log('Done.');
