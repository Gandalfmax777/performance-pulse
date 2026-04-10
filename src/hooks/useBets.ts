import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type BetWinnerCriteria =
  | { kind: "avgKpi"; kpiKey: string }
  | { kind: "totalPoints" }
  | { kind: "sumKpi"; kpiKey: string };

export interface ApiBetParticipant {
  squadId: string;
  finalScore: number | null;
  squadName: string;
  squadEmoji: string;
}

export interface ApiBet {
  id: string;
  roundLabel: string;
  type: "WEEKLY" | "MONTHLY" | "CUSTOM";
  value: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "FINISHED" | "CANCELED";
  winnerSquadId: string | null;
  winnerSquad: { id: string; name: string; emoji: string } | null;
  winnerCriteriaJson: BetWinnerCriteria;
  createdById: string;
  createdAt: string;
  finishedAt: string | null;
  participants: ApiBetParticipant[];
}

export interface CreateBetInput {
  roundLabel: string;
  type: "WEEKLY" | "MONTHLY" | "CUSTOM";
  value: number;
  startDate?: string;
  endDate?: string;
  winnerCriteriaJson: BetWinnerCriteria;
  squadIds?: string[];
}

const QUERY_KEY = ["bets"] as const;

export function useBets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiFetch<ApiBet[]>("/bets"),
    staleTime: 20_000,
  });
}

export function useCreateBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBetInput) =>
      apiFetch<ApiBet>("/bets", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useFinishBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiBet>(`/bets/${id}/finish`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["cofre"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useCancelBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiBet>(`/bets/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
