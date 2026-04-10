import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiBadge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  scope: "INDIVIDUAL" | "SQUAD";
  active: boolean;
}

export interface ApiBadgeUnlock {
  id: string;
  badgeId: string;
  badgeSlug: string;
  badgeName: string;
  badgeIcon: string;
  badgeScope: "INDIVIDUAL" | "SQUAD";
  assessorId: string | null;
  squadId: string | null;
  periodKey: string;
  unlockedAt: string;
}

const QUERY_KEY = ["badges"] as const;

export function useBadges() {
  return useQuery({
    queryKey: [...QUERY_KEY, "definitions"],
    queryFn: () => apiFetch<ApiBadge[]>("/badges"),
    staleTime: 5 * 60_000,
  });
}

export function useBadgeUnlocks(filters: { assessorId?: string; squadId?: string; periodKey?: string } = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, "unlocks", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.assessorId) params.set("assessorId", filters.assessorId);
      if (filters.squadId) params.set("squadId", filters.squadId);
      if (filters.periodKey) params.set("periodKey", filters.periodKey);
      const qs = params.toString();
      return apiFetch<ApiBadgeUnlock[]>(`/badges/unlocks${qs ? `?${qs}` : ""}`);
    },
    staleTime: 15_000,
  });
}
