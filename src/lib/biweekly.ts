/**
 * Helper biweekly — port do `performance-pulse-backend/src/lib/biweekly.ts`.
 *
 * Usado no `AdminBiweekly` pra projetar quais quartas são Indique Day
 * sem chamar o backend pra cada uma (evita 8 requests pro mesmo cálculo).
 *
 * Lógica idêntica: WEEKLY sempre ativa; BIWEEKLY ativa quando diff de dias
 * desde a anchor for múltiplo de 14 e não-negativo.
 */

const MS_PER_DAY = 86_400_000;

export interface ActivityCadenceFields {
  cadenceType: "WEEKLY" | "BIWEEKLY";
  biweeklyAnchorDate: string | null; // YYYY-MM-DD
}

export function isActivityActiveOn(activity: ActivityCadenceFields, date: Date): boolean {
  if (activity.cadenceType === "WEEKLY") return true;
  if (!activity.biweeklyAnchorDate) return false;

  const [y, m, d] = activity.biweeklyAnchorDate.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));

  // Compara só a data civil UTC (zera horas)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  const diffDays = Math.round((target.getTime() - anchor.getTime()) / MS_PER_DAY);
  return diffDays >= 0 && diffDays % 14 === 0;
}
