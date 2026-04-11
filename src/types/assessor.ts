/**
 * Tipos compartilhados de Assessor e KPI keys.
 *
 * Esse arquivo nasceu na Fase 7 pra ser o novo home do `type Assessor` que
 * originalmente vivia em `src/data/mockData.ts`. Quando mockData.ts foi deletado
 * (final da Fase 7), os 11 componentes que importavam `type Assessor` daqui
 * passaram a importar deste arquivo.
 *
 * Shape "legacy" porque vários componentes (Leaderboard, DayView, KpiAnalytics,
 * etc.) ainda esperam `assessor.kpis.leads` em vez de `assessor.kpiTotals.leads`
 * ou equivalente. O hook `useAssessors` compõe o backend com essa shape legacy
 * pra minimizar refactors em cascata.
 */

export interface Assessor {
  id: string;
  name: string;
  /** Iniciais (backend chama `initials`, mas o shape legacy usa `avatar`). */
  avatar: string;
  /** URL da foto (relativa, ex: `/uploads/assessors/xxx.jpg`). Null se não tiver. */
  photoUrl: string | null;
  points: number;
  level: "bronze" | "silver" | "gold";
  streak: number;
  weeklyGoalPercent: number;
  kpis: {
    leads: number;
    cadencia: number;
    ligacoes: number;
    reunioes: number;
    indicacoes: number;
    boletos: number;
  };
  /** 5 booleans pra segunda..sexta (heatmap). */
  dailyActivity: boolean[];
}

export type KpiKey = keyof Assessor["kpis"];
