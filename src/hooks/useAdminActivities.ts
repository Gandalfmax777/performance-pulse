import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { ApiActivity } from "@/hooks/useActivities";

export interface CreateActivityInput {
  name: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  cadenceType?: "WEEKLY" | "BIWEEKLY";
  biweeklyAnchorDate?: string | null;
  sortOrder?: number;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  active?: boolean;
}

const QUERY_KEY = ["activities"] as const;

/**
 * Lista TODAS as activities (inclusive inativas), sem filtro biweekly.
 * Só pra admin UI — usuários normais usam useActivities(date).
 */
export function useAllActivities() {
  return useQuery({
    queryKey: [...QUERY_KEY, "all"],
    queryFn: () => apiFetch<ApiActivity[]>("/activities/all"),
    staleTime: 30_000,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) =>
      apiFetch<ApiActivity>("/activities", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateActivityInput }) =>
      apiFetch<ApiActivity>(`/activities/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiActivity>(`/activities/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useAttachActivityKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      kpiId,
      targetOverride,
    }: {
      activityId: string;
      kpiId: string;
      targetOverride?: number | null;
    }) =>
      apiFetch<ApiActivity>(`/activities/${activityId}/kpis`, {
        method: "POST",
        body: { kpiId, targetOverride },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateActivityKpiOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      kpiId,
      targetOverride,
    }: {
      activityId: string;
      kpiId: string;
      targetOverride: number | null;
    }) =>
      apiFetch<ApiActivity>(`/activities/${activityId}/kpis/${kpiId}`, {
        method: "PATCH",
        body: { targetOverride },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDetachActivityKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, kpiId }: { activityId: string; kpiId: string }) =>
      apiFetch<null>(`/activities/${activityId}/kpis/${kpiId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
