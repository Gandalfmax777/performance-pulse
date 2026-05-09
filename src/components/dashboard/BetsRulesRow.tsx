import {
  CurrencyDollar,
  Clock,
  Target,
  Trophy,
} from "@phosphor-icons/react";
import { Eyebrow } from "@/components/shared";

const RULES = [
  {
    icon: CurrencyDollar,
    label: "Stake mínimo",
    value: "R$ 50",
    sub: "Definido por rodada — admin pode subir",
  },
  {
    icon: Clock,
    label: "Cooldown",
    value: "0 dias",
    sub: "Nova rodada pode iniciar imediatamente após encerrar",
  },
  {
    icon: Target,
    label: "Critério padrão",
    value: "% combinada",
    sub: "Outros: pontos totais, leads, reuniões",
  },
  {
    icon: Trophy,
    label: "Premiação",
    value: "Winner-take-all",
    sub: "Squad vencedora recebe pote total",
  },
];

/**
 * Row "Como funciona / Regras" do `/squad-bet` — alinha com `Squad-Bet.html`.
 *
 * 4 tiles flat com regras estáticas. Ícone primary + label eyebrow +
 * value font-display 22px + sub.
 *
 * Por ora valores são hardcoded (regras vêm de produto/Felipe). Quando
 * tivermos config dinâmica de stake/cooldown podemos puxar de uma
 * settings query.
 */
const BetsRulesRow = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-[var(--radius)] overflow-hidden border border-line">
      {RULES.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label} className="bg-card p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon size={16} weight="bold" className="text-primary" />
              <Eyebrow>{r.label}</Eyebrow>
            </div>
            <p className="num font-display font-extrabold text-ink leading-none tracking-[-0.03em] text-[22px]">
              {r.value}
            </p>
            <p className="text-[11px] text-ink-3 leading-relaxed">{r.sub}</p>
          </div>
        );
      })}
    </div>
  );
};

export default BetsRulesRow;
