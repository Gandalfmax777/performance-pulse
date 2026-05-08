import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface BonusType {
  id: string;
  slug: string;
  label: string;
  notePrefix: string;
  points: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBonusTypeInput {
  slug: string;
  label: string;
  notePrefix: string;
  points: number;
  active?: boolean;
}

export type UpdateBonusTypeInput = Partial<Omit<CreateBonusTypeInput, "slug">>;

const QUERY_KEY = ["bonus-types"] as const;

export function useBonusTypes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<BonusType[]>("/bonus-types"),
    staleTime: 60_000,
  });
}

export function useCreateBonusType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBonusTypeInput) =>
      apiFetch<BonusType>("/bonus-types", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateBonusType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; input: UpdateBonusTypeInput }) =>
      apiFetch<BonusType>(`/bonus-types/${params.id}`, {
        method: "PATCH",
        body: params.input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteBonusType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/bonus-types/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
