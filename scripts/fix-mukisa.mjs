import { Client, Users, Databases, Query, ID } from 'node-appwrite';
const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const users = new Users(client);
const db = new Databases(client);

const list = await users.list([Query.equal('email', 'mukisanic@nrep.ug')]);
const user = list.users[0];
console.log('Found user:', user.$id, user.email);

try {
  await db.createDocument('nrep_matrix_db', 'profiles', user.$id, {
    userId: user.$id,
    name: 'Dr. Nicholas Mukisa',
    email: 'mukisanic@nrep.ug',
    role: 'admin',
    status: 'approved',
    sectionSlugs: [],
    createdAt: new Date().toISOString(),
  });
  console.log('Profile created for Dr. Mukisa');
} catch(e) {
  if(e.code === 409) {
    await db.updateDocument('nrep_matrix_db', 'profiles', user.$id, { role: 'admin', status: 'approved' });
    console.log('Profile updated for Dr. Mukisa');
  } else throw e;
}
