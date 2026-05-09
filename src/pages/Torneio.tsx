import { useCallback } from "react";
import { format, parseISO } from "date-fns";
import { GearSix } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import TournamentCard from "@/components/dashboard/TournamentCard";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { Eyebrow, SectionCard } from "@/components/shared";
import { useTournaments } from "@/hooks/useTournaments";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * /torneio — alinha com `Torneio.html` do design.
 *
 * Estrutura:
 *   • Topbar com botão "Configurar" (admin → /admin/tournaments)
 *   • Seção "Ativos": grid 2-col de TournamentCard
 *   • Seção "Finalizados": tabela compacta com últimos torneios
 *
 * Empty state quando nenhum torneio em nenhum estado.
 */
const Torneio = () => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const { data: activeTournaments = [] } = useTournaments("ACTIVE");
  const { data: finishedTournaments = [] } = useTournaments("FINISHED");

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const first = activeTournaments[0];

  let title = "Torneios";
  let subtitle: string | undefined = "Em jogo agora.";
  if (first) {
    title = first.roundLabel ?? "Torneio";
    if (first.startDate) {
      const monthLabel = format(new Date(first.startDate), "MMMM");
      const monthCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      subtitle = `${monthCap} · ${first.scope === "INDIVIDUAL" ? "Individual" : "Por squad"}`;
    } else {
      subtitle = first.scope === "INDIVIDUAL" ? "Individual" : "Por squad";
    }
  } else if (finishedTournaments.length > 0) {
    subtitle = "Sem torneio ativo no momento. Histórico abaixo.";
  } else {
    subtitle = "Nenhum torneio cadastrado.";
  }

  const configureBtn = isAdmin ? (
    <button
      type="button"
      onClick={() => navigate("/admin/tournaments")}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink text-xs font-semibold transition-all"
      title="Gerenciar torneios"
    >
      <GearSix size={14} weight="bold" />
      Configurar
    </button>
  ) : null;

  return (
    <AppShellLayout
      sidebarView="tournament"
      onEnterTv={openTv}
      onEnterPresentation={openPresentation}
      renderTopbar={({ openMobileNav }) => (
        <DashboardTopbar
          eyebrow="TORNEIO ATIVO"
          title={title}
          subtitle={subtitle}
          actions={configureBtn}
          onMenuClick={openMobileNav}
        />
      )}
    >
      <div className="flex flex-col gap-6">
        {/* Ativos */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Eyebrow>Ativos</Eyebrow>
            <div className="flex-1 h-px bg-line" />
            <span className="text-[11px] text-ink-3">
              {activeTournaments.length} em jogo
            </span>
          </div>
          {activeTournaments.length === 0 ? (
            <SectionCard className="text-center">
              <p className="text-ink-3 text-[13px] py-6">
                Sem torneio ativo no momento.
              </p>
            </SectionCard>
          ) : (
            <div
              className={`grid gap-4 ${
                activeTournaments.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 xl:grid-cols-2"
              }`}
            >
              {activeTournaments.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour} />
              ))}
            </div>
          )}
        </section>

        {/* Finalizados */}
        {finishedTournaments.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Eyebrow>Finalizados</Eyebrow>
              <div className="flex-1 h-px bg-line" />
              <span className="text-[11px] text-ink-3">
                {finishedTournaments.length}{" "}
                {finishedTournaments.length === 1
                  ? "torneio encerrado"
                  : "torneios encerrados"}
              </span>
            </div>
            <SectionCard bodyless>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-surface-2">
                      <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                        Torneio
                      </th>
                      <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                        Escopo
                      </th>
                      <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                        Período
                      </th>
                      <th className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-left px-3 py-2.5">
                        Campeão
                      </th>
                      <th className="num text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-ink-3 text-right px-3 py-2.5">
                        Premiação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedTournaments.map((t) => {
                      const champion =
                        [...t.participants].sort(
                          (a, b) =>
                            (a.rank ?? 999) - (b.rank ?? 999),
                        )[0];
                      return (
                        <tr
                          key={t.id}
                          className="border-t border-line transition-colors hover:bg-surface-2/60"
                        >
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-ink">
                              {t.roundLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-surface text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-ink-2">
                              {t.scope === "INDIVIDUAL" ? "Individual" : "Squad"}
                            </span>
                          </td>
                          <td className="num text-[12px] text-ink-3 px-3 py-2.5">
                            {format(parseISO(t.startDate), "dd/MM")} →{" "}
                            {format(parseISO(t.endDate), "dd/MM")}
                          </td>
                          <td className="px-3 py-2.5">
                            {champion ? (
                              <span className="text-ink">
                                {champion.displayName}
                              </span>
                            ) : (
                              <span className="text-[11px] text-ink-4">—</span>
                            )}
                          </td>
                          <td className="num text-right px-3 py-2.5">
                            <span className="font-display font-bold text-[15px] text-primary">
                              R${" "}
                              {Number(t.totalPrizePool ?? 0).toLocaleString("pt-BR")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        )}
      </div>
    </AppShellLayout>
  );
};

export default Torneio;
