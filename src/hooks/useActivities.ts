import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Shape vindo do backend (espelha routes/activities.ts).
 */
export interface ApiActivityKpi {
  kpiId: string;
  key: string;
  label: string;
  unit: string;
  /** Target resolvido: override > goal > default. Renderizar direto na UI. */
  target: number;
  /** Raw override (null = caiu pro goal/default). Pra UI admin Phase 8. */
  targetOverride: number | null;
}

export interface ApiActivity {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  cadenceType: "WEEKLY" | "BIWEEKLY";
  /** YYYY-MM-DD ou null */
  biweeklyAnchorDate: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  kpis: ApiActivityKpi[];
}

const QUERY_KEY = ["activities"] as const;

interface UseActivitiesResult {
  data: ApiActivity[];
  isLoading: boolean;
}

/**
 * Lista activities ativas em uma data específica (default: hoje BRT).
 * Backend resolve biweekly automaticamente.
 */
export function useActivities(date?: string): UseActivitiesResult {
  const query = useQuery({
    queryKey: [...QUERY_KEY, date ?? "today"],
    queryFn: () => {
      const qs = date ? `?date=${date}` : "";
      return apiFetch<ApiActivity[]>(`/activities${qs}`);
    },
    staleTime: 30_000,
  });

  return { data: query.data ?? [], isLoading: query.isLoading };
}
