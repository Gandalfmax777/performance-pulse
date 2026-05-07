/**
 * Metadados dos KPIs (labels, targets, unidades).
 *
 * Este é o único lugar onde `KPI_META` deve ser declarado no frontend.
 * Antes estava duplicado em KpiAnalytics.tsx, AssessorProfile.tsx e DayView.tsx.
 *
 * NOTA: Os `target` aqui são fallback locais. A partir da Fase 3, os targets
 * reais vêm do backend via `useGoals()` (tabela Goal no Postgres). Este arquivo
 * continua sendo a fonte dos labels e units.
 */

export const KPI_META = {
  leads: { label: "Leads", target: 10, unit: "" },
  cadencia: { label: "Cadência", target: 70, unit: "%" },
  ligacoes: { label: "Ligações", target: 30, unit: "" },
  reunioes: { label: "Reuniões Ag.", target: 3, unit: "" },
  indicacoes: { label: "Indicações", target: 5, unit: "" },
} as const;

export type KpiKey = keyof typeof KPI_META;
