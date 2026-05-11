import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type BusinessDay =
  | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type TieBreakKey = "points" | "weeklyGoalPercent" | "streak" | "name";

export type LevelSlug =
  | "EM_FORMACAO"
  | "EM_TRACAO"
  | "ALTA_PERFORMANCE"
  | "PROFETA_DO_FORCASH"
  | "MONSTRO_SAGRADO"
  | "PONTO_DE_ATENCAO"
  | "RITMO_ABAIXO"
  | "PIPELINE_EM_RISCO"
  | "INIMIGO_DA_META"
  | "PROCURADOR_DE_EMPREGO";

export interface LevelThreshold {
  level: LevelSlug;
  /** Pode ser negativo. Lista ordenada do maior pro menor. */
  minPoints: number;
}

export type LegacyLevel = "BRONZE" | "SILVER" | "GOLD";

/**
 * Mapping de cada um dos 10 LevelSlug pro bucket legacy. Editado em
 * /admin/scoring. Determina a cor do ring no AssessorAvatar e o que
 * componentes que ainda esperam o enum legacy (BRONZE/SILVER/GOLD) recebem.
 */
export type LevelLegacyMap = Record<LevelSlug, LegacyLevel>;

export interface ScoringConfig {
  penaltyPointsPerIdleDay: number;
  penaltyConsecutiveIdleDays: number;
  penaltyBusinessDays: BusinessDay[];
  tieBreakOrder: TieBreakKey[];
  levelThresholds: LevelThreshold[];
  levelLegacyMap: LevelLegacyMap;
}

const QUERY_KEY = ["admin", "scoring-config"] as const;

export function useScoringConfig() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ScoringConfig>("/admin/scoring-config"),
    staleTime: 60_000,
  });
}

export function useUpdateScoringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ScoringConfig>) =>
      apiFetch<ScoringConfig>("/admin/scoring-config", {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data) => {
      // Atualização otimista: o response já é a config atualizada.
      queryClient.setQueryData(QUERY_KEY, data);
      // Invalida ranking pra refletir mudança (recompute roda em background no backend).
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}
