import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { type Assessor } from "@/types/assessor";
import { useWeeklyRanking, type ApiRollup } from "./useRankings";

/**
 * Shape vindo do backend (espelha o serializer de routes/assessors.ts).
 */
export interface ApiAssessor {
  id: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  level: "BRONZE" | "SILVER" | "GOLD";
  active: boolean;
  hiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessorInput {
  name: string;
  initials?: string;
}

const QUERY_KEY = ["assessors"] as const;

/**
 * Mapeia rollup do backend pros 5 dias úteis (segunda→sexta) da semana corrente.
 * `activeDays` é uma lista de "YYYY-MM-DD"; aqui derivamos o dayOfWeek (1-5).
 */
function buildDailyActivityFlags(activeDays: string[]): boolean[] {
  const flags = [false, false, false, false, false];
  for (const dayStr of activeDays) {
    const d = new Date(`${dayStr}T00:00:00.000Z`);
    const dow = d.getUTCDay();
    if (dow >= 1 && dow <= 5) flags[dow - 1] = true;
  }
  return flags;
}

/**
 * Adapta o shape do backend pro shape legacy. Se houver `rollup` (vindo da
 * weeklyRanking), popula points/streak/weeklyGoalPercent/kpis/dailyActivity.
 * Senão, zera tudo (estado inicial).
 */
function toLegacyAssessor(a: ApiAssessor, rollup: ApiRollup | undefined): Assessor {
  const kpis = {
    leads: rollup?.kpiTotals.leads ?? 0,
    cadencia: rollup?.kpiTotals.cadencia ?? 0,
    ligacoes: rollup?.kpiTotals.ligacoes ?? 0,
    reunioes: rollup?.kpiTotals.reunioes ?? 0,
    indicacoes: rollup?.kpiTotals.indicacoes ?? 0,
    boletos: rollup?.kpiTotals.boletos ?? 0,
  };
  return {
    id: a.id,
    name: a.name,
    avatar: a.initials,
    photoUrl: a.photoUrl,
    points: rollup?.points ?? 0,
    level: a.level.toLowerCase() as Assessor["level"],
    streak: rollup?.streak ?? 0,
    weeklyGoalPercent: rollup?.weeklyGoalPercent ?? 0,
    kpis,
    dailyActivity: rollup
      ? buildDailyActivityFlags(rollup.activeDays)
      : [false, false, false, false, false],
  };
}

interface UseAssessorsResult {
  assessors: Assessor[];
  isLoading: boolean;
  addAssessor: (input: CreateAssessorInput) => void;
  removeAssessor: (id: string) => void;
}

export function useAssessors(): UseAssessorsResult {
  const queryClient = useQueryClient();

  const assessorsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiAssessor[]>("/assessors?active=true"),
    staleTime: 30_000,
  });

  const weeklyRanking = useWeeklyRanking();

  const createMutation = useMutation({
    mutationFn: (input: CreateAssessorInput) =>
      apiFetch<ApiAssessor>("/assessors", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiAssessor>(`/assessors/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });

  // Indexa o rollup por assessorId pra lookup O(1)
  const rollupMap = new Map<string, ApiRollup>();
  if (weeklyRanking.data) {
    for (const r of weeklyRanking.data.rankings) {
      rollupMap.set(r.assessor.id, r.rollup);
    }
  }

  return {
    assessors: (assessorsQuery.data ?? []).map((a) => toLegacyAssessor(a, rollupMap.get(a.id))),
    isLoading: assessorsQuery.isLoading,
    addAssessor: (input) => createMutation.mutate(input),
    removeAssessor: (id) => removeMutation.mutate(id),
  };
}
