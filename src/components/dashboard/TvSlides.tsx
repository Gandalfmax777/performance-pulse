/**
 * Performance Pulse — Modo TV redesign (8 slides editoriais).
 *
 * Implementa fielmente o blueprint `tv-slides.jsx` do design v3:
 * tipografia gigante (até 156px), grid forte com linhas finas 1px,
 * números em monospace tabular, lots of negative space.
 *
 * Cada slide é parametrizado por tenant ("bdn" | "eqi") e period
 * ("weekly" | "monthly"). O tenant troca apenas TOKENS DE COR + FONTE
 * DISPLAY via CSS custom props inline.
 *
 * Dados vêm dos hooks reais (não mock); fallback pra valores neutros
 * quando carregando.
 */

import { nowInAppTz } from "@/lib/dates";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Assessor } from "@/types/assessor";
import { useOverviewReport, useActiveTvPeriod } from "@/hooks/useReports";
import { useWeeklyRanking, useMonthlyRanking } from "@/hooks/useRankings";
import { useActiveTournaments, type ApiTournament } from "@/hooks/useTournaments";
import { useTeamInsightHistory } from "@/hooks/useInsight";
import { TENANTS, type TenantSlug } from "@/config/tenants";

// ─── TENANT ───────────────────────────────────────────────────────────────
// Paleta vive em `src/index.css` sob `.dark[data-tenant="<slug>"]` (single
// source of truth — DESIGN.md § Tenant Mirror Rule). Metadados (label, font
// tuning) vivem em `src/config/tenants.ts` → `TENANTS[slug].tv`.

type Tenant = TenantSlug;

function tenantStyle(tenant: Tenant): CSSProperties {
  // Adapter pros componentes existentes: aliases `--tv-*` continuam válidos
  // mas lêem a paleta dark do tenant ativo via `hsl(var(--*))`. Quem aplica
  // `<html class="dark" data-tenant=...>` é o `Tv.tsx`.
  const tv = TENANTS[tenant].tv;
  return {
    "--tv-bg": "hsl(var(--background))",
    "--tv-surface": "hsl(var(--card))",
    "--tv-surface-2": "hsl(var(--surface-2))",
    "--tv-line": "hsl(var(--border))",
    "--tv-line-2": "hsl(var(--line-2))",
    "--tv-ink": "hsl(var(--foreground))",
    "--tv-ink-2": "hsl(var(--ink-2))",
    "--tv-ink-3": "hsl(var(--ink-3))",
    "--tv-ink-4": "hsl(var(--ink-4))",
    "--tv-accent": "hsl(var(--primary))",
    "--tv-accent-2": "hsl(var(--accent-foreground))",
    "--tv-success": "hsl(var(--success))",
    "--tv-warning": "hsl(var(--warning))",
    "--tv-danger": "hsl(var(--destructive))",
    "--tv-font-display": "'Archivo', system-ui, sans-serif",
    "--tv-display-weight": tv.displayWeight,
    "--tv-display-letter": tv.displayLetter,
  } as CSSProperties;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function pctDelta(curr: number, prev: number): number | null {
  return prev > 0 ? ((curr - prev) / prev) * 100 : null;
}

type Period = "weekly" | "monthly";

function rangeForPeriod(period: Period): { from: string; to: string; label: string } {
  const now = nowInAppTz();
  const fmtD = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "monthly") {
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return {
      from: fmtD(s),
      to: fmtD(e),
      label: format(now, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase()),
    };
  }
  const s = startOfWeek(now, { weekStartsOn: 1 });
  const e = endOfWeek(now, { weekStartsOn: 1 });
  return {
    from: fmtD(s),
    to: fmtD(e),
    label: `Semana de ${format(s, "dd/MM")} a ${format(e, "dd/MM")}`,
  };
}

