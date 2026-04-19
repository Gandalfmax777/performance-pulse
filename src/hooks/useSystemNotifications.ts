import { useEffect } from "react";
import { toast } from "sonner";
import { getAuthToken } from "@/api/client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

interface GoalHitPayload {
  assessorName: string;
  assessorInitials: string;
  photoUrl: string | null;
  kpiLabel: string;
  kpiKey: string;
  percent: number;
}

/**
 * Ouve SSE e dispara toasts contextuais quando eventos disparam.
 *
 * V1 escuta só `goal:hit` — assessor cruzou 100% de uma meta de KPI.
 * Evento `tournament:finished` tem overlay dedicado (não duplicar como toast).
 *
 * Montar em pontos onde o user pode ter visibilidade contínua:
 * - Dashboard (`/`) — admin trabalhando no sistema
 * - TV (`/tv`) — sala de vendas
 *
 * Mas evita duplicar: se já tem useRankingStream + useTournamentFinishedStream
 * criando EventSources, este abre ainda outra conexão. Mínimo overhead (SSE
 * backend suporta 100 clients).
 */
export function useSystemNotifications(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    const url = token
      ? `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`
      : `${API_URL}/stream/rankings`;

    const source = new EventSource(url);

    source.addEventListener("goal:hit", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as GoalHitPayload;
        toast.success(`🎯 ${payload.assessorName} bateu meta!`, {
          description: `${payload.kpiLabel} · ${payload.percent}% da meta`,
          duration: 6000,
        });
      } catch {
        // fail-soft
      }
    });

    source.onerror = () => {
      // EventSource faz auto-reconnect
    };

    return () => {
      source.close();
    };
  }, [enabled]);
}
