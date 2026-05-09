import { MagnifyingGlass } from "@phosphor-icons/react";
import { Eyebrow, SectionCard } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type SortKey = "points" | "goal" | "streak";

interface RankingFiltersBarProps {
  squads: Array<{ id: string; name: string }>;
  squadFilter: string; // 'all' or squad id
  onSquadChange: (id: string) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  search: string;
  onSearchChange: (s: string) => void;
  /** Counter à direita (ex.: "14 AAIs · 3 squads") */
  counterText: string;
}

/**
 * Filters bar do `/ranking` (alinha com `Ranking.html`):
 *   • Eyebrow "Filtros"
 *   • Select squad
 *   • Select ordenação
 *   • Input busca AAI com lupa
 *   • Counter à direita
 *
 * Estado controlado pelo caller (DailyResults). Não persiste em URL
 * por ora; pode evoluir para searchParams se Felipe pedir deep-link.
 */
export const RankingFiltersBar = ({
  squads,
  squadFilter,
  onSquadChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  counterText,
}: RankingFiltersBarProps) => {
  return (
    <SectionCard bodyless>
      <div className="flex items-center gap-3 flex-wrap px-4 py-3">
        <Eyebrow>Filtros</Eyebrow>

        <Select value={squadFilter} onValueChange={onSquadChange}>
          <SelectTrigger className="w-[180px] h-9 text-[13px]">
            <SelectValue placeholder="Todos os squads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os squads</SelectItem>
            {squads.map((sq) => (
              <SelectItem key={sq.id} value={sq.id}>
                {sq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as SortKey)}
        >
          <SelectTrigger className="w-[180px] h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="points">Ordenar: pontos ↓</SelectItem>
            <SelectItem value="goal">Ordenar: meta % ↓</SelectItem>
            <SelectItem value="streak">Ordenar: streak ↓</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar AAI…"
            className="h-9 pl-8 text-[13px]"
          />
        </div>

        <span className="ml-auto text-[12px] text-ink-3">{counterText}</span>
      </div>
    </SectionCard>
  );
};
