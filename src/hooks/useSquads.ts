import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

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
  emoji: string;
  color: string;
  leaderId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  members: ApiSquadMember[];
}

export interface CreateSquadInput {
  name: string;
  emoji: string;
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
