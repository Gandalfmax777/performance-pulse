import { cn } from "@/lib/utils";
import { getLevelMeta, type LevelSlug } from "@/lib/levelMeta";

interface LevelBadgeProps {
  level: LevelSlug | string;
  /** Default "md". sm = compacto pra ranking; md = padrão; lg = perfil. */
  size?: "sm" | "md" | "lg";
  /** Mostra ícone de seta indicando direção (sobe/desce) — usado em transições. */
  arrow?: "up" | "down" | null;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LevelBadgeProps["size"]>, string> = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-3 py-1.5",
};

/**
 * Badge que mostra o nome do nível com cor e tom adequado (positivo/negativo
 * /legacy). Substitui o text "Bronze/Silver/Gold" hardcoded em vários lugares.
 *
 * Cor vem de `levelMeta.ts` — mantém um único ponto de verdade pra paleta.
 */
export function LevelBadge({ level, size = "md", arrow = null, className }: LevelBadgeProps) {
  const meta = getLevelMeta(level);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-bold uppercase tracking-wider",
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        SIZE_CLASSES[size],
        className,
      )}
    >
      {arrow === "up" && <span aria-hidden>▲</span>}
      {arrow === "down" && <span aria-hidden>▼</span>}
      {meta.label}
    </span>
  );
}
