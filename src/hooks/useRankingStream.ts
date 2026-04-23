import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/api/client";
import { playSoundUrl } from "@/lib/sounds";

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

    // SSE agora é público (sem auth). Se tiver token, ainda passa via query
    // param por compat com qualquer middleware legado; senão conecta anônimo.
    const token = getAuthToken();
    const url = token
      ? `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`
      : `${API_URL}/stream/rankings`;

    const source = new EventSource(url);
    sourceRef.current = source;

    // Debounce 300ms: múltiplos POSTs em sequência (Felipe digitando métricas
    // rápido) disparam várias invalidações. Um único refetch por rajada é
    // suficiente.
    //
    // Invalidação em CASCATA: quando uma métrica é registrada, TODAS as
    // queries abaixo ficam stale imediatamente. Antes só `rankings` era
    // invalidado e o resto do dashboard ficava até 30s desatualizado (bug
    // reportado por Felipe: "TV não tá 100% atualizada").
    //
    // As queries aqui listadas são TODAS as que mudam quando métrica muda:
    // - rankings: placar direto
    // - reports: overview (KpiCards, ActivationHighlight), activity-feed,
    //   assessor individual, funnel, kpi series
    // - assessors: points/level/streak/etc via toLegacyAssessor
    // - metrics: entries do dia (RegistrationPanel)
    // - badges: unlocks podem ter sido criados (evaluateBadgesForAssessor)
    // - tournaments: leaderboards de torneio ativo
    source.addEventListener("ranking:update", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["rankings"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        queryClient.invalidateQueries({ queryKey: ["assessors"] });
        queryClient.invalidateQueries({ queryKey: ["metrics"] });
        queryClient.invalidateQueries({ queryKey: ["badges"] });
        queryClient.invalidateQueries({ queryKey: ["tournaments"] });
        debounceRef.current = null;
      }, 300);
    });

    source.addEventListener("connected", () => {
      console.log("[SSE] Connected to ranking stream");
    });

    // Broadcast sonoro — toca som de KPI em TODOS clientes conectados (laptop
    // do Felipe, TV espelhando, qualquer outro dashboard aberto). Payload
    // carrega soundUrl vindo do KpiSound no backend (ver routes/metrics.ts
    // + eventBus.emitSoundPlay). Sem URL = nada toca.
    source.addEventListener("sound:play", (e) => {
      try {
        const { soundUrl } = JSON.parse((e as MessageEvent).data) as {
          kpiKey: string;
          soundUrl: string;
        };
        if (soundUrl) playSoundUrl(soundUrl);
      } catch {
        // ignore
      }
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
