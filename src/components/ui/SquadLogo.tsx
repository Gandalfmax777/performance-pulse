import { cn } from "@/lib/utils";

interface SquadLogoProps {
  squad: {
    id: string;
    name: string;
    logoUrl?: string | null;
    /** Cor oficial do squad (hsl/hex) — usada como fundo do placeholder. Opcional. */
    color?: string | null;
  };
  /** Tamanho em pixels (componente é quadrado). */
  size: number;
  className?: string;
}

/**
 * Logo do squad — mostra foto se `logoUrl` presente, senão placeholder com
 * a inicial do nome em cima da `color` do squad (ou cinza se sem color).
 *
 * Espelha AssessorAvatar mas usa `rounded-md` (cards quadrados, alinhado
 * com o design dos cards de squad). Sem level border — squad não tem level.
 */
export function SquadLogo({ squad, size, className }: SquadLogoProps) {
  const sizeStyle = { width: size, height: size, minWidth: size };
  const initial = squad.name?.[0]?.toUpperCase() ?? "?";

  if (squad.logoUrl) {
    return (
      <img
        src={squad.logoUrl}
        alt={squad.name}
        style={sizeStyle}
        className={cn("rounded-md object-cover border border-line/40", className)}
      />
    );
  }

  return (
    <div
      style={{
        ...sizeStyle,
        background: squad.color ?? "hsl(var(--muted))",
      }}
      className={cn(
        "rounded-md flex items-center justify-center font-bold text-white border border-line/40",
        className,
      )}
    >
      <span style={{ fontSize: size * 0.5 }}>{initial}</span>
    </div>
  );
}
