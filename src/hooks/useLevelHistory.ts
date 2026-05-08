import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { LevelSlug } from "@/lib/levelMeta";

export interface LevelHistoryEntry {
  id: string;
  level: LevelSlug;
  previousLevel: LevelSlug | null;
  /** Pontos rolling 4 semanas no momento da mudança (snapshot). */
  points: number;
  achievedAt: string; // ISO
}

const QUERY_KEY = ["level-history"] as const;

export function useLevelHistory(assessorId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, assessorId ?? ""],
    queryFn: () =>
      apiFetch<LevelHistoryEntry[]>(`/assessors/${assessorId}/level-history`),
    enabled: !!assessorId,
    staleTime: 60_000,
  });
}
