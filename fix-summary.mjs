import fs from 'fs';
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const summaryFn = `
function SummaryTile({ label, value, color, bg }: { label: string; value: string; color?: string; bg?: string }) {
  return (
    <div className="bg-white px-4 py-3" style={{ borderRadius: '8px', border: '1px solid #D0D8DA', backgroundColor: bg ?? '#FFFFFF' }}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/50">{label}</p>
      <p className="mt-0.5 font-display text-2xl" style={color ? { color } : { color: '#16322A' }}>{value}</p>
    </div>
  );
}`;

// Remove existing SummaryTile at the end
content = content.replace(summaryFn, '');

// Add it right before DashboardPageInner
content = content.replace(
  'function DashboardPageInner()',
  summaryFn + '\n\nfunction DashboardPageInner()'
);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Done');
