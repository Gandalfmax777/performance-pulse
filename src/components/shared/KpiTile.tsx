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
  /** Borda esquerda accent (variante hero do design). */
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
      ? "font-display font-extrabold text-[36px] leading-none tracking-[-0.03em] text-ink"
      : "font-display font-extrabold text-[30px] leading-none tracking-[-0.03em] text-ink";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius)] border border-line bg-card p-5",
        "shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]",
        accent && "border-l-[3px] border-l-primary",
        className,
      )}
      {...rest}
    >
      <Eyebrow className="mb-3">{label}</Eyebrow>
      <div className="flex items-end justify-between gap-3">
        <div className={cn("num", valueClass)}>
          {value}
          {unit && (
            <span className="ml-1.5 text-[18px] font-medium text-ink-3">
              {unit}
            </span>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
      {sub && <div className="mt-2.5 text-[12px] text-ink-3">{sub}</div>}
      {typeof progress === "number" && (
        <div className="mt-3 h-1 rounded-[2px] bg-surface-2 overflow-hidden">
          <div
            className={cn("h-full rounded-[2px]", PROGRESS_COLOR[progressColor])}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};
