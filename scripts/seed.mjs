/**
 * Populates the database with the actual NREP SP Implementation Matrix data
 * (parsed from the supplied .xlsx into scripts/data/matrix-seed.json).
 *
 * Run scripts/setup-appwrite.mjs first — it creates the section Teams and
 * writes their teamId back into matrix-seed.json, which this script reads.
 *
 * Usage: node --env-file=.env.local scripts/seed.mjs
 */
import { Client, Databases, Permission, Role, ID, Query } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing env vars. Copy .env.example to .env.local and fill them in.');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const DATABASE_ID = 'nrep_matrix_db';

// The NREP Strategic Plan runs 2023-2028 in Uganda fiscal years (July-June).
// Year 1 = 2023/24, Year 2 = 2024/25, etc.
const PLAN_START_YEAR = 2023;
function fiscalYearLabel(yearNumber) {
  const startYear = PLAN_START_YEAR + yearNumber - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endYearShort}`;
}

async function upsert(collectionId, docId, data, permissions) {
  try {
    return await databases.createDocument(DATABASE_ID, collectionId, docId, data, permissions);
  } catch (err) {
    if (err.code === 409) {
      return await databases.updateDocument(DATABASE_ID, collectionId, docId, data);
    }
    throw err;
  }
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'matrix-seed.json'), 'utf-8'));

  console.log(`Seeding ${seed.sections.length} sections...`);
  for (const s of seed.sections) {
    await upsert(
      'sections',
      s.slug,
      { slug: s.slug, name: s.name, teamId: s.teamId ?? '' },
      [Permission.read(Role.users()), Permission.update(Role.label('admin'))]
    );
  }

  let outputCount = 0;
  let targetCount = 0;

  for (const result of seed.results) {
    console.log(`Seeding ${result.code}: ${result.title}`);
    await upsert(
      'results',
      result.id,
      { code: result.code, title: result.title, outcome: result.outcome, order: result.order },
      [Permission.read(Role.users()), Permission.update(Role.label('admin'))]
    );

    for (const output of result.outputs) {
      outputCount++;
      await upsert(
        'outputs',
        output.id,
        { resultId: result.id, code: output.code, title: output.title, order: output.order },
        [Permission.read(Role.users()), Permission.update(Role.label('admin'))]
      );

      for (const target of output.targets) {
        targetCount++;
        const section = seed.sections.find((s) => s.slug === target.sectionSlug);
        const permissions = [Permission.read(Role.users()), Permission.update(Role.label('admin'))];
        if (section?.teamId) {
          permissions.push(Permission.update(Role.team(section.teamId)));
        }

        await upsert(
          'targets',
          target.id,
          {
            outputId: output.id,
            resultId: result.id,
            code: target.code,
            description: target.description,
            timeline: target.timeline,
            leadOrg: target.leadOrg,
            sectionSlug: target.sectionSlug,
            activities: target.activities,
            weightTarget: target.weightTarget,
            weightOutput: target.weightOutput,
            weightOutcome: target.weightOutcome,
            y1Target: target.y1?.target ?? null,
            y1Initiatives: target.y1?.initiatives ?? null,
            y1Kra: target.y1?.kra ?? null,
            y2Target: target.y2?.target ?? null,
            y2Initiatives: target.y2?.initiatives ?? null,
            y2Kra: target.y2?.kra ?? null,
            progressPercent: 0,
            scoreManual: null,
            status: 'not_started',
            assignedUserIds: [],
            updatedAt: new Date().toISOString(),
            updatedBy: null,
          },
          permissions
        );

        // Migrate the spreadsheet's Year 1 / Year 2 actual scores into yearly_records
        // so they show up in the in-app yearly tracker and analysis-by-year charts.
        const yearSources = [
          { year: 1, label: fiscalYearLabel(1), data: target.y1 },
          { year: 2, label: fiscalYearLabel(2), data: target.y2 },
        ];
        for (const ys of yearSources) {
          const hasData =
            ys.data && (ys.data.target != null || ys.data.initiatives != null || ys.data.kra != null);
          if (!hasData) continue;
          await upsert(
            'yearly_records',
            `${target.id}-Y${ys.year}`,
            {
              targetId: target.id,
              year: ys.year,
              label: ys.label,
              targetScore: ys.data.target ?? null,
              initiativesScore: ys.data.initiatives ?? null,
              kraScore: ys.data.kra ?? null,
              progressPercent: null,
              status: null,
              note: 'Imported from the strategic plan matrix.',
              recordedBy: null,
              recordedByName: 'Strategic Plan (imported)',
              recordedAt: new Date().toISOString(),
            },
            permissions
          );
        }
      }
    }
  }

  console.log(`\nDone. Seeded ${seed.sections.length} sections, ${seed.results.length} results, ${outputCount} outputs, ${targetCount} targets.`);
  console.log('Next: create your first admin user by signing up in the app, then promote it.');
  console.log('You can promote yourself with:');
  console.log('  node --env-file=.env.local scripts/make-admin.mjs you@example.com');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
