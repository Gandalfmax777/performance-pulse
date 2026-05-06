import { useMemo } from "react";
import { Pulse, Sword as Swords, Trophy, TrendUp } from "@phosphor-icons/react";
import { type Assessor } from "@/types/assessor";
import { useSquads } from "@/hooks/useSquads";
import { useWeeklyRanking } from "@/hooks/useRankings";
import { useActiveTournaments, type ApiTournament } from "@/hooks/useTournaments";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

interface TvLiveTickerProps {
  assessors: Assessor[];
}

interface TickerItem {
  icon: React.ReactNode;
  text: string;
}

/**
 * Ticker preto fixo no rodapé da TV — gera mensagens dinâmicas a partir
 * dos dados ao vivo (rankings, squads, torneios) e roda em loop infinito.
 * Replica a faixa "MESA · AO VIVO | 142% da meta semanal | Squad Alfa
 * lidera com +18% sobre Squad Beta" do artboard TvSquadBoard.
 *
 * Visual: barra preta full-width no rodapé com texto branco rolando da
 * direita pra esquerda em loop CSS animado. Animação infinita usando
 * `marquee` (definido em index.css como animação keyframes custom).
 */
const TvLiveTicker = ({ assessors }: TvLiveTickerProps) => {
  const { data: squadsData } = useSquads();
  const { data: weeklyRanking } = useWeeklyRanking();
  const { data: tournaments } = useActiveTournaments();

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];

    // Status: AO VIVO
    list.push({
      icon: <Pulse size={14} weight="bold" className="text-eqi-green" />,
      text: "MESA · AO VIVO",
    });

    // Meta semanal do time (média)
    const ranking = weeklyRanking?.rankings ?? [];
    if (ranking.length > 0) {
      const avgPct = Math.round(
        ranking.reduce((s, r) => s + r.rollup.weeklyGoalPercent, 0) / ranking.length,
      );
      list.push({
        icon: <TrendUp size={14} weight="bold" className="text-gold" />,
        text: `${avgPct}% da meta semanal`,
      });
    }

    // Squad líder + vantagem
    const squads = squadsData ?? [];
    if (squads.length >= 2 && ranking.length > 0) {
      const perfById = new Map(
        ranking.map((r) => [r.assessor.id, r.rollup.weeklyGoalPercent]),
      );
      const standings = squads
        .map((s) => {
          const pcts = s.members
            .map((m) => perfById.get(m.assessorId))
            .filter((v): v is number => typeof v === "number");
          const pct = pcts.length
            ? Math.round(pcts.reduce((sum, v) => sum + v, 0) / pcts.length)
            : 0;
          return { squad: s, pct };
        })
        .sort((a, b) => b.pct - a.pct);
      const [first, second] = standings;
      if (first && second) {
        const gap = first.pct - second.pct;
        list.push({
          icon: <Swords size={14} weight="bold" className="text-gold" />,
          text: `Squad ${first.squad.name} lidera com +${gap}p.p. sobre ${second.squad.name}`,
        });
      }
    }

    // Torneios ativos + countdown
    for (const t of tournaments ?? []) {
      const end = parseISO(t.endDate);
      const now = new Date();
      const days = differenceInDays(end, now);
      const hours = differenceInHours(end, now) % 24;
      const remaining = days > 0 ? `${days}d ${hours}h` : `${Math.max(0, hours)}h`;
      list.push({
        icon: <Trophy size={14} weight="fill" className="text-gold" />,
        text: `Torneio "${t.roundLabel}" encerra em ${remaining}`,
      });
    }

    // Top performer
    if (ranking.length > 0) {
      const top = ranking[0];
      const a = assessors.find((x) => x.id === top.assessor.id);
      if (a) {
        list.push({
          icon: <TrendUp size={14} weight="bold" className="text-eqi-green" />,
          text: `${a.name} lidera o ranking semanal com ${top.rollup.points} pts`,
        });
      }
    }

    return list;
  }, [assessors, squadsData, weeklyRanking, tournaments]);

  if (items.length === 0) return null;

  // Duplica a lista para o loop não ter "vazio" — quando a primeira passa,
  // a segunda já está entrando.
  const doubled = [...items, ...items];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 h-9 overflow-hidden text-white border-t border-white/10"
      style={{ background: "hsl(var(--ink))" }}
    >
      <div className="flex items-center h-full whitespace-nowrap animate-marquee">
        {doubled.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 text-xs font-semibold tracking-wide"
          >
            {it.icon}
            <span>{it.text}</span>
            <span className="text-white/30 ml-2">·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TvLiveTicker;

// Garante referência usada do tipo
export type { ApiTournament };
