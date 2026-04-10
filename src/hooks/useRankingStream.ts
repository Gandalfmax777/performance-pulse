import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/api/client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

/**
 * Hook que conecta via EventSource ao SSE /api/stream/rankings.
 *
 * Quando recebe evento "ranking:update", invalida as queries de ranking
 * no React Query, causando refetch imediato do useDailyRanking/useWeeklyRanking.
 *
 * EventSource reconecta automaticamente em caso de perda de conexão.
 * O token é passado via query param (EventSource não suporta headers custom).
 */
export function useRankingStream(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    if (!token) return;

    // EventSource não suporta Authorization header, então passamos via query param.
    // O backend aceita tanto header quanto query param (via um middleware opcional).
    // Alternativa: usar fetch + ReadableStream, mas perde o auto-reconnect.
    // Pra Fase 10 MVP: usar URL polyfill com token no query.
    const url = `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`;

    const source = new EventSource(url);
    sourceRef.current = source;

    source.addEventListener("ranking:update", () => {
      // Invalida rankings → useDailyRanking/useWeeklyRanking refetch
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      // Também invalida assessors (que compõem com weekly ranking)
      queryClient.invalidateQueries({ queryKey: ["assessors"] });
    });

    source.addEventListener("connected", () => {
      console.log("[SSE] Connected to ranking stream");
    });

    source.onerror = () => {
      // EventSource reconecta automaticamente em ~3s
      console.log("[SSE] Connection lost, will auto-reconnect");
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [enabled, queryClient]);
}
