import { useMemo, useState, useEffect } from "react";
import { Target, Minus, Plus, Loader2, MessageSquare } from "lucide-react";
import type { Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { useMetrics, useUpsertMetric } from "@/hooks/useMetrics";
import { useKpis } from "@/hooks/useKpis";
import { apiFetch } from "@/api/client";
import { MEETING_NOTE_PREFIX, MEETING_AREA_PREFIX, type NoteType } from "@/lib/meetingBonus";

export interface ActivityBlock {
  name: string;
  time: string;
  kpiKeys: string[];
}

interface RegistrationPanelProps {
  assessors: Assessor[];
  /** Lista de KPI keys das atividades do cronograma oficial do dia. */
  kpiKeys: string[];
  /**
   * KPIs ativos que NÃO estão no cronograma do dia. Renderizados numa seção
   * "⊕ Outros KPIs" pra permitir registrar algo que o assessor fez fora do
   * planejamento (ex: ligação numa segunda de cronograma Leads+Cadência).
   */
  extraKpiKeys?: string[];
  /** Data alvo pra registro (YYYY-MM-DD). Default: hoje. */
  date?: string;
  /** Blocos manhã/tarde pra discriminar atividades. */
  blocks?: { morning: ActivityBlock[]; afternoon: ActivityBlock[] };
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const RegistrationPanel = ({ assessors, kpiKeys, extraKpiKeys = [], date, blocks }: RegistrationPanelProps) => {
  const { kpis: allKpis } = useKpis();
  const upsert = useUpsertMetric();
  const today = date ?? todayString();
  const { data: todayMetrics } = useMetrics({ from: today, to: today });

  // Filtra os KPIs do dia (mantém ordem do kpiKeys)
  const kpisForDay = useMemo(
    () => kpiKeys.map((k) => allKpis.find((x) => x.key === k)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [kpiKeys, allKpis],
  );

  // KPIs ativos "extras" — permitem lançamento fora do cronograma oficial
  const extraKpisForDay = useMemo(
    () => extraKpiKeys.map((k) => allKpis.find((x) => x.key === k)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [extraKpiKeys, allKpis],
  );

  // Lookup { assessorId → { kpiKey → rawValue } } + baseValue a partir das entries do dia
  const persistedValues = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    const b: Record<string, Record<string, number>> = {};
    for (const e of todayMetrics ?? []) {
      m[e.assessorId] ??= {};
      m[e.assessorId][e.kpiKey] = e.rawValue;
      if (e.baseValue !== null) {
        b[e.assessorId] ??= {};
        b[e.assessorId][e.kpiKey] = e.baseValue;
      }
    }
    return { raw: m, base: b };
  }, [todayMetrics]);

  // Estados locais (otimistas)
  const [localValues, setLocalValues] = useState<Record<string, Record<string, number>>>({});
  const [localBaseValues, setLocalBaseValues] = useState<Record<string, Record<string, number>>>({});
  const [noteOpen, setNoteOpen] = useState<string | null>(null); // assessorId or null
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("observation");

  // Sincroniza quando o backend retorna novos dados
  useEffect(() => {
    setLocalValues(persistedValues.raw);
    setLocalBaseValues(persistedValues.base);
  }, [persistedValues]);

  function getValue(assessorId: string, kpiKey: string): number {
    return localValues[assessorId]?.[kpiKey] ?? 0;
  }
  function getBaseValue(assessorId: string, kpiKey: string): number {
    return localBaseValues[assessorId]?.[kpiKey] ?? 0;
  }

  function setValueLocal(assessorId: string, kpiKey: string, value: number) {
    setLocalValues((prev) => ({
      ...prev,
      [assessorId]: { ...prev[assessorId], [kpiKey]: Math.max(0, value) },
    }));
  }
  function setBaseValueLocal(assessorId: string, kpiKey: string, value: number) {
    setLocalBaseValues((prev) => ({
      ...prev,
      [assessorId]: { ...prev[assessorId], [kpiKey]: Math.max(0, value) },
    }));
  }

  function commit(assessorId: string, kpiKey: string, value: number, baseValue?: number) {
    if (value < 0) return;
    // Calcula % anterior pra detectar meta batida (cruzar 100%) e disparar som de vitória.
    // Aproximação usando o target do frontend — suficiente pro trigger sonoro.
    const prevVal = persistedValues.raw[assessorId]?.[kpiKey] ?? 0;
    const kpiDef = kpisForDay.find((k) => k.key === kpiKey) ?? extraKpisForDay.find((k) => k.key === kpiKey);
    const target = kpiDef?.target ?? 0;
    const prevPercent = target > 0 ? Math.min(100, (prevVal / target) * 100) : 0;
    upsert.mutate({
      input: { assessorId, kpiKey, rawValue: value, baseValue, date: today },
      prevPercent,
    });
  }

  return (
    <div className="card-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-success" />
        <h2 className="text-sm font-bold text-foreground">Registrar Resultados</h2>
        {upsert.isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
      {blocks && (blocks.morning.length > 0 || blocks.afternoon.length > 0) && (
        <div className="flex gap-2 mb-3 text-[9px] text-muted-foreground">
          {blocks.morning.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-chart-orange/10 text-chart-orange font-semibold">
              ☀️ Manhã: {blocks.morning.map((b) => b.time).join(", ")}
            </span>
          )}
          {blocks.afternoon.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
              🌙 Tarde: {blocks.afternoon.map((b) => b.time).join(", ")}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
        {assessors.map((a) => (
          <div key={a.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <AssessorAvatar initials={a.avatar} photoUrl={a.photoUrl} level={a.level} size={28} />
              <span className="text-sm font-semibold text-foreground flex-1">{a.name}</span>
              <button
                onClick={() => {
                  if (noteOpen === a.id) {
                    setNoteOpen(null);
                    setNoteText("");
                    setNoteType("observation");
                  } else {
                    setNoteOpen(a.id);
                    setNoteText("");
                    setNoteType("observation");
                  }
                }}
                title="Observação / Reunião de venda"
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                  noteOpen === a.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nota/observação inline */}
            {noteOpen === a.id && (
              <div className="mb-3 space-y-2">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setNoteType("observation")}
                    className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      noteType === "observation"
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-muted/30 text-muted-foreground border border-border/30 hover:text-foreground"
                    }`}
                  >
                    Observação
                  </button>
                  <button
                    onClick={() => setNoteType("meeting")}
                    className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      noteType === "meeting"
                        ? "bg-success/20 text-success border border-success/40"
                        : "bg-muted/30 text-muted-foreground border border-border/30 hover:text-foreground"
                    }`}
                  >
                    Reunião venda +10
                  </button>
                  <button
                    onClick={() => setNoteType("meeting_area")}
                    className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      noteType === "meeting_area"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                        : "bg-muted/30 text-muted-foreground border border-border/30 hover:text-foreground"
                    }`}
                  >
                    Reunião áreas +5
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={
                    noteType === "meeting"
                      ? "Justificativa obrigatória (ex: cliente João, proposta enviada)"
                      : noteType === "meeting_area"
                      ? "Qual área? (ex: Seguros, Consórcio, Câmbio)"
                      : "Ex: Ausente hoje (consulta médica), Fez home office, etc."
                  }
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
                  rows={2}
                />
                <button
                  onClick={async () => {
                    const trimmed = noteText.trim();
                    if (!trimmed) return;
                    const notesPayload =
                      noteType === "meeting"
                        ? `${MEETING_NOTE_PREFIX} ${trimmed}`
                        : noteType === "meeting_area"
                        ? `${MEETING_AREA_PREFIX} ${trimmed}`
                        : trimmed;
                    try {
                      await apiFetch("/metrics", {
                        method: "POST",
                        body: {
                          assessorId: a.id,
                          kpiKey: kpisForDay[0]?.key ?? "leads",
                          rawValue: 0,
                          notes: notesPayload,
                          date: today,
                        },
                      });
                      setNoteOpen(null);
                      setNoteText("");
                      setNoteType("observation");
                    } catch {}
                  }}
                  disabled={!noteText.trim()}
                  className="px-3 py-1 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  {noteType === "meeting"
                    ? "Registrar reunião (+10 pts)"
                    : noteType === "meeting_area"
                    ? "Registrar reunião áreas (+5 pts)"
                    : "Salvar observação"}
                </button>
              </div>
            )}

            {/* Helper pra renderizar linha de KPI — reutilizado pelas 2 seções
                (cronograma e outros). Definido inline pra capturar `a` do escopo. */}
            {(() => {
              type KpiType = typeof allKpis[number];
              const renderKpiRow = (kpi: KpiType) => {
                const val = getValue(a.id, kpi.key);
                const isQOB = kpi.inputMode === "QUANTITY_OVER_BASE";
                const baseVal = isQOB ? getBaseValue(a.id, kpi.key) : 0;
                const pct = isQOB
                  ? baseVal > 0
                    ? Math.min(100, Math.round((val / baseVal) * 100))
                    : 0
                  : Math.min(100, Math.round((val / (kpi.target || 1)) * 100));
                const step = kpi.unit === "%" ? 5 : 1;

                return (
                  <div key={kpi.key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate" title={kpi.label}>
                      {kpi.label}
                    </span>

                    {isQOB ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => setValueLocal(a.id, kpi.key, parseInt(e.target.value) || 0)}
                          onBlur={() => commit(a.id, kpi.key, val, baseVal || undefined)}
                          placeholder="Qtd"
                          className="w-12 h-7 rounded-md bg-muted/30 border border-border/30 text-center text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary/50"
                        />
                        <span className="text-[10px] text-muted-foreground">/</span>
                        <input
                          type="number"
                          min={1}
                          value={baseVal || ""}
                          onChange={(e) => setBaseValueLocal(a.id, kpi.key, parseInt(e.target.value) || 0)}
                          onBlur={() => {
                            const newBase = getBaseValue(a.id, kpi.key);
                            if (newBase > 0) commit(a.id, kpi.key, val, newBase);
                          }}
                          placeholder="Lista"
                          className="w-12 h-7 rounded-md bg-muted/30 border border-border/30 text-center text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary/50"
                        />
                        <span className="text-xs font-mono font-bold text-primary min-w-[32px] text-right">
                          {pct}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const next = Math.max(0, val - step);
                            setValueLocal(a.id, kpi.key, next);
                            commit(a.id, kpi.key, next);
                          }}
                          className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          max={kpi.unit === "%" ? 100 : 999}
                          value={val}
                          onChange={(e) => setValueLocal(a.id, kpi.key, parseInt(e.target.value) || 0)}
                          onBlur={() => commit(a.id, kpi.key, val)}
                          className="w-14 h-7 rounded-md bg-muted/30 border border-border/30 text-center text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary/50"
                        />

                        <button
                          onClick={() => {
                            const next = val + step;
                            setValueLocal(a.id, kpi.key, next);
                            commit(a.id, kpi.key, next);
                          }}
                          className="w-7 h-7 rounded-md bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {!isQOB && (
                      <span className="text-[10px] text-muted-foreground">
                        / {kpi.target}
                        {kpi.unit}
                      </span>
                    )}

                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 80 ? "bg-success" : pct >= 50 ? "bg-chart-orange" : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* Seção: Cronograma do dia */}
                  {kpisForDay.length > 0 && (
                    <>
                      {extraKpisForDay.length > 0 && (
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                          📅 Cronograma do dia
                        </div>
                      )}
                      <div className="space-y-2">
                        {kpisForDay.map(renderKpiRow)}
                      </div>
                    </>
                  )}

                  {/* Seção: Outros KPIs (fora do cronograma oficial) */}
                  {extraKpisForDay.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-3 pt-3 mb-1.5 border-t border-border/20">
                        ⊕ Outros KPIs
                      </div>
                      <div className="space-y-2">
                        {extraKpisForDay.map(renderKpiRow)}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegistrationPanel;