/** Label do header a partir de um range resolvido (YYYY-MM-DD). */
function labelForRange(from: string, to: string, period: Period): string {
  // Parse local (sufixo T00:00:00) pra o dd/MM bater com o range exibido.
  const s = new Date(`${from}T00:00:00`);
  const e = new Date(`${to}T00:00:00`);
  if (period === "monthly") {
    return format(s, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase());
  }
  return `Semana de ${format(s, "dd/MM")} a ${format(e, "dd/MM")}`;
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────

interface DisplayProps {
  children: React.ReactNode;
  size?: number;
  weight?: number;
  lh?: number;
  style?: CSSProperties;
}

function Display({ children, size = 120, weight, lh = 0.92, style }: DisplayProps) {
  return (
    <span
      style={{
        fontFamily: "var(--tv-font-display)",
        fontWeight: weight ?? "var(--tv-display-weight)" as never,
        fontSize: size,
        letterSpacing: "var(--tv-display-letter)",
        lineHeight: lh,
        color: "var(--tv-ink)",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Eyebrow({
  children,
  color = "var(--tv-ink-3)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function TvAvatar({
  initials,
  size = 40,
  accent = false,
}: {
  initials: string;
  size?: number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: accent ? "var(--tv-accent)" : "var(--tv-surface-2)",
        color: accent ? "var(--tv-bg)" : "var(--tv-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
        flexShrink: 0,
        border: accent ? "none" : "1px solid var(--tv-line)",
      }}
    >
      {initials}
    </div>
  );
}

function Delta({ pctVal }: { pctVal: number | null }) {
  if (pctVal === null) {
    return (
      <span
        style={{
          color: "var(--tv-ink-4)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
        }}
      >
        —
      </span>
    );
  }
  const up = pctVal > 1;
  const down = pctVal < -1;
  const color = up ? "var(--tv-success)" : down ? "var(--tv-danger)" : "var(--tv-ink-3)";
  const arrow = up ? "▲" : down ? "▼" : "—";
  return (
    <span
      style={{
        color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      {arrow} {pctVal >= 0 ? "+" : ""}
      {pctVal.toFixed(1)}%
    </span>
  );
}

// ─── CHROME (header + body + footer) ──────────────────────────────────────

interface ChromeProps {
  tenant: Tenant;
  /** Logo do tenant (R2). Quando presente, substitui o quadrado-com-letra
   *  no header. Fluxo: Tv.tsx busca via usePublicTenantBrand → passa pro
   *  TvSlides → chega aqui. */
  logoUrl?: string | null;
  rangeLabel: string;
  slideTitle: string;
  slideIdx: number;
  slideCount: number;
  children: React.ReactNode;
}

function Chrome({ tenant, logoUrl, rangeLabel, slideTitle, slideIdx, slideCount, children }: ChromeProps) {
  const t = TENANTS[tenant].tv;
  return (
    <div
      style={{
        ...tenantStyle(tenant),
        background: "var(--tv-bg)",
        color: "var(--tv-ink)",
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top chrome */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          borderBottom: "1px solid var(--tv-line-2)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--tv-ink-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              // Logo: fundo branco neutro (TvSlides tem bg escuro var(--tv-bg)),
              // garante contraste pra logos pretos. Sem logo, var(--tv-accent).
              background: logoUrl ? "#fff" : "var(--tv-accent)",
              color: "var(--tv-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--tv-font-display)",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "-0.04em",
              overflow: "hidden",
              padding: logoUrl ? 2 : 0,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={t.label}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              t.label[0]
            )}
          </div>
          <span>Performance Pulse</span>
          <span style={{ color: "var(--tv-ink-4)" }}>·</span>
          <span>{t.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span>{rangeLabel}</span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          position: "absolute",
          top: 56,
          bottom: 56,
          left: 0,
          right: 0,
          padding: "0 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1600 }}>{children}</div>
      </div>

      {/* Bottom — slide footer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          borderTop: "1px solid var(--tv-line-2)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--tv-ink-3)",
        }}
      >
        <span style={{ color: "var(--tv-ink-2)" }}>{slideTitle}</span>
        <span>
          <span style={{ color: "var(--tv-accent)" }}>
            {String(slideIdx + 1).padStart(2, "0")}
          </span>
          <span style={{ color: "var(--tv-ink-4)" }}>
            {" "}
            / {String(slideCount).padStart(2, "0")}
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── DATA HOOK (consolidado) ──────────────────────────────────────────────

interface SlideData {
  /** Label do período resolvido (ex: "Semana de 25/05 a 31/05") pro header. */
  rangeLabel: string;
  totalPoints: number;
  avgGoalPct: number;
  teamSize: number;
  kpis: Array<{ key: string; label: string; actual: number; target: number; prev: number }>;
  ranked: Array<{
    id: string;
    name: string;
    initials: string;
    points: number;
    goalPct: number;
    streak: number;
  }>;
  tournaments: ApiTournament[];
  teamInsightMd: string | null;
  /** true quando as queries de dados do slide estão em erro (backend fora). */
  connectionError: boolean;
}

function useTvSlideData(period: Period, assessors: Assessor[]): SlideData {
  // Período resolvido pelo backend = semana/mês da métrica mais recente. Evita
  // a TV ficar vazia no início da semana. Enquanto carrega, usa a semana atual.
  const fallbackRange = useMemo(() => rangeForPeriod(period), [period]);
  const { data: activePeriod } = useActiveTvPeriod(period);
  const range = useMemo(() => {
    if (activePeriod?.from && activePeriod?.to) {
      return {
        from: activePeriod.from,
        to: activePeriod.to,
        label: labelForRange(activePeriod.from, activePeriod.to, period),
      };
    }
    return fallbackRange;
  }, [activePeriod, fallbackRange, period]);
  // Range anterior shifted back pelo mesmo intervalo
  const prevRange = useMemo(() => {
    const d = new Date(range.from);
    if (period === "weekly") {
      const s = startOfWeek(new Date(d.getTime() - 7 * 86400000), { weekStartsOn: 1 });
      const e = endOfWeek(new Date(d.getTime() - 7 * 86400000), { weekStartsOn: 1 });
      return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd") };
    }
    const s = startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const e = endOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd") };
  }, [range, period]);

  const overviewQ = useOverviewReport(range);
  const overview = overviewQ.data;
  const { data: prevOverview } = useOverviewReport(prevRange);
  // Passa o início do período resolvido pros rankings (default seria a semana
  // atual). Mantém ranking e overview no MESMO período exibido no header.
  const weeklyQ = useWeeklyRanking({ start: range.from, enabled: period === "weekly" });
  const monthlyQ = useMonthlyRanking({ start: range.from, enabled: period === "monthly" });
  const activeRanking = period === "weekly" ? weeklyQ.data : monthlyQ.data;
  // Sinaliza desconexão quando as queries principais do slide erram (backend
  // fora). O Tanstack segue retentando → quando volta, o indicador some sozinho.
  // failureCount > 0 sinaliza já durante as tentativas (não só após o erro
  // final), pra TV mostrar "Reconectando" rápido. Reseta a 0 quando volta.
  const activeRankingQ = period === "weekly" ? weeklyQ : monthlyQ;
  const connectionError =
    overviewQ.isError ||
    activeRankingQ.isError ||
    overviewQ.failureCount > 0 ||
    activeRankingQ.failureCount > 0;
  const { data: tournaments = [] } = useActiveTournaments();
  const { data: insightHistory } = useTeamInsightHistory(
    period === "weekly" ? "WEEK" : "MONTH",
    1,
  );

  return useMemo<SlideData>(() => {
    const rankings = activeRanking?.rankings ?? [];
    const totalPoints = rankings.reduce((s, r) => s + (r.rollup.points ?? 0), 0);
    const goalPcts = rankings.map((r) => r.rollup.weeklyGoalPercent ?? 0);
    const avgGoalPct =
      goalPcts.length > 0
        ? Math.round(goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length)
        : 0;

    const prevByKey = new Map<string, number>();
    for (const k of prevOverview?.byKpi ?? []) prevByKey.set(k.key, k.actual);
    const kpis = (overview?.byKpi ?? []).map((k) => ({
      key: k.key,
      label: k.label,
      actual: k.actual,
      target: k.target,
      prev: prevByKey.get(k.key) ?? 0,
    }));

    const assessorById = new Map(assessors.map((a) => [a.id, a]));
    const ranked = rankings.map((r) => {
      const a = assessorById.get(r.assessor.id);
      const initials =
        a?.avatar ??
        r.assessor.initials ??
        r.assessor.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
      return {
        id: r.assessor.id,
        name: r.assessor.name,
        initials,
        points: r.rollup.points,
        goalPct: r.rollup.weeklyGoalPercent,
        streak: r.rollup.streak,
      };
    });

    return {
      rangeLabel: range.label,
      totalPoints,
      avgGoalPct,
      teamSize: rankings.length || assessors.length,
      kpis,
      ranked,
      tournaments,
      teamInsightMd: insightHistory?.items?.[0]?.summary ?? insightHistory?.items?.[0]?.textMarkdown ?? null,
      connectionError,
    };
  }, [range, overview, prevOverview, activeRanking, assessors, tournaments, insightHistory, connectionError]);
}

// ─── SLIDES ──────────────────────────────────────────────────────────────

function SlideCover({ tenant, period, data }: { tenant: Tenant; period: Period; data: SlideData }) {
  const t = TENANTS[tenant].tv;
  return (
    <div>
      <Eyebrow>
        {period === "weekly" ? "Relatório semanal" : "Relatório mensal"} — {t.fullName}
      </Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Display size={156} lh={0.86}>
          Performance
        </Display>
        <Display size={156} lh={0.86} style={{ color: "var(--tv-accent)" }}>
          Pulse.
        </Display>
      </div>
      <div
        style={{
          marginTop: 56,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: "1px solid var(--tv-line)",
          paddingTop: 32,
          gap: 32,
        }}
      >
        {[
          { l: "Total de pontos", v: fmt(data.totalPoints) },
          { l: "Média de meta atingida", v: `${data.avgGoalPct}%` },
          { l: "Time", v: `${data.teamSize} AAIs` },
        ].map((s) => (
          <div key={s.l}>
            <Eyebrow>{s.l}</Eyebrow>
            <Display size={64}>{s.v}</Display>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideHighlights({ period, data }: { tenant: Tenant; period: Period; data: SlideData }) {
  const kpis = data.kpis.slice(0, 6);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 48,
        }}
      >
        <div>
          <Eyebrow>Destaques do período</Eyebrow>
          <Display size={72}>O que mudou.</Display>
        </div>
        <div style={{ textAlign: "right", color: "var(--tv-ink-3)", fontSize: 16, maxWidth: 320 }}>
          Comparativo com {period === "weekly" ? "a semana passada" : "o mês passado"}.
          Variação calculada sobre o real, não sobre a meta.
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: "1px solid var(--tv-line)",
        }}
      >
        {kpis.map((k, i) => {
          const p = pctDelta(k.actual, k.prev);
          return (
            <div
              key={k.key}
              style={{
                padding: "32px 24px",
                borderBottom: i < 3 ? "1px solid var(--tv-line)" : "none",
                borderRight: i % 3 < 2 ? "1px solid var(--tv-line)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--tv-ink-3)",
                  marginBottom: 16,
                }}
              >
                {k.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <Display size={64} lh={1}>
                  {fmt(k.actual)}
                </Display>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "var(--tv-ink-3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                }}
              >
                <Delta pctVal={p} />
                <span>vs {fmt(k.prev)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlidePodium({ data }: { tenant: Tenant; data: SlideData }) {
  const top3 = data.ranked.slice(0, 3);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 56,
        }}
      >
        <div>
          <Eyebrow>Top 3 do período</Eyebrow>
          <Display size={72}>Pódio.</Display>
        </div>
        <div style={{ color: "var(--tv-ink-3)", fontSize: 16, maxWidth: 320, textAlign: "right" }}>
          Pontuação composta: KPIs ponderados + bonificações de torneio.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          borderTop: "1px solid var(--tv-line)",
        }}
      >
        {top3.map((a, i) => (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 80px 1fr 200px 180px",
              alignItems: "center",
              padding: "32px 0",
              borderBottom: "1px solid var(--tv-line)",
              gap: 24,
            }}
          >
            <Display
              size={120}
              lh={1}
              weight={i === 0 ? 900 : undefined}
              style={{ color: i === 0 ? "var(--tv-accent)" : "var(--tv-ink-2)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </Display>
            <TvAvatar initials={a.initials} size={64} accent={i === 0} />
            <div>
              <Display size={40} lh={1}>
                {a.name}
              </Display>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--tv-ink-3)",
                }}
              >
                {a.streak > 0 ? `Streak ${a.streak} dias` : "Sem streak"} · Meta {a.goalPct}%
              </div>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--tv-surface-2)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  right: "auto",
                  width: `${Math.min(100, a.goalPct)}%`,
                  background: i === 0 ? "var(--tv-accent)" : "var(--tv-accent-2)",
                }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <Display
                size={56}
                lh={1}
                style={{ color: i === 0 ? "var(--tv-accent)" : "var(--tv-ink)" }}
              >
                {fmt(a.points)}
              </Display>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--tv-ink-3)",
                }}
              >
                pontos
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideKpis({ data }: { tenant: Tenant; data: SlideData }) {
  const kpis = data.kpis.slice(0, 6);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 48,
        }}
      >
        <div>
          <Eyebrow>KPIs do período</Eyebrow>
          <Display size={72}>Meta vs real.</Display>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--tv-line)" }}>
        {kpis.map((k) => {
          const p = k.target > 0 ? Math.round((k.actual / k.target) * 100) : 0;
          const onTrack = p >= 100;
          const close = p >= 80;
          return (
            <div
              key={k.key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 200px 1fr 100px",
                alignItems: "center",
                padding: "20px 0",
                gap: 32,
                borderBottom: "1px solid var(--tv-line)",
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>
                  {k.label}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  color: "var(--tv-ink-3)",
                }}
              >
                {fmt(k.actual)} / {fmt(k.target)}
              </div>
              <div style={{ height: 4, background: "var(--tv-surface-2)", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    right: "auto",
                    width: `${Math.min(100, p)}%`,
                    background: onTrack
                      ? "var(--tv-accent)"
                      : close
                      ? "var(--tv-accent-2)"
                      : "var(--tv-danger)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "100%",
                    top: -6,
                    bottom: -6,
                    width: 1,
                    background: "var(--tv-ink-4)",
                  }}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <Display
                  size={36}
                  lh={1}
                  style={{ color: onTrack ? "var(--tv-accent)" : "var(--tv-ink)" }}
                >
                  {p}%
                </Display>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RANKING_COL_LABEL: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--tv-ink-3)",
};

function SlideRanking({ data }: { tenant: Tenant; data: SlideData }) {
  const top10 = data.ranked.slice(0, 10);
  const rest = data.ranked.slice(10);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <Eyebrow>Ranking completo · Top 10 + também competindo</Eyebrow>
          <Display size={64}>Ranking.</Display>
        </div>
      </div>
      {/* Header de colunas — dá contexto pros números sem repetir "meta"/"pontos" linha a linha. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 48px 1fr 220px 120px",
          gap: 24,
          padding: "0 0 10px",
          borderBottom: "1px solid var(--tv-line)",
        }}
      >
        <div />
        <div />
        <div />
        <div style={RANKING_COL_LABEL}>Meta</div>
        <div style={{ ...RANKING_COL_LABEL, textAlign: "right" }}>Pontos</div>
      </div>
      <div>
        {top10.map((a, i) => {
          const top1 = i === 0;
          const hitGoal = a.goalPct >= 100;
          const barColor = hitGoal || top1 ? "var(--tv-accent)" : "var(--tv-accent-2)";
          return (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 48px 1fr 220px 120px",
                alignItems: "center",
                padding: "16px 0",
                gap: 24,
                borderBottom: "1px solid var(--tv-line)",
              }}
            >
              <Display
                size={30}
                lh={1}
                weight={top1 ? 900 : undefined}
                style={{ color: i < 3 ? "var(--tv-accent)" : "var(--tv-ink-3)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </Display>
              <TvAvatar initials={a.initials} size={38} accent={top1} />
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}>
                {a.name}
              </div>
              {/* Meta: valor + barra de progresso (scan visual instantâneo). */}
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    marginBottom: 6,
                    color: hitGoal ? "var(--tv-accent)" : "var(--tv-ink-3)",
                  }}
                >
                  {a.goalPct}%
                </div>
                <div style={{ height: 6, background: "var(--tv-surface-2)", position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      right: "auto",
                      width: `${Math.min(100, Math.max(0, a.goalPct))}%`,
                      background: barColor,
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Display
                  size={32}
                  lh={1}
                  weight={top1 ? 900 : 800}
                  style={{ color: top1 ? "var(--tv-accent)" : "var(--tv-ink)" }}
                >
                  {fmt(a.points)}
                </Display>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--tv-ink-3)",
              marginBottom: 12,
            }}
          >
            Também competindo
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {rest.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: "1px solid var(--tv-line)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "var(--tv-ink-3)",
                    width: 24,
                  }}
                >
                  {String(11 + i).padStart(2, "0")}
                </span>
                <TvAvatar initials={a.initials} size={26} />
                <span
                  style={{
                    fontSize: 13,
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {a.name}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "var(--tv-ink-3)",
                  }}
                >
                  {fmt(a.points)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlideTournaments({ data }: { tenant: Tenant; data: SlideData }) {
  const active = data.tournaments.filter((t) => t.status === "ACTIVE").slice(0, 2);
  const finished = data.tournaments.filter((t) => t.status === "FINISHED").slice(0, 4);

  if (active.length === 0 && finished.length === 0) {
    return (
      <div>
        <Eyebrow>Torneios do período</Eyebrow>
        <Display size={72}>Em jogo.</Display>
        <div
          style={{
            marginTop: 32,
            color: "var(--tv-ink-3)",
            fontSize: 18,
            paddingTop: 32,
            borderTop: "1px solid var(--tv-line)",
          }}
        >
          Sem torneios ativos no momento.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <Eyebrow>Torneios do período</Eyebrow>
          <Display size={72}>Em jogo.</Display>
        </div>
      </div>

      {active.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: active.length === 1 ? "1fr" : "1fr 1fr",
            gap: 24,
            borderTop: "1px solid var(--tv-line)",
            paddingTop: 32,
          }}
        >
          {active.map((t) => {
            const sorted = [...t.participants].sort(
              (a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0),
            );
            const leader = sorted[0];
            return (
              <div key={t.id} style={{ borderTop: "2px solid var(--tv-accent)", paddingTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8,
                  }}
                >
                  <Eyebrow color="var(--tv-accent)">Ativo</Eyebrow>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: "var(--tv-ink-3)",
                    }}
                  >
                    {format(parseISO(t.startDate), "dd/MM")} →{" "}
                    {format(parseISO(t.endDate), "dd/MM")} ·{" "}
                    {t.scope === "INDIVIDUAL" ? "Individual" : "Squads"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    marginBottom: 16,
                  }}
                >
                  {t.roundLabel}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Eyebrow>Premiação total</Eyebrow>
                  <Display size={48} lh={1} style={{ color: "var(--tv-accent)" }}>
                    R$ {fmt(t.totalPrizePool)}
                  </Display>
                </div>
                {leader && (
                  <div style={{ paddingTop: 16, borderTop: "1px solid var(--tv-line)" }}>
                    <Eyebrow>Liderando</Eyebrow>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 500 }}>{leader.displayName}</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 18,
                          color: "var(--tv-ink)",
                        }}
                      >
                        {fmt(leader.finalScore ?? 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {finished.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--tv-line)" }}>
          <Eyebrow>Finalizados recentes</Eyebrow>
          {finished.map((f) => {
            const champion = [...f.participants].sort(
              (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
            )[0];
            return (
              <div
                key={f.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 80px",
                  padding: "12px 0",
                  gap: 16,
                  alignItems: "baseline",
                  borderBottom: "1px solid var(--tv-line)",
                }}
              >
                <div style={{ fontSize: 17, color: "var(--tv-ink-2)" }}>{f.roundLabel}</div>
                <div style={{ fontSize: 17, color: "var(--tv-ink)" }}>
                  {champion?.displayName ?? "—"}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: "var(--tv-accent)",
                  }}
                >
                  R$ {fmt(f.totalPrizePool)}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "var(--tv-ink-3)",
                  }}
                >
                  {f.finishedAt ? format(parseISO(f.finishedAt), "dd/MM") : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SlideAi({ data }: { tenant: Tenant; data: SlideData }) {
  const text =
    data.teamInsightMd?.trim() ||
    "Análise IA ainda não foi gerada para este período. Acesse o dashboard /kpis e clique em 'Re-gerar' para criar a primeira análise.";
  const sentences = text.split(/(?<=\.) /);
  const grouped = [
    sentences.slice(0, 1).join(" "),
    sentences.slice(1, 2).join(" "),
    sentences.slice(2, 3).join(" "),
    sentences.slice(3).join(" "),
  ].filter(Boolean);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 64 }}>
      <div>
        <Eyebrow>Análise IA</Eyebrow>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--tv-ink-3)",
          }}
        >
          Gemini Flash
          <br />
          <span style={{ color: "var(--tv-ink-4)" }}>
            {format(new Date(), "dd/MM/yyyy")}
          </span>
        </div>
        <div style={{ marginTop: 24, height: 1, background: "var(--tv-line)" }} />
        <div
          style={{
            marginTop: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--tv-ink-4)",
            lineHeight: 1.8,
          }}
        >
          Tópicos
          <br />
          <span style={{ color: "var(--tv-ink-3)" }}>· Driver da semana</span>
          <br />
          <span style={{ color: "var(--tv-ink-3)" }}>· Macro do time</span>
          <br />
          <span style={{ color: "var(--tv-ink-3)" }}>· Atenção</span>
          <br />
          <span style={{ color: "var(--tv-ink-3)" }}>· Recomendação</span>
        </div>
      </div>

      <div>
        <Display size={56} lh={0.95} style={{ marginBottom: 32, color: "var(--tv-ink)" }}>
          {sentences[0] ?? "Sem análise disponível."}
        </Display>
        <div
          style={{
            columns: 2,
            columnGap: 48,
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--tv-ink-2)",
          }}
        >
          {grouped.slice(1).map((g, i) => (
            <p
              key={i}
              style={{ margin: 0, marginBottom: 16, breakInside: "avoid" }}
              dangerouslySetInnerHTML={{
                __html: g.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong style="color: var(--tv-ink); font-weight: 600;">$1</strong>',
                ),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideNext({ data }: { tenant: Tenant; data: SlideData }) {
  const lowKpis = data.kpis
    .filter((k) => k.target > 0 && k.actual / k.target < 1)
    .slice(0, 3);
  const fallbackKpis =
    lowKpis.length > 0 ? lowKpis : data.kpis.slice(0, 3);
  return (
    <div>
      <Eyebrow>Foco da próxima semana · Bloco não-negociável 09:00–11:00</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 64, marginTop: 24 }}>
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--tv-accent)",
              marginBottom: 24,
            }}
          >
            Próximos passos
          </div>
          <Display size={56} lh={1.05} style={{ color: "var(--tv-ink)" }}>
            Manter pressão em captação e revisar NPS.
          </Display>
          <div
            style={{
              marginTop: 32,
              fontSize: 20,
              lineHeight: 1.5,
              color: "var(--tv-ink-2)",
              maxWidth: 720,
            }}
          >
            Bloco diário de ligações 9h–11h é não-negociável. Revisão de NPS pós-call
            todo dia às 16h. Squad líder precisa manter ritmo pra não perder vantagem.
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--tv-line)", paddingLeft: 32 }}>
          <Eyebrow>KPIs alvo</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fallbackKpis.map((k) => (
              <div
                key={k.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--tv-line)",
                }}
              >
                <span style={{ fontSize: 16, color: "var(--tv-ink)" }}>{k.label}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--tv-accent)",
                  }}
                >
                  alvo
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <Eyebrow>Bloco não-negociável</Eyebrow>
            <div
              style={{
                fontFamily: "var(--tv-font-display)",
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: "var(--tv-display-letter)",
                color: "var(--tv-accent)",
              }}
            >
              09:00 — 11:00
            </div>
            <div style={{ fontSize: 14, color: "var(--tv-ink-3)", marginTop: 4 }}>
              Bloco diário de ligações
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTRY ────────────────────────────────────────────────────────────

