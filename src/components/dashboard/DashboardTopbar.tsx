import { TextAlignJustify } from "@phosphor-icons/react";

interface Props {
  /** Eyebrow opcional acima do título (label uppercase tracking-wide). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Slot pro lado direito — segue o artboard Editorial: usado pra
   *  PeriodTabs / botão "Apresentação" / actions específicas da tela. */
  actions?: React.ReactNode;
  onMenuClick: () => void;
}

/**
 * TopBar Editorial V1 — fiel ao artboard `TopBar` do screens-v1.jsx:
 * eyebrow + h1 22px extrabold + subtitle + slot `actions`. Sem busca
 * nem sino — esses elementos não existem no design original; cabem na
 * própria sidebar quando precisarmos no futuro.
 */
const DashboardTopbar = ({ eyebrow, title, subtitle, actions, onMenuClick }: Props) => {
  return (
    <header className="flex items-center gap-4 px-7 py-5 border-b border-line bg-card/70 backdrop-blur-md sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="md:hidden p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
      >
        <TextAlignJustify size={18} weight="bold" />
      </button>

      <div className="flex-1 min-w-0">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-extrabold text-ink tracking-tight leading-none truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] text-ink-3 mt-1 truncate">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};

export default DashboardTopbar;
