/* Phosphor icon registry — Editorial V1 redesign.
   Importações nomeadas centralizadas para que o app inteiro consuma
   ícones do mesmo lugar e fique fácil trocar pesos no futuro.
*/
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  Activity,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowsLeftRight,
  Bell,
  Bird,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Cat,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  Clock,
  Confetti,
  Crown,
  CurrencyCircleDollar,
  Dog,
  DownloadSimple,
  Export,
  Eye,
  EyeSlash,
  FileText,
  Fire,
  Flag,
  Funnel,
  GearSix,
  Gift,
  Hand,
  HouseSimple,
  Lightning,
  ListBullets,
  MagnifyingGlass,
  Medal,
  Moon,
  PaperPlaneTilt,
  Pause,
  Phone,
  Play,
  Plus,
  Pulse,
  Question,
  Rocket,
  ShieldCheck,
  SignOut,
  SkipForward,
  Sparkle,
  SpeakerHigh,
  SpeakerSimpleSlash,
  Squares,
  Stack,
  Star,
  Sun,
  Sword as Swords,
  Target,
  Television,
  TextAlignJustify,
  TrendUp,
  Trophy,
  Users,
  UsersThree,
  X,
} from '@phosphor-icons/react';

// Re-export individual icons keeping legacy aliases used across the app.
export {
  Activity,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowsLeftRight,
  Bell,
  CaretLeft,
  CaretRight,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  Clock,
  Confetti,
  Crown,
  CurrencyCircleDollar,
  DownloadSimple,
  Export,
  Eye,
  EyeSlash,
  FileText,
  Fire,
  Flag,
  Gift,
  Hand,
  Lightning,
  ListBullets,
  Medal,
  Moon,
  PaperPlaneTilt,
  Pause,
  Phone,
  Play,
  Plus,
  Pulse,
  Question,
  Rocket,
  ShieldCheck,
  SignOut,
  Sparkle,
  SpeakerHigh,
  SpeakerSimpleSlash,
  Squares,
  Star,
  Sun,
  Sword as Swords,
  Target,
  TrendUp,
  Trophy,
  Users,
  UsersThree,
  X,
};

// Aliases para ícones renomeados (lucide → phosphor)
export const ActivityIcon = Activity;
export const Calendar = CalendarBlank;
export const Filter = Funnel;
export const Home = HouseSimple;
export const Layers = Stack;
export const Menu = TextAlignJustify;
export const Next = SkipForward;
export const Search = MagnifyingGlass;
export const Settings = GearSix;
export const Tv = Television;
export const Volume2 = SpeakerHigh;
export const VolumeX = SpeakerSimpleSlash;

// Mapeamento de KPIs → ícones.
export const KPI_ICON: Record<string, PhosphorIcon> = {
  leads: Users,
  cadencia: Lightning,
  ligacoes: Phone,
  reunioes_ag: CalendarBlank,
  reunioes_real: CheckCircle,
  touchpoint: Hand,
  ativacao: Sparkle,
  indicacoes: Gift,
  boletas: FileText,
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
