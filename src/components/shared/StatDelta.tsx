import type { HTMLAttributes } from "react";
import { ArrowUp, ArrowDown, Minus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "flat";

interface StatDeltaProps extends HTMLAttributes<HTMLSpanElement> {
  /** Texto do delta — ex.: "+12,3%" ou "+4 pp". O símbolo (▲/▼/—) é
   *  injetado pelo componente conforme `direction`, não inclua aqui. */
  children: React.ReactNode;
  direction: Direction;
  /** Sem ícone, só texto colorido. Útil dentro de tabelas densas. */
  iconless?: boolean;
}

const ICON: Record<Direction, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

/**
 * Delta sinalizado (▲/▼/—) com cor por direção. Mapeia em `.delta` /
 * `.delta-up` / `.delta-down` (src/index.css). Usado em KPIs, ranking,
 * relatórios — qualquer lugar com variação contra período anterior.
 */
export const StatDelta = ({
  children,
  direction,
  iconless,
  className,
  ...rest
}: StatDeltaProps) => {
  const Icon = ICON[direction];
  const colorClass =
    direction === "up"
      ? "delta-up"
      : direction === "down"
      ? "delta-down"
      : "text-ink-3";

  return (
    <span className={cn("delta", colorClass, className)} {...rest}>
      {!iconless && <Icon size={11} weight="bold" />}
      {children}
    </span>
  );
};
