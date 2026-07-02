/**
 * The NREP Strategic Plan runs 2023-2028 in Uganda fiscal years (July-June).
 * Year 1 = 2023/24, Year 2 = 2024/25, ... Year 5 = 2027/28.
 * Anything beyond Year 5 keeps extrapolating the same pattern.
 */
export const PLAN_START_YEAR = 2023;

export function fiscalYearLabel(yearNumber: number): string {
  const startYear = PLAN_START_YEAR + yearNumber - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endYearShort}`;
}
