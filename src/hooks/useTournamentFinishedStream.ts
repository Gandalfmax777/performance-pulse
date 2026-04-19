import { useEffect, useState } from "react";
import { getAuthToken } from "@/api/client";
import type { TournamentFinishedEvent } from "@/components/dashboard/TournamentFinishedOverlay";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

/**
 * Ouve SSE `tournament:finished` do backend. Retorna o último evento recebido
 * (componentes consumidores mostram overlay + chamam onDismiss pra limpar).
 *
 * Reusa o mesmo endpoint /api/stream/rankings (público) usado pelo
 * useRankingStream. Abre uma segunda EventSource porque simplifica lógica —
 * overhead é mínimo (heartbeat a cada 15s) e o backend suporta 100 listeners.
 */
export function useTournamentFinishedStream(enabled: boolean = true) {
  const [event, setEvent] = useState<TournamentFinishedEvent | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getAuthToken();
    const url = token
      ? `${API_URL}/stream/rankings?token=${encodeURIComponent(token)}`
      : `${API_URL}/stream/rankings`;

    const source = new EventSource(url);

    source.addEventListener("tournament:finished", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as TournamentFinishedEvent;
        if (payload?.winners?.length > 0) {
          setEvent(payload);
        }
      } catch {
        // ignora JSON inválido — fail-soft
      }
    });

    source.onerror = () => {
      // EventSource faz auto-reconnect; não precisa fechar aqui
    };

    return () => {
      source.close();
    };
  }, [enabled]);

  const dismiss = () => setEvent(null);

  return { event, dismiss };
}
