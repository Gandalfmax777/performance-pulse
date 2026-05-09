import { useCallback } from "react";
import { format } from "date-fns";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import TournamentCard from "@/components/dashboard/TournamentCard";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { SectionCard } from "@/components/shared";
import { useActiveTournaments } from "@/hooks/useTournaments";

/**
 * /torneio — torneios ativos (lista de cards).
 *
 * Substitui o redirect placeholder /torneio → /?view=tournament criado
 * na PR #3. Adota AppShellLayout (PR #4) e renderiza um grid de
 * TournamentCard para cada torneio retornado por useActiveTournaments.
 *
 * Title/subtitle do topbar refletem o torneio ativo (roundLabel +
 * mês/scope); empty state (sem torneios) usa SectionCard.
 */
const Torneio = () => {
  const { data: tournaments = [] } = useActiveTournaments();

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  // Title/subtitle do topbar — espelham o primeiro torneio ativo (mesma
  // lógica que o Index legacy aplicava para view === "tournament").
  // ApiTournament vem tipado do hook (roundLabel, startDate, scope são
  // garantidos), então não precisa de cast.
  const first = tournaments[0];

  let title = "Torneio";
  let subtitle: string | undefined = "Sem torneio ativo no momento.";
  if (first) {
    title = first.roundLabel ?? "Torneio";
    if (first.startDate) {
      const monthLabel = format(new Date(first.startDate), "MMMM");
      const monthCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      subtitle = `${monthCap} · ${first.scope === "INDIVIDUAL" ? "Individual" : "Por squad"}`;
    } else {
      subtitle = first.scope === "INDIVIDUAL" ? "Individual" : "Por squad";
    }
  }

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
          onMenuClick={openMobileNav}
        />
      )}
    >
      {tournaments.length === 0 ? (
        <SectionCard className="text-center">
          <p className="text-ink-3 text-sm py-6">
            Sem torneio ativo no momento.
          </p>
        </SectionCard>
      ) : (
        <div
          className={`grid gap-4 ${
            tournaments.length === 1
              ? "grid-cols-1"
              : "grid-cols-1 xl:grid-cols-2"
          }`}
        >
          {tournaments.map((tour) => (
            <TournamentCard key={tour.id} tournament={tour} />
          ))}
        </div>
      )}
    </AppShellLayout>
  );
};

export default Torneio;
