/**
 * Metadata dos 13 níveis possíveis (3 legacy + 10 novos da P3).
 *
 * Backend retorna `assessor.level` com qualquer um desses valores. Frontend
 * usa este map pra exibir label, cor e categoria. Mantém centralizado pra
 * que adicionar/renomear níveis seja um único arquivo.
 *
 * Os 3 legacy (BRONZE/SILVER/GOLD) seguem aqui pra compat até P3 popular
 * todos os assessores nos 10 novos via cron.
 */

export type LevelSlug =
  // Legacy
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  // Positivos P3
  | "EM_FORMACAO"
  | "EM_TRACAO"
  | "ALTA_PERFORMANCE"
  | "PROFETA_DO_FORCASH"
  | "MONSTRO_SAGRADO"
  // Negativos P3
  | "PONTO_DE_ATENCAO"
  | "RITMO_ABAIXO"
  | "PIPELINE_EM_RISCO"
  | "INIMIGO_DA_META"
  | "PROCURADOR_DE_EMPREGO";

export type LevelType = "legacy" | "positive" | "negative";

export interface LevelMeta {
  label: string;
  type: LevelType;
  /** Tom da cor de fundo (Tailwind class) — fundo do badge. */
  bgClass: string;
  /** Tom da cor do texto (Tailwind class). */
  textClass: string;
  /** Tom da borda (Tailwind class). */
  borderClass: string;
  /** Posição na escala (1 = mais baixo, 10 = mais alto). Pra ordenar timelines. */
  rank: number;
}

export const LEVEL_META: Record<LevelSlug, LevelMeta> = {
  // Legacy — usa cor neutra (vão sumir após cron popular os novos)
  BRONZE: { label: "Bronze",  type: "legacy", bgClass: "bg-bronze/15", textClass: "text-bronze",  borderClass: "border-bronze/40",  rank: 5 },
  SILVER: { label: "Silver",  type: "legacy", bgClass: "bg-silver/15", textClass: "text-silver",  borderClass: "border-silver/40",  rank: 7 },
  GOLD:   { label: "Gold",    type: "legacy", bgClass: "bg-gold/15",   textClass: "text-gold-deep", borderClass: "border-gold/40",  rank: 9 },

  // Positivos
  EM_FORMACAO:        { label: "Em Formação",         type: "positive", bgClass: "bg-ink-3/10",      textClass: "text-ink-2",       borderClass: "border-ink-3/30",      rank: 6 },
  EM_TRACAO:          { label: "Em Tração",           type: "positive", bgClass: "bg-blue-500/15",   textClass: "text-blue-600",    borderClass: "border-blue-500/40",   rank: 7 },
  ALTA_PERFORMANCE:   { label: "Alta Performance",    type: "positive", bgClass: "bg-eqi/15",        textClass: "text-eqi",         borderClass: "border-eqi/40",        rank: 8 },
  PROFETA_DO_FORCASH: { label: "Profeta do Forcash",  type: "positive", bgClass: "bg-purple-500/15", textClass: "text-purple-700",  borderClass: "border-purple-500/40", rank: 9 },
  MONSTRO_SAGRADO:    { label: "Monstro Sagrado",     type: "positive", bgClass: "bg-gold/20",       textClass: "text-gold-deep",   borderClass: "border-gold/50",       rank: 10 },

  // Negativos
  PONTO_DE_ATENCAO:      { label: "Ponto de Atenção",     type: "negative", bgClass: "bg-amber-100",    textClass: "text-amber-800",    borderClass: "border-amber-300",    rank: 5 },
  RITMO_ABAIXO:          { label: "Ritmo Abaixo",         type: "negative", bgClass: "bg-orange-100",   textClass: "text-orange-800",   borderClass: "border-orange-300",   rank: 4 },
  PIPELINE_EM_RISCO:     { label: "Pipeline em Risco",    type: "negative", bgClass: "bg-red-100",      textClass: "text-red-800",      borderClass: "border-red-300",      rank: 3 },
  INIMIGO_DA_META:       { label: "Inimigo da Meta",      type: "negative", bgClass: "bg-red-200",      textClass: "text-red-900",      borderClass: "border-red-400",      rank: 2 },
  PROCURADOR_DE_EMPREGO: { label: "Procurador de Emprego", type: "negative", bgClass: "bg-destructive/20", textClass: "text-destructive", borderClass: "border-destructive/40", rank: 1 },
};

/**
 * Mapeia qualquer um dos 13 níveis pros 3 legacy (compat com componentes
 * antigos como AssessorAvatar). Mesma lógica do backend (assessors.ts).
 */
export function toLegacyLevel(level: LevelSlug): "BRONZE" | "SILVER" | "GOLD" {
  if (level === "BRONZE" || level === "SILVER" || level === "GOLD") return level;
  if (level === "MONSTRO_SAGRADO") return "GOLD";
  if (level === "PROFETA_DO_FORCASH" || level === "ALTA_PERFORMANCE") return "SILVER";
  return "BRONZE";
}

export function getLevelMeta(level: LevelSlug | string): LevelMeta {
  return LEVEL_META[level as LevelSlug] ?? LEVEL_META.BRONZE;
}
