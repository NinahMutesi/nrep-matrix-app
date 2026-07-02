import type { MatrixTree } from '@/lib/use-matrix-data';

export function exportMatrixCsv(data: MatrixTree, scopeLabel = 'all-results') {
  const headers = [
    'Result',
    'Output',
    'Target Code',
    'Target Description',
    'Lead Org / Section',
    'Timeline',
    'Progress %',
    'Status',
    'Updated At',
  ];

  const rows = data.targets.map((t) => {
    const output = data.outputs.find((o) => o.$id === t.outputId);
    const result = data.results.find((r) => r.$id === t.resultId);
    return [
      result ? `${result.code} - ${result.title}` : '',
      output ? `Output ${output.code} - ${output.title}` : '',
      t.code,
      t.description,
      t.leadOrg,
      t.timeline ?? '',
      String(t.progressPercent ?? 0),
      t.status,
      t.updatedAt ?? '',
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nrep-implementation-matrix-${scopeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