export interface TvSlideDef {
  id: string;
  title: string;
  Component: React.FC<{ tenant: Tenant; period: Period; data: SlideData }>;
}

export const TV_SLIDES: TvSlideDef[] = [
  { id: "cover",       title: "Capa",            Component: SlideCover },
  { id: "highlights",  title: "Destaques",       Component: SlideHighlights },
  { id: "podium",      title: "Pódio",           Component: SlidePodium },
  { id: "kpis",        title: "KPIs",            Component: SlideKpis },
  { id: "ranking",     title: "Ranking",         Component: SlideRanking },
  { id: "tournaments", title: "Torneios",        Component: SlideTournaments },
  { id: "ai",          title: "Análise IA",      Component: SlideAi },
  { id: "next",        title: "Próximos passos", Component: SlideNext },
];

// ─── ENTRY POINT ─────────────────────────────────────────────────────────

interface TvSlidesProps {
  tenant?: Tenant;
  /** Logo do tenant (R2) pra mostrar no chrome header. Fluxo: Tv.tsx busca
   *  via usePublicTenantBrand → passa aqui. Sem logo, cai pra letra inicial. */
  logoUrl?: string | null;
  period?: Period;
  assessors: Assessor[];
  /** Index do slide atual (controlled). Se não passado, gerencia state local. */
  slideIdx?: number;
}

