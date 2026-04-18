import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiDailyDirection {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

const queryKey = (date: string) => ["direction", date] as const;

/** Busca o direcionamento da data. Retorna null se não houver (204 do backend). */
export function useDailyDirection(date: string) {
  return useQuery({
    queryKey: queryKey(date),
    queryFn: () =>
      apiFetch<ApiDailyDirection | null>(`/directions/${date}`),
    staleTime: 30_000,
    retry: false,
  });
}

/** Salva (upsert) o direcionamento. Texto vazio = remove. */
export function useUpsertDailyDirection(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<ApiDailyDirection | null>(`/directions/${date}`, {
        method: "PUT",
        body: { text },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey(date), data);
    },
  });
}
