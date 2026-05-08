import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiBaseUrl, getAuthToken } from "@/api/client";

export interface ApiSquadMember {
  assessorId: string;
  name: string;
  initials: string;
  photoUrl: string | null;
  level: "BRONZE" | "SILVER" | "GOLD";
  isLeader: boolean;
  joinedAt: string;
}

export interface ApiSquad {
  id: string;
  name: string;
  /** URL pública da logo no R2 (com cache-buster `?v=`). Null = squad sem logo cadastrada. */
  logoUrl: string | null;
  color: string;
  leaderId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  members: ApiSquadMember[];
}

export interface CreateSquadInput {
  name: string;
  color: string;
  leaderId: string;
  memberIds: string[];
}

const QUERY_KEY = ["squads"] as const;

export function useSquads() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiSquad[]>("/squads?active=true"),
    staleTime: 30_000,
  });
}

export function useCreateSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSquadInput) =>
      apiFetch<ApiSquad>("/squads", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteSquad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiSquad>(`/squads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Upload de logo do squad. Espelha useUploadKpiSound — fetch direto com
 * FormData (apiFetch não suporta multipart). Espera Blob já redimensionado
 * via lib/imageResize antes de chamar.
 */
export function useUploadSquadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ squadId, blob }: { squadId: string; blob: Blob }) => {
      const formData = new FormData();
      formData.append("file", blob, "logo.jpg");
      const token = getAuthToken();
      const res = await fetch(`${apiBaseUrl}/squads/${squadId}/logo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Falha no upload" }));
        throw new Error(err.error ?? "Falha no upload");
      }
      return (await res.json()) as ApiSquad;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
