import { cn } from "@/lib/utils";
import { apiBaseUrl } from "@/api/client";

const LEVEL_COLORS = {
  gold: "text-gold border-gold/40 bg-gold/10",
  silver: "text-silver border-silver/40 bg-silver/10",
  bronze: "text-bronze border-bronze/40 bg-bronze/10",
} as const;

interface AssessorAvatarProps {
  initials: string;
  photoUrl?: string | null;
  level?: "bronze" | "silver" | "gold";
  /** Tamanho em pixels (default 40). Componente é quadrado. */
  size?: number;
  className?: string;
}

/**
 * Avatar de assessor — mostra foto se disponível, senão iniciais.
 * Borda colorida por level (bronze/silver/gold).
 */
export function AssessorAvatar({
  initials,
  photoUrl,
  level = "bronze",
  size = 40,
  className,
}: AssessorAvatarProps) {
  const levelClass = LEVEL_COLORS[level];
  const sizeStyle = { width: size, height: size, minWidth: size };

  if (photoUrl) {
    const src = photoUrl.startsWith("http") ? photoUrl : `${apiBaseUrl}${photoUrl}`.replace("/api/uploads", "/uploads");
    return (
      <img
        src={src}
        alt={initials}
        style={sizeStyle}
        className={cn(
          "rounded-full object-cover border-2",
          levelClass,
          className,
        )}
      />
    );
  }

  return (
    <div
      style={sizeStyle}
      className={cn(
        "rounded-full flex items-center justify-center font-bold border-2",
        levelClass,
        className,
      )}
    >
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}