/**
 * TvSlides — renderiza um slide editorial por vez via Chrome wrapper.
 *
 * Quando `slideIdx` é passado, opera como controlled component (caller
 * gerencia rotação). Quando ausente, faz auto-rotation interna a 15s.
 */
export function TvSlides({
  tenant = "eqi",
  logoUrl,
  period = "weekly",
  assessors,
  slideIdx: ctrlIdx,
}: TvSlidesProps) {
  const [internalIdx, setInternalIdx] = useState(0);
  const slideIdx = ctrlIdx ?? internalIdx;
  const data = useTvSlideData(period, assessors);

  useEffect(() => {
    if (ctrlIdx !== undefined) return; // caller controla
    const id = setInterval(() => {
      setInternalIdx((i) => (i + 1) % TV_SLIDES.length);
    }, 15_000);
    return () => clearInterval(id);
  }, [ctrlIdx]);

  const slide = TV_SLIDES[slideIdx % TV_SLIDES.length];
  const SlideComp = slide.Component;

  return (
    <Chrome
      tenant={tenant}
      logoUrl={logoUrl}
      rangeLabel={data.rangeLabel}
      slideTitle={slide.title}
      slideIdx={slideIdx % TV_SLIDES.length}
      slideCount={TV_SLIDES.length}
    >
      {data.connectionError && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border border-foreground/15 bg-card/90 px-3 py-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          <span className="num text-[11px] uppercase tracking-[0.16em] text-foreground/70">
            Reconectando…
          </span>
        </div>
      )}
      <SlideComp tenant={tenant} period={period} data={data} />
    </Chrome>
  );
}

export default TvSlides;
