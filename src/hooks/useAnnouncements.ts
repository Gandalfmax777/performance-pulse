import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiAnnouncement {
  id: string;
  message: string;
  emoji: string | null;
  active: boolean;
  expiresAt: string | null;
  sortOrder: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAnnouncementInput {
  message: string;
  emoji?: string | null;
  active?: boolean;
  expiresAt?: string | null;
  sortOrder?: number;
}

const QUERY_KEY = ["announcements"] as const;

/** Lista avisos ativos (default) ou todos se includeInactive=true. */
export function useAnnouncements(includeInactive = false) {
  return useQuery({
    queryKey: [...QUERY_KEY, includeInactive ? "all" : "active"],
    queryFn: () =>
      apiFetch<ApiAnnouncement[]>(
        `/announcements${includeInactive ? "?includeInactive=true" : ""}`,
      ),
    staleTime: 30_000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertAnnouncementInput) =>
      apiFetch<ApiAnnouncement>("/announcements", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; input: UpsertAnnouncementInput }) =>
      apiFetch<ApiAnnouncement>(`/announcements/${params.id}`, {
        method: "PATCH",
        body: params.input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
