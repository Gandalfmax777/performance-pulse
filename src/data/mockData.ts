export interface Assessor {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: "bronze" | "silver" | "gold";
  streak: number;
  weeklyGoalPercent: number;
  kpis: {
    leads: number;
    cadencia: number;
    ligacoes: number;
    reunioes: number;
    indicacoes: number;
    boletos: number;
  };
  dailyActivity: boolean[];
}

export interface Activity {
  id: string;
  name: string;
  day: string;
  time: string;
  kpiLabel: string;
  kpiTarget: number;
}

export const SCHEDULE: Activity[] = [
  { id: "lista", name: "Geração Lista Prospecção", day: "Segunda", time: "13:30-14:30", kpiLabel: "Leads", kpiTarget: 10 },
  { id: "cadencia-seg", name: "Cadência de Novos", day: "Segunda", time: "15:30-16:15", kpiLabel: "% Cadenciada", kpiTarget: 70 },
  { id: "bloco1", name: "Prospecção Ativa Bloco 1", day: "Terça", time: "10:00-10:45", kpiLabel: "Ligações", kpiTarget: 15 },
  { id: "bloco2", name: "Prospecção Ativa Bloco 2", day: "Terça", time: "15:00-15:45", kpiLabel: "Ligações", kpiTarget: 15 },
  { id: "indica", name: "Indica Day", day: "Quarta", time: "Dia todo", kpiLabel: "Indicações", kpiTarget: 5 },
  { id: "cadencia-prod", name: "Cadência c/ Produto", day: "Quinta", time: "09:45-11:00", kpiLabel: "Touch Points", kpiTarget: 20 },
  { id: "boleta", name: "Boleta Day", day: "Quinta", time: "14:00-17:30", kpiLabel: "Boletos", kpiTarget: 10 },
];

export const ASSESSORS: Assessor[] = [
  {
    id: "1", name: "Lucas Mendes", avatar: "LM", points: 2450, level: "gold", streak: 12,
    weeklyGoalPercent: 94,
    kpis: { leads: 14, cadencia: 85, ligacoes: 32, reunioes: 5, indicacoes: 8, boletos: 12 },
    dailyActivity: [true, true, true, true, false],
  },
  {
    id: "2", name: "Ana Beatriz", avatar: "AB", points: 2180, level: "gold", streak: 8,
    weeklyGoalPercent: 87,
    kpis: { leads: 11, cadencia: 92, ligacoes: 28, reunioes: 4, indicacoes: 6, boletos: 9 },
    dailyActivity: [true, true, true, false, false],
  },
  {
    id: "3", name: "Rafael Costa", avatar: "RC", points: 1920, level: "silver", streak: 5,
    weeklyGoalPercent: 76,
    kpis: { leads: 9, cadencia: 70, ligacoes: 22, reunioes: 3, indicacoes: 4, boletos: 8 },
    dailyActivity: [true, true, false, true, false],
  },
  {
    id: "4", name: "Mariana Silva", avatar: "MS", points: 1650, level: "silver", streak: 3,
    weeklyGoalPercent: 68,
    kpis: { leads: 8, cadencia: 65, ligacoes: 18, reunioes: 2, indicacoes: 3, boletos: 7 },
    dailyActivity: [true, false, true, false, false],
  },
  {
    id: "5", name: "Pedro Alves", avatar: "PA", points: 1380, level: "bronze", streak: 2,
    weeklyGoalPercent: 55,
    kpis: { leads: 6, cadencia: 50, ligacoes: 14, reunioes: 1, indicacoes: 2, boletos: 5 },
    dailyActivity: [true, true, false, false, false],
  },
  {
    id: "6", name: "Juliana Rocha", avatar: "JR", points: 1100, level: "bronze", streak: 1,
    weeklyGoalPercent: 42,
    kpis: { leads: 4, cadencia: 40, ligacoes: 10, reunioes: 1, indicacoes: 1, boletos: 3 },
    dailyActivity: [false, true, false, false, false],
  },
];

export const BADGES = [
  { id: "hunter", name: "Hunter Elite", icon: "🎯", desc: "100% cadência semanal" },
  { id: "closer", name: "Closer Pro", icon: "🤝", desc: "5+ reuniões na semana" },
  { id: "networker", name: "Networker", icon: "🌐", desc: "10+ indicações no mês" },
  { id: "machine", name: "Máquina", icon: "⚡", desc: "Streak 10+ dias" },
  { id: "starter", name: "Desbravador", icon: "🚀", desc: "Primeira semana completa" },
];
