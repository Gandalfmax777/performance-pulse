import { useFunnelReport } from "@/hooks/useReports";
import { motion } from "framer-motion";

interface ConversionFunnelProps {
  from: string;
  to: string;
  assessorId?: string;
}

interface Stage {
  label: string;
  value: number;
  color: string;
}

/**
 * Funil de conversão Editorial V1 — barras horizontais empilhadas
 * mostrando a queda de Leads → Ativações. Cada estágio mostra a sua
 * contribuição absoluta + % do total + taxa de conversão pro próximo.
 *
 * Segue o artboard "Funil de conversão" de KpisScreen, com a paleta
 * gradiente de azul → verde EQI nas barras.
 */
const ConversionFunnel = ({ from, to, assessorId }: ConversionFunnelProps) => {
  const { data: funnel, isLoading } = useFunnelReport({ from, to, assessorId });

  if (!funnel || isLoading) {
    return (
      <div className="rounded-[14px] border border-line bg-card p-5 animate-pulse">
        <div className="h-5 w-40 bg-line rounded mb-4" />
        <div className="h-32 bg-surface-2 rounded" />
      </div>
    );
  }

  const stages: Stage[] = [
    { label: "Ligações", value: funnel.ligacoes, color: "oklch(0.78 0.06 240)" },
    { label: "Reuniões agendadas", value: funnel.reunioesAgendadas, color: "oklch(0.68 0.10 240)" },
    { label: "Reuniões realizadas", value: funnel.reunioesRealizadas, color: "oklch(0.55 0.13 200)" },
    { label: "Fechamentos", value: funnel.fechamentos, color: "oklch(0.45 0.13 175)" },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-0.5">
            CONVERSÃO
          </p>
          <h3 className="text-[14px] font-extrabold tracking-tight text-ink">
            Funil de conversão
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-ink-3">
          <span>
            <span className="font-bold text-ink">{Math.round(funnel.conversaoFechamento)}%</span>{" "}
            geral
          </span>
          {funnel.ticketMedio > 0 && (
            <span>
              ticket{" "}
              <span className="font-bold text-ink">
                R$ {Math.round(funnel.ticketMedio).toLocaleString("pt-BR")}
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {stages.map((s, i) => {
          const w = (s.value / max) * 100;
          const conv = i > 0 && stages[i - 1].value > 0
            ? Math.round((s.value / stages[i - 1].value) * 100)
            : null;
          const wPct = (s.value / max) * 100;
          return (
            <div
              key={s.label}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: "180px 1fr 60px 64px" }}
            >
              <p className="text-[12px] font-semibold text-ink truncate">{s.label}</p>
              <div className="relative h-8 bg-surface-2 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06 }}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-white text-[11px] font-bold rounded"
                  style={{ background: s.color }}
                >
                  <span className="font-mono">
                    {s.value.toLocaleString("pt-BR")}
                  </span>
                </motion.div>
              </div>
              <span className="font-mono text-[12px] font-bold text-right text-ink">
                {Math.round(wPct)}%
              </span>
              <span
                className="font-mono text-[11px] font-bold text-right"
                style={{
                  color: conv && conv >= 60 ? "hsl(var(--success))" : "hsl(var(--ink-3))",
                }}
              >
                {conv ? `↘ ${conv}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversionFunnel;
