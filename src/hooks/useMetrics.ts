import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { playGoalHitSound } from "@/lib/sounds";
import type { ApiKpi } from "./useKpis";

/**
 * Shape vindo do backend (espelha routes/metrics.ts).
 */
export interface ApiMetric {
  id: string;
  assessorId: string;
  kpiId: string;
  kpiKey: string;
  activityId: string | null;
  date: string; // YYYY-MM-DD
  rawValue: number;
  baseValue: number | null;
  convertedPercent: number | null;
  pointsAwarded: number | null;
  enteredById: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMetricInput {
  assessorId: string;
  kpiKey: string;
  date?: string;
  rawValue: number;
  baseValue?: number;
  notes?: string;
}

const QUERY_KEY = ["metrics"] as const;

/**
 * Lista metric entries com filtros opcionais. Usado por componentes que querem
 * o histórico bruto (não o ranking agregado — pra isso use useDailyRanking).
 */
export function useMetrics(filters: {
  assessorId?: string;
  kpiKey?: string;
  from?: string;
  to?: string;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      return apiFetch<ApiMetric[]>(`/metrics${qs ? `?${qs}` : ""}`);
    },
    staleTime: 5_000,
  });
}

/**
 * Variante de input com contexto sonoro: caller passa `prevPercent` (% antes
 * do upsert) pra que o hook possa disparar o som de "vitória" ao cruzar 100%.
 *
 * Mantemos compat com chamadas antigas que passam só `UpsertMetricInput`:
 * detectamos via duck-typing se o payload tem `assessorId` direto (input antigo)
 * ou está dentro de `input` (novo formato com prevPercent).
 */
export type UpsertMetricArgs =
  | UpsertMetricInput
  | { input: UpsertMetricInput; prevPercent: number };

function normalizeArgs(args: UpsertMetricArgs): {
  input: UpsertMetricInput;
  prevPercent: number;
} {
  if ("input" in args && typeof args.input === "object") {
    return { input: args.input, prevPercent: args.prevPercent };
  }
  return { input: args as UpsertMetricInput, prevPercent: 0 };
}

/**
 * Upsert de uma metric entry. Invalida lista de metrics + rankings.
 *
 * Side effect sonoro (gamificação):
 * - Som por KPI (ex: ativação): backend emite evento SSE `sound:play` pra
 *   TODOS clientes conectados (laptop + TV + abas extras) com soundUrl do
 *   KpiSound. Hook useRankingStream escuta e chama playSoundUrl. Não
 *   tocamos aqui pra evitar double-play e pra unificar o flow pelo backend.
 * - Meta batida (100%): toca localmente só no client que registrou, pois
 *   depende do prevPercent (detecção de cruzamento 100%) que é caro
 *   reproduzir no backend.
 *
 * Caller pode passar só `UpsertMetricInput` (sem som de vitória) OU
 * `{ input, prevPercent }` (com detecção de meta batida).
 */
export function useUpsertMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: UpsertMetricArgs) => {
      const { input } = normalizeArgs(args);
      return apiFetch<ApiMetric>("/metrics", { method: "POST", body: input });
    },
    onSuccess: (data, args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      queryClient.invalidateQueries({ queryKey: ["assessors"] });

      // Som de meta batida (100%) local — depende de prevPercent.
      // MAS: se o KPI tem som configurado com broadcast, o SSE já vai tocar
      // o MP3 do KpiSound. Tocar goalHit junto = 2 sons sobrepostos (bug
      // reportado 22/04: Cash Money do ativacao_conta + fanfarra synth pq
      // meta=1 e cada ativação cruza 100%). Regra: se KPI vai tocar MP3
      // via broadcast, suprime goalHit — o MP3 já é celebração suficiente.
      const apiKpis = queryClient.getQueryData<ApiKpi[]>(["kpis"]);
      const kpiConfig = apiKpis?.find((k) => k.key === data.kpiKey);
      const willBroadcastSound =
        kpiConfig?.sound?.enabled === true && kpiConfig.sound.broadcast === true;

      const { prevPercent } = normalizeArgs(args);
      const newPct = data.convertedPercent ?? 0;
      if (!willBroadcastSound && prevPercent < 100 && newPct >= 100) {
        playGoalHitSound();
      }
    },
  });
}
