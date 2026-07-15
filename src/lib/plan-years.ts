export const PLAN_START_YEAR = 2023;

export function fiscalYearLabel(yearNumber: number): string {
  const startYear = PLAN_START_YEAR + yearNumber - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endYearShort}`;
}
