import { Suspense, lazy, useCallback, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import TeamScreen from "@/components/dashboard/TeamScreen";
import AssessorProfile from "@/components/dashboard/AssessorProfile";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { useAssessors } from "@/hooks/useAssessors";

const AssessorManager = lazy(
  () => import("@/components/dashboard/AssessorManager"),
);

/**
 * /assessores — grid de cards da mesa + modais (CRUD via AssessorManager,
 * detalhe via AssessorProfile).
 *
 * Substitui o redirect placeholder /assessores → /?view=team criado na
 * PR #3. Adota AppShellLayout (PR #4); modais são state local da página
 * (eram do Index legacy).
 *
 * O botão "Gerenciar" vai no slot `actions` do topbar (alinhado com o
 * teamManageBtn do Index legacy). AssessorManager é lazy porque só
 * carrega quando o admin abre.
 */
const Assessores = () => {
  const { assessors, addAssessor, removeAssessor } = useAssessors();
  const [showManager, setShowManager] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<
    Parameters<typeof AssessorProfile>[0]["assessor"] | null
  >(null);

  const openTv = useCallback(() => {
    window.open("/tv", "_blank", "noopener,noreferrer");
  }, []);

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const teamManageBtn = (
    <button
      onClick={() => setShowManager(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-ink text-white text-xs font-semibold hover:bg-ink/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus size={14} weight="bold" />
      Gerenciar
    </button>
  );

  return (
    <>
      <AppShellLayout
        sidebarView="team"
        onEnterTv={openTv}
        onEnterPresentation={openPresentation}
        renderTopbar={({ openMobileNav }) => (
          <DashboardTopbar
            eyebrow="ADMINISTRAÇÃO"
            title="Assessores"
            subtitle={`Gerencie a mesa · ${assessors.length} ativos`}
            actions={teamManageBtn}
            onMenuClick={openMobileNav}
          />
        )}
      >
        <TeamScreen
          assessors={assessors}
          onSelectAssessor={(a) => setSelectedProfile(a)}
          onManage={() => setShowManager(true)}
        />
      </AppShellLayout>

      {/* Modais top-level — irmãos do shell. */}
      {selectedProfile && (
        <AssessorProfile
          assessor={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {showManager && (
        <Suspense fallback={null}>
          <AssessorManager
            assessors={assessors}
            onAdd={addAssessor}
            onRemove={removeAssessor}
            onClose={() => setShowManager(false)}
          />
        </Suspense>
      )}
    </>
  );
};

export default Assessores;
