/**
 * Creates every Appwrite resource this app needs: database, collections,
 * attributes, indexes, a storage bucket, and one Team per section.
 *
 * Usage:
 *   1. Copy .env.example to .env.local and fill in your Appwrite endpoint,
 *      project ID, and an API key with full Databases/Storage/Teams/Users scope.
 *   2. node --env-file=.env.local scripts/setup-appwrite.mjs
 *      (Node 20+; on older Node, `export $(cat .env.local | xargs)` first.)
 *
 * Safe to re-run: every create call is wrapped so an existing resource is
 * skipped instead of throwing.
 */
import { Client, Databases, Storage, Teams, Permission, Role, ID } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT / NEXT_PUBLIC_APPWRITE_PROJECT_ID / APPWRITE_API_KEY.');
  console.error('Copy .env.example to .env.local and fill them in first.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

const DATABASE_ID = 'nrep_matrix_db';
const BUCKET_REPORTS = 'reports_bucket';

async function ignoreExists(promise) {
  try {
    return await promise;
  } catch (err) {
    if (err.code === 409) return null; // already exists
    throw err;
  }
}

async function main() {
  console.log('-> Database');
  await ignoreExists(databases.create(DATABASE_ID, 'NREP Implementation Matrix'));

  console.log('-> Collection: profiles');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'profiles', 'Profiles', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'profiles', 'userId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'profiles', 'name', 128, true));
  await attr(() => databases.createEmailAttribute(DATABASE_ID, 'profiles', 'email', true));
  await attr(() => databases.createEnumAttribute(DATABASE_ID, 'profiles', 'role', ['super_admin', 'admin', 'analyst', 'member', 'viewer'], true));
  await attr(() => databases.createEnumAttribute(DATABASE_ID, 'profiles', 'status', ['pending', 'approved', 'rejected'], true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'profiles', 'sectionSlugs', 64, false, undefined, true));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'profiles', 'createdAt', true));
  await index(() => databases.createIndex(DATABASE_ID, 'profiles', 'idx_userId', 'key', ['userId']));
  await index(() => databases.createIndex(DATABASE_ID, 'profiles', 'idx_email', 'key', ['email']));

  console.log('-> Collection: sections');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'sections', 'Sections', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'sections', 'slug', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'sections', 'name', 256, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'sections', 'teamId', 64, true));
  await index(() => databases.createIndex(DATABASE_ID, 'sections', 'idx_slug', 'key', ['slug']));

  console.log('-> Collection: results');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'results', 'Results', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'results', 'code', 16, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'results', 'title', 512, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'results', 'outcome', 1024, false));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'results', 'order', true));

  console.log('-> Collection: outputs');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'outputs', 'Outputs', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'outputs', 'resultId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'outputs', 'code', 16, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'outputs', 'title', 512, true));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'outputs', 'order', true));
  await index(() => databases.createIndex(DATABASE_ID, 'outputs', 'idx_resultId', 'key', ['resultId']));

  console.log('-> Collection: targets');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'targets', 'Targets', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'outputId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'resultId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'code', 16, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'description', 2048, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'timeline', 128, false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'leadOrg', 256, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'sectionSlug', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'activities', 4096, false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'weightTarget', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'weightOutput', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'weightOutcome', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y1Target', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y1Initiatives', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y1Kra', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y2Target', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y2Initiatives', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'targets', 'y2Kra', false));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'targets', 'progressPercent', true, 0, 100));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'targets', 'scoreManual', false, 0, 25));
  await attr(() =>
    databases.createEnumAttribute(
      DATABASE_ID,
      'targets',
      'status',
      ['not_started', 'in_progress', 'on_track', 'at_risk', 'delayed', 'completed'],
      true
    )
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'assignedUserIds', 64, false, undefined, true));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'targets', 'updatedAt', false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'targets', 'updatedBy', 64, false));
  await index(() => databases.createIndex(DATABASE_ID, 'targets', 'idx_sectionSlug', 'key', ['sectionSlug']));
  await index(() => databases.createIndex(DATABASE_ID, 'targets', 'idx_resultId', 'key', ['resultId']));
  await index(() => databases.createIndex(DATABASE_ID, 'targets', 'idx_outputId', 'key', ['outputId']));

  console.log('-> Collection: comments');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'comments', 'Comments', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'comments', 'targetId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'comments', 'userId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'comments', 'userName', 128, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'comments', 'body', 4096, true));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'comments', 'createdAt', true));
  await index(() => databases.createIndex(DATABASE_ID, 'comments', 'idx_targetId', 'key', ['targetId']));

  console.log('-> Collection: reports');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'reports', 'Reports', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'targetId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'fileId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'fileName', 256, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'description', 1024, false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'uploadedBy', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'reports', 'uploadedByName', 128, true));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'reports', 'uploadedAt', true));
  await index(() => databases.createIndex(DATABASE_ID, 'reports', 'idx_targetId', 'key', ['targetId']));

  console.log('-> Collection: yearly_records');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'yearly_records', 'Yearly Records', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'yearly_records', 'targetId', 64, true));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'yearly_records', 'year', true, 1, 20));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'yearly_records', 'label', 64, false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'yearly_records', 'targetScore', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'yearly_records', 'initiativesScore', false));
  await attr(() => databases.createFloatAttribute(DATABASE_ID, 'yearly_records', 'kraScore', false));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'yearly_records', 'progressPercent', false, 0, 100));
  await attr(() =>
    databases.createEnumAttribute(
      DATABASE_ID,
      'yearly_records',
      'status',
      ['not_started', 'in_progress', 'on_track', 'at_risk', 'delayed', 'completed'],
      false
    )
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'yearly_records', 'note', 2048, false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'yearly_records', 'recordedBy', 64, false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'yearly_records', 'recordedByName', 128, false));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'yearly_records', 'recordedAt', true));
  await index(() => databases.createIndex(DATABASE_ID, 'yearly_records', 'idx_targetId', 'key', ['targetId']));
  await index(() => databases.createIndex(DATABASE_ID, 'yearly_records', 'idx_year', 'key', ['year']));

  console.log('-> Collection: pending_updates');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'pending_updates', 'Pending Updates', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'targetId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'targetDescription', 2048, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'submittedBy', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'submittedByName', 128, true));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'pending_updates', 'submittedAt', true));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'pending_updates', 'proposedProgressPercent', true, 0, 100));
  await attr(() =>
    databases.createEnumAttribute(
      DATABASE_ID, 'pending_updates', 'proposedStatus',
      ['not_started', 'in_progress', 'on_track', 'at_risk', 'delayed', 'completed'],
      true
    )
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'justification', 2048, false));
  await attr(() =>
    databases.createEnumAttribute(
      DATABASE_ID, 'pending_updates', 'reviewStatus',
      ['pending', 'approved', 'rejected'],
      true
    )
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'reviewedBy', 64, false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'reviewedByName', 128, false));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'pending_updates', 'reviewedAt', false));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'pending_updates', 'reviewNote', 1024, false));
  await index(() => databases.createIndex(DATABASE_ID, 'pending_updates', 'idx_reviewStatus', 'key', ['reviewStatus']));
  await index(() => databases.createIndex(DATABASE_ID, 'pending_updates', 'idx_targetId_pu', 'key', ['targetId']));

  console.log('-> Collection: rec_actions');
  await ignoreExists(
    databases.createCollection(DATABASE_ID, 'rec_actions', 'Recommendation Actions', [Permission.read(Role.users())])
  );
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'rec_actions', 'targetId', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'rec_actions', 'actionDescription', 2048, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'rec_actions', 'actionedBy', 64, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'rec_actions', 'actionedByName', 128, true));
  await attr(() => databases.createStringAttribute(DATABASE_ID, 'rec_actions', 'organisation', 256, false));
  await attr(() => databases.createIntegerAttribute(DATABASE_ID, 'rec_actions', 'score', false, 0, 25));
  await attr(() => databases.createDatetimeAttribute(DATABASE_ID, 'rec_actions', 'actionedAt', true));
  await attr(() => databases.createEnumAttribute(DATABASE_ID, 'rec_actions', 'status', ['pending', 'in_progress', 'completed'], true));
  await index(() => databases.createIndex(DATABASE_ID, 'rec_actions', 'idx_targetId_ra', 'key', ['targetId']));

  console.log('-> Storage bucket: reports');
  await ignoreExists(
    storage.createBucket(BUCKET_REPORTS, 'Reports', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ])
  );

  console.log('-> Teams (one per section, from scripts/data/matrix-seed.json)');
  const seedPath = path.join(__dirname, 'data', 'matrix-seed.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  for (const section of seed.sections) {
    if (section.teamId) {
      console.log(`   team for ${section.name} already recorded (${section.teamId}), skipping`);
      continue;
    }
    const team = await teams.create(ID.unique(), section.name);
    section.teamId = team.$id;
    console.log(`   created team for ${section.name} -> ${team.$id}`);
  }
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  console.log('\nDone. Attributes can take a few seconds to finish indexing on the Appwrite side.');
  console.log('Next: npm run appwrite:seed');
}

async function attr(fn) {
  try {
    await fn();
  } catch (err) {
    if (err.code === 409) return; // attribute already exists
    console.error('Attribute error:', err.message);
  }
}

async function index(fn) {
  try {
    await fn();
  } catch (err) {
    if (err.code === 409) return;
    console.error('Index error:', err.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
