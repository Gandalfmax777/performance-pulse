import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type PenaltyStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";

export interface PenaltyProposal {
  id: string;
  assessorId: string;
  assessorName: string;
  assessorInitials: string;
  date: string; // YYYY-MM-DD
  pointsProposed: number;
  status: PenaltyStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  justification: string | null;
  ageDays: number;
  createdAt: string;
}

const QUERY_KEY = ["admin", "penalty-proposals"] as const;
const COUNT_KEY = ["admin", "penalty-proposals", "count"] as const;

export function usePenaltyProposals(status?: PenaltyStatus) {
  return useQuery({
    queryKey: [...QUERY_KEY, status ?? "all"],
    queryFn: () => {
      const qs = status ? `?status=${status}` : "";
      return apiFetch<PenaltyProposal[]>(`/admin/penalty-proposals${qs}`);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Contador PENDING — usado pelo badge no menu admin. */
export function usePenaltyProposalsCount() {
  return useQuery({
    queryKey: COUNT_KEY,
    queryFn: () => apiFetch<{ pending: number }>("/admin/penalty-proposals/count"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

interface ReviewInput {
  id: string;
  status: "APPROVED" | "REJECTED";
  justification?: string;
}

export function useReviewPenaltyProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, justification }: ReviewInput) =>
      apiFetch<PenaltyProposal>(`/admin/penalty-proposals/${id}`, {
        method: "PATCH",
        body: { status, justification },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COUNT_KEY });
      // Ranking pode mudar quando aprova
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

interface BulkReviewInput {
  ids: string[];
  status: "APPROVED" | "REJECTED";
  justification?: string;
}

export function useBulkReviewPenaltyProposals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkReviewInput) =>
      apiFetch<{ updated: number }>("/admin/penalty-proposals/bulk", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COUNT_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

/**
 * Edita campos da proposta sem mudar status. Caso típico: corrigir data
 * errada de uma penalidade que Felipe aprovou por engano, ou ajustar
 * pontos de uma justificativa por férias (08/05/2026).
 */
interface EditInput {
  id: string;
  date?: string; // YYYY-MM-DD
  pointsProposed?: number;
  justification?: string | null;
}

export function useEditPenaltyProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: EditInput) =>
      apiFetch<PenaltyProposal>(`/admin/penalty-proposals/${id}/edit`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COUNT_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}

/**
 * Hard-delete da proposta (qualquer status). Irreversível — UI deve
 * confirmar antes. Backend emite SSE só se a proposta era APPROVED/AUTO_APPROVED
 * (ranking precisa atualizar nesse caso).
 */
export function useDeletePenaltyProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/admin/penalty-proposals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COUNT_KEY });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
    },
  });
}
