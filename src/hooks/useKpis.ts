import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/api/client";

/**
 * Shape vindo do backend (espelha o serializer de routes/kpis.ts).
 */
export interface ApiKpi {
  id: string;
  key: string;
  label: string;
  unit: string;
  inputMode: "ABSOLUTE" | "PERCENT" | "QUANTITY_OVER_BASE";
  baseSource: string | null;
  defaultTarget: number;
  isDerived: boolean;
  derivedFormula: string | null;
  sortOrder: number;
  active: boolean;
  activeGoal: {
    id: string;
    value: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    validFrom: string;
    validTo: string | null;
  } | null;
  scoringRule: {
    ruleType: "LINEAR" | "THRESHOLD_PERCENT";
    divisor: number | null;
    pointsPerBucket: number | null;
    thresholdPct: number | null;
    thresholdPoints: number | null;
    active: boolean;
  } | null;
  /**
   * Som customizado (22/04). Admin sobe via UI no AdminGoals; backend serve
   * a URL pública do R2. Se `null` — KPI silencioso (sem som).
   * `broadcast=true` faz o backend emitir SSE pra tocar em todos clientes.
   */
  sound: {
    url: string;
    enabled: boolean;
    broadcast: boolean;
  } | null;
}

/**
 * Shape simplificado pros componentes da Overview — label, target efetivo, unit.
 * O target efetivo é a goal ativa (se houver) senão o defaultTarget.
 */
export interface KpiSummary {
  id: string;
  key: string;
  label: string;
  target: number;
  unit: string;
  inputMode: "ABSOLUTE" | "PERCENT" | "QUANTITY_OVER_BASE";
}

const QUERY_KEY = ["kpis"] as const;

interface UseKpisResult {
  kpis: KpiSummary[];
  isLoading: boolean;
}

export function useKpis(): UseKpisResult {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiKpi[]>("/kpis?active=true"),
    staleTime: 60_000,
  });

  const kpis: KpiSummary[] = (query.data ?? [])
    .filter((k) => !k.isDerived)
    .map((k) => ({
      id: k.id,
      key: k.key,
      label: k.label,
      target: k.activeGoal?.value ?? k.defaultTarget,
      unit: k.unit,
      inputMode: k.inputMode,
    }));

  return { kpis, isLoading: query.isLoading };
}

// ─── Mutations: KPI sound (upload / toggle / delete) ────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

/**
 * Upload de arquivo MP3/WAV pro KPI. Usa fetch direto (não apiFetch) pra
 * enviar FormData — padrão idêntico ao `AssessorManager.tsx` pra foto.
 * Invalida lista de KPIs pro response atualizado com `sound`.
 */
export function useUploadKpiSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kpiId, file }: { kpiId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/kpis/${kpiId}/sound`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Falha no upload" }));
        throw new Error(err.error ?? "Falha no upload");
      }
      return (await res.json()) as ApiKpi;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateKpiSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kpiId,
      ...body
    }: {
      kpiId: string;
      enabled?: boolean;
      broadcast?: boolean;
    }) =>
      apiFetch<ApiKpi>(`/kpis/${kpiId}/sound`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteKpiSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kpiId: string) =>
      apiFetch<ApiKpi>(`/kpis/${kpiId}/sound`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
