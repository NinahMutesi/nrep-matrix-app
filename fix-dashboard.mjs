import fs from 'fs';
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Remove local AdminOverview function
const start = content.indexOf('\nfunction AdminOverview(');
const end = content.indexOf('\nfunction MySectionView(');
if(start !== -1 && end !== -1) {
  content = content.slice(0, start) + content.slice(end);
  console.log('Removed local AdminOverview');
}

// Add import if not present
if(!content.includes("from '@/app/dashboard/AdminOverview'")) {
  content = content.replace(
    "import type { ResultDoc, TargetDoc } from '@/types';",
    "import type { ResultDoc, TargetDoc } from '@/types';\nimport { AdminOverview } from '@/app/dashboard/AdminOverview';"
  );
  console.log('Import added');
}

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Done');
