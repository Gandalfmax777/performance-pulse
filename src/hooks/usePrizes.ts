import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiPrize {
  id: string;
  assessorId: string;
  assessorName: string;
  title: string;
  description: string | null;
  period: string;
  awardedById: string;
  awardedByName: string;
  createdAt: string;
}

export interface CreatePrizeInput {
  assessorId: string;
  title: string;
  description?: string | null;
  period: string;
}

const QUERY_KEY = ["prizes"] as const;

export function usePrizes(filters: { assessorId?: string; period?: string } = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.assessorId) params.set("assessorId", filters.assessorId);
      if (filters.period) params.set("period", filters.period);
      const qs = params.toString();
      return apiFetch<ApiPrize[]>(`/prizes${qs ? `?${qs}` : ""}`);
    },
    staleTime: 30_000,
  });
}

export function useCreatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePrizeInput) =>
      apiFetch<ApiPrize>("/prizes", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeletePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/prizes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
