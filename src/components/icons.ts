/* Phosphor icon registry — Editorial V1 redesign.
   Concentra mapas de ícones (KPIs, squads) usados pela UI. Os ícones
   pontuais continuam sendo importados direto de '@phosphor-icons/react'
   nos componentes — esse arquivo é só para mapeamentos compartilhados.
*/
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  Bird,
  CalendarBlank,
  Cat,
  CheckCircle,
  Dog,
  Flag,
  Gift,
  HouseSimple,
  Lightning,
  Phone,
  Sparkle,
  Star,
  Users,
} from '@phosphor-icons/react';

// Mapeamento de KPIs → ícones.
export const KPI_ICON: Record<string, PhosphorIcon> = {
  leads: Users,
  cadencia: Lightning,
  ligacoes: Phone,
  reunioes_ag: CalendarBlank,
  reunioes_real: CheckCircle,
  ativacao: Sparkle,
  indicacoes: Gift,
};

// Mapeamento "icones de squads" — antes eram emojis (🐺 🦅 🐯 🦊 ⚡ ⛳ 🏨).
const SQUAD_ICON_MAP: Record<string, PhosphorIcon> = {
  alfa: Dog,
  bravo: Bird,
  charlie: Cat,
  delta: Dog,
  echo: Lightning,
  foxtrot: Cat,
  golf: Flag,
  hotel: HouseSimple,
};

export function squadIcon(name: string): PhosphorIcon {
  const k = (name || '').trim().toLowerCase();
  return SQUAD_ICON_MAP[k] || Star;
}
