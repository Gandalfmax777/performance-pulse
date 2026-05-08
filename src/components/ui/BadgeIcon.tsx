import {
  Medal,
  Briefcase,
  ChartLine,
  Crosshair,
  Crown,
  Fire,
  Globe,
  HandFist,
  Handshake,
  Lightning,
  ShieldCheck,
  Target,
  Trophy,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

/**
 * Mapeia o slug salvo em `Badge.icon` (ex: "Target", "Handshake") pro
 * componente Phosphor correspondente. Substitui o emoji literal que era
 * salvo antes de 2026-05-08 (vide `scripts/migrate-badge-icons.ts` no
 * backend que converteu badges existentes em prod).
 *
 * Lista cobre os 10 slugs do seed atual + qualquer adição manual.
 * Slug desconhecido → fallback `<Medal>` (não quebra a UI).
 */
const BADGE_ICONS: Record<string, PhosphorIcon> = {
  // Slugs herdados (badges antigas — soft-deleted em prod, mas BadgeUnlocks
  // históricos ainda referenciam)
  Target,
  Handshake,
  Globe,
  Lightning,
  Crown,
  Fire,
  Crosshair,
  Briefcase,
  Trophy,
  HandFist,
  // Slugs novos (P3 — 2026-05-08)
  Medal,
  ChartLine,
  ShieldCheck,
};

interface BadgeIconProps {
  slug: string;
  /** Tamanho em pixels (default 14). */
  size?: number;
  /** Phosphor weight (default "fill" — cores das badges são cheias). */
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}

export function BadgeIcon({
  slug,
  size = 14,
  weight = "fill",
  className,
}: BadgeIconProps) {
  const Icon = BADGE_ICONS[slug] ?? Medal;
  return <Icon size={size} weight={weight} className={className} />;
}
