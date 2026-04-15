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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    if (!token) return;

    // EventSource não suporta Authorization header, então passamos via query param.
    const url = `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`;

    const source = new EventSource(url);
    sourceRef.current = source;

    // Debounce 300ms: múltiplos POSTs em sequência (Felipe digitando métricas rápido)
    // disparam várias invalidações que compõem com refetchIntervals dos hooks de
    // ranking. Um único refetch por rajada é suficiente.
    source.addEventListener("ranking:update", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["rankings"] });
        debounceRef.current = null;
      }, 300);
    });

    source.addEventListener("connected", () => {
      console.log("[SSE] Connected to ranking stream");
    });

    source.onerror = () => {
      console.log("[SSE] Connection lost, will auto-reconnect");
    };

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      source.close();
      sourceRef.current = null;
    };
  }, [enabled, queryClient]);
}
