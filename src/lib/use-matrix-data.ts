'use client';

import { useCallback, useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import type { ResultDoc, OutputDoc, TargetDoc, Section, YearlyRecordDoc } from '@/types';

export interface MatrixTree {
  results: ResultDoc[];
  outputs: OutputDoc[];
  targets: TargetDoc[];
  sections: Section[];
  yearlyRecords: YearlyRecordDoc[];
}

export function useMatrixData() {
  const [data, setData] = useState<MatrixTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultsRes, outputsRes, targetsRes, sectionsRes, yearlyRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.RESULTS, [Query.orderAsc('order'), Query.limit(50)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTPUTS, [Query.orderAsc('order'), Query.limit(200)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.TARGETS, [Query.limit(500)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.SECTIONS, [Query.orderAsc('name'), Query.limit(200)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.YEARLY_RECORDS, [Query.orderAsc('year'), Query.limit(500)]),
      ]);
      setData({
        results: resultsRes.documents as unknown as ResultDoc[],
        outputs: outputsRes.documents as unknown as OutputDoc[],
        targets: targetsRes.documents as unknown as TargetDoc[],
        sections: sectionsRes.documents as unknown as Section[],
        yearlyRecords: yearlyRes.documents as unknown as YearlyRecordDoc[],
      });
    } catch (err: any) {
      setError(err?.message ?? 'Could not load the matrix.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function targetsForResult(data: MatrixTree, resultId: string) {
  const outputIds = new Set(data.outputs.filter((o) => o.resultId === resultId).map((o) => o.$id));
  return data.targets.filter((t) => outputIds.has(t.outputId));
}

export function targetsForSection(data: MatrixTree, sectionSlug: string) {
  return data.targets.filter((t) => t.sectionSlug === sectionSlug);
}
