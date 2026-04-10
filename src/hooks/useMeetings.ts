import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export type MeetingOutcome = "SCHEDULED" | "NO_SHOW" | "DONE" | "CLOSED_WON" | "CLOSED_LOST";

export interface ApiMeeting {
  id: string;
  assessorId: string;
  assessorName: string;
  scheduledDate: string;
  scheduledMetricEntryId: string | null;
  outcome: MeetingOutcome;
  closedAt: string | null;
  ticketValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingInput {
  assessorId: string;
  scheduledDate: string;
  scheduledMetricEntryId?: string;
  outcome?: MeetingOutcome;
  ticketValue?: number;
  notes?: string;
}

export interface UpdateMeetingInput {
  scheduledDate?: string;
  outcome?: MeetingOutcome;
  closedAt?: string | null;
  ticketValue?: number | null;
  notes?: string | null;
}

const QUERY_KEY = ["meetings"] as const;

export function useMeetings(filters: {
  assessorId?: string;
  from?: string;
  to?: string;
  outcome?: MeetingOutcome;
} = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v) usp.set(k, v);
      }
      const qs = usp.toString();
      return apiFetch<ApiMeeting[]>(`/meetings${qs ? `?${qs}` : ""}`);
    },
    staleTime: 30_000,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) =>
      apiFetch<ApiMeeting>("/meetings", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports", "funnel"] });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMeetingInput }) =>
      apiFetch<ApiMeeting>(`/meetings/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["reports", "funnel"] });
    },
  });
}
