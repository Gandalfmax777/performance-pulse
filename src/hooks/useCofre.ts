import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ApiCofreBySquad {
  squadId: string;
  squadName: string;
  squadLogoUrl: string | null;
  totalWon: number;
  winCount: number;
}

export interface ApiCofreBalance {
  totalDeposits: number;
  totalPayouts: number;
  totalAdjustments: number;
  currentBalance: number;
  bySquad: ApiCofreBySquad[];
}

const QUERY_KEY = ["cofre"] as const;

export function useCofreBalance() {
  return useQuery({
    queryKey: [...QUERY_KEY, "balance"],
    queryFn: () => apiFetch<ApiCofreBalance>("/cofre/balance"),
    staleTime: 20_000,
  });
}
