import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type TournamentScope = "INDIVIDUAL" | "SQUAD";
export type TournamentStatus = "ACTIVE" | "FINISHED" | "CANCELED";

export interface ApiTournamentParticipant {
  id: string;
  squadId: string | null;
  assessorId: string | null;
  displayName: string;
  finalScore: number | null;
  rank: number | null;
  photoUrl: string | null;
  initials: string | null;
}

export interface ApiTournament {
  id: string;
  roundLabel: string;
  scope: TournamentScope;
  goalKpiKey: string;
  goalTargetValue: number | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  maxWinners: number;
  progressivePayoutJson: Record<string, number> | null;
  totalPrizePool: number;
  createdAt: string;
  finishedAt: string | null;
  participants: ApiTournamentParticipant[];
}

export interface CreateTournamentInput {
  roundLabel: string;
  scope: TournamentScope;
  goalKpiKey: string;
  goalTargetValue?: number;
  startDate: string;
  endDate: string;
  maxWinners: number;
  progressivePayoutJson: Record<string, number>;
  participantIds?: string[];
}

const QUERY_KEY = ["tournaments"] as const;

export function useTournaments(status?: TournamentStatus) {
  return useQuery({
    queryKey: [...QUERY_KEY, status ?? "all"],
    queryFn: () => {
      const qs = status ? `?status=${status}` : "";
      return apiFetch<ApiTournament[]>(`/tournaments${qs}`);
    },
    staleTime: 15_000,
    // Refetch periódico mesmo sem SSE pra manter o countdown / leaderboard
    // atualizados em modo TV. SSE invalidation ainda cobre updates imediatos.
    refetchInterval: 30_000,
  });
}

export function useActiveTournaments() {
  return useTournaments("ACTIVE");
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTournamentInput) =>
      apiFetch<ApiTournament>("/tournaments", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useFinishTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiTournament>(`/tournaments/${id}/finish`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["cofre"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

export function useCancelTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiTournament>(`/tournaments/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Hard delete: apaga torneio + participantes (cascade no backend).
 * Backend retorna 409 em FINISHED — UI deve esconder o botão nesse status.
 */
export function useDeleteTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/tournaments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
