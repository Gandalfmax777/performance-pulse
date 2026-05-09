import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// `title` em HTMLAttributes<HTMLDivElement> é `string` (atributo HTML
// do tooltip nativo). Para usar ReactNode no header sem conflito,
// removemos `title` do tipo base via Omit.
interface SectionCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Título do header. Quando ausente, header não é renderizado. */
  title?: ReactNode;
  /** Subtítulo abaixo do título (linha auxiliar). */
  subtitle?: ReactNode;
  /** Slot à direita do header (filtros, ações, links "Ver todos →"). */
  headerActions?: ReactNode;
  /** Pular o padding interno do body (útil quando o filho é uma table full-bleed). */
  bodyless?: boolean;
  children: ReactNode;
}

/**
 * Card editorial — alinhado com `.card` + `.card-head` em pulse.css.
 * Inclui header opcional (título + subtítulo + actions) e body com padding
 * default. Use `bodyless` para colocar uma `<Table>` full-bleed.
 *
 * Não é wrapper do `Card` shadcn porque a tipografia/espaçamento do
 * design são bem específicos — encaixar em `<Card>` exigiria overrides
 * em quase todas as instâncias.
 */
export const SectionCard = ({
  title,
  subtitle,
  headerActions,
  bodyless,
  className,
  children,
  ...rest
}: SectionCardProps) => (
  <section
    className={cn(
      "rounded-[var(--radius)] border border-line bg-card overflow-hidden",
      "shadow-[0_1px_2px_hsl(240_12%_16%/0.05),0_4px_16px_hsl(240_12%_16%/0.04)]",
      className,
    )}
    {...rest}
  >
    {(title || headerActions) && (
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
        <div className="min-w-0">
          {title && (
            <div className="text-[13px] font-bold text-ink leading-tight tracking-[-0.01em] truncate">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-[12px] text-ink-3 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
        )}
      </header>
    )}
    {bodyless ? children : <div className="p-5">{children}</div>}
  </section>
);
