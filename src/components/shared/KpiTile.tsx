import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

type ProgressColor = "primary" | "warning" | "danger" | "success";

interface KpiTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Eyebrow label (mono uppercase). */
  label: string;
  /** Valor principal — string já formatada (ex.: "8.420", "87%", "R$ 4.720"). */
  value: ReactNode;
  /** Sufixo pequeno após o valor (ex.: "dias", "pp"). */
  unit?: ReactNode;
  /** Linha de descrição abaixo do valor (ex.: "vs 7.498 na semana passada"). */
  sub?: ReactNode;
  /** Slot opcional à direita do valor (ex.: <StatDelta direction="up">+12%</StatDelta>). */
  trailing?: ReactNode;
  /** Progresso 0-100. Quando definido renderiza .kpi-bar abaixo. */
  progress?: number;
  progressColor?: ProgressColor;
  /** Variante hero: bg primary + texto invertido. Use UMA vez por tela no KPI principal. */
  accent?: boolean;
  /** Tamanho do valor — default ~30px (KPI grid), `lg` ~36px (hero). */
  size?: "default" | "lg";
}

const PROGRESS_COLOR: Record<ProgressColor, string> = {
  primary: "bg-primary",
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  danger: "bg-destructive",
};

/**
 * KPI tile editorial — alinhado com `.kpi-card` em design/assets/pulse.css:
 * label mono + valor display + delta opcional + sub + progress bar opcional.
 *
 * Usado em qualquer hero strip de métrica (Visão Geral, Por Dia, KPIs,
 * relatórios). Para layouts denso use `size="default"`; para hero strips
 * acima do fold use `size="lg"`.
 */
export const KpiTile = ({
  label,
  value,
  unit,
  sub,
  trailing,
  progress,
  progressColor = "primary",
  accent,
  size = "default",
  className,
  ...rest
}: KpiTileProps) => {
  const valueClass =
    size === "lg"
      ? "font-display font-extrabold text-[36px] leading-none tracking-[-0.03em] tabular-nums"
      : "font-display font-extrabold text-[30px] leading-none tracking-[-0.03em] tabular-nums";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius)] border p-5",
        "shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]",
        accent
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-card border-line text-ink",
        className,
      )}
      {...rest}
    >
      <Eyebrow
        className={cn("mb-3", accent && "!text-primary-foreground/70")}
      >
        {label}
      </Eyebrow>
      <div className="flex items-end justify-between gap-3">
        <div className={valueClass}>
          {value}
          {unit && (
            <span
              className={cn(
                "ml-1.5 text-[18px] font-medium",
                accent ? "text-primary-foreground/70" : "text-ink-3",
              )}
            >
              {unit}
            </span>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {sub && (
        <div
          className={cn(
            "mt-2.5 text-[12px]",
            accent ? "text-primary-foreground/70" : "text-ink-3",
          )}
        >
          {sub}
        </div>
      )}
      {typeof progress === "number" && (
        <div
          className={cn(
            "mt-3 h-1 rounded-[2px] overflow-hidden",
            accent ? "bg-primary-foreground/20" : "bg-surface-2",
          )}
        >
          <div
            className={cn(
              "h-full rounded-[2px]",
              accent ? "bg-primary-foreground" : PROGRESS_COLOR[progressColor],
            )}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};
