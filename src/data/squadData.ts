import { type Assessor } from "./mockData";

export interface Squad {
  id: string;
  name: string;
  emoji: string;
  color: string;
  leaderId: string;
  memberIds: string[];
}

export interface Bet {
  id: string;
  round: string;
  type: "weekly" | "monthly";
  value: number;
  winnerId: string | null;
  date: string;
  status: "active" | "finished";
}

export interface SquadBadge {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: (squad: Squad, assessors: Assessor[]) => boolean;
}

export const SQUAD_BADGES: SquadBadge[] = [
  {
    id: "invicto",
    name: "Squad Invicto",
    icon: "🛡️",
    desc: "3 vitórias consecutivas",
    check: () => false, // checked via history
  },
  {
    id: "cadencia-master",
    name: "Mestres da Cadência",
    icon: "⚡",
    desc: "Média de cadência > 80%",
    check: (squad, assessors) => {
      const members = assessors.filter(a => squad.memberIds.includes(a.id));
      if (!members.length) return false;
      return members.reduce((s, m) => s + m.kpis.cadencia, 0) / members.length > 80;
    },
  },
  {
    id: "hunter-squad",
    name: "Caçadores Elite",
    icon: "🎯",
    desc: "Média de leads > 10",
    check: (squad, assessors) => {
      const members = assessors.filter(a => squad.memberIds.includes(a.id));
      if (!members.length) return false;
      return members.reduce((s, m) => s + m.kpis.leads, 0) / members.length > 10;
    },
  },
  {
    id: "closer-squad",
    name: "Fechadores",
    icon: "🤝",
    desc: "Média de reuniões > 4",
    check: (squad, assessors) => {
      const members = assessors.filter(a => squad.memberIds.includes(a.id));
      if (!members.length) return false;
      return members.reduce((s, m) => s + m.kpis.reunioes, 0) / members.length > 4;
    },
  },
];

export const DEFAULT_SQUADS: Squad[] = [
  {
    id: "s1",
    name: "Alfa Traders",
    emoji: "🐺",
    color: "hsl(152, 70%, 45%)",
    leaderId: "1",
    memberIds: ["1", "2", "3"],
  },
  {
    id: "s2",
    name: "Beta Capital",
    emoji: "🦅",
    color: "hsl(200, 70%, 50%)",
    leaderId: "4",
    memberIds: ["4", "5", "6"],
  },
];

export const DEFAULT_BETS: Bet[] = [
  { id: "b1", round: "Semana 1 - Abril", type: "weekly", value: 50, winnerId: "s1", date: "2026-04-01", status: "finished" },
  { id: "b2", round: "Semana 2 - Abril", type: "weekly", value: 50, winnerId: "s2", date: "2026-04-07", status: "finished" },
  { id: "b3", round: "Semana 3 - Abril", type: "weekly", value: 75, winnerId: null, date: "2026-04-08", status: "active" },
];

export function getSquadStats(squad: Squad, assessors: Assessor[]) {
  const members = assessors.filter(a => squad.memberIds.includes(a.id));
  const n = members.length || 1;
  return {
    leads: +(members.reduce((s, m) => s + m.kpis.leads, 0) / n).toFixed(1),
    cadencia: +(members.reduce((s, m) => s + m.kpis.cadencia, 0) / n).toFixed(1),
    ligacoes: +(members.reduce((s, m) => s + m.kpis.ligacoes, 0) / n).toFixed(1),
    reunioes: +(members.reduce((s, m) => s + m.kpis.reunioes, 0) / n).toFixed(1),
    indicacoes: +(members.reduce((s, m) => s + m.kpis.indicacoes, 0) / n).toFixed(1),
    boletos: +(members.reduce((s, m) => s + m.kpis.boletos, 0) / n).toFixed(1),
    totalPoints: members.reduce((s, m) => s + m.points, 0),
    avgGoal: +(members.reduce((s, m) => s + m.weeklyGoalPercent, 0) / n).toFixed(1),
  };
}
