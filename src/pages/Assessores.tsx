import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { GearSix, MagnifyingGlass } from "@phosphor-icons/react";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import TeamScreen from "@/components/dashboard/TeamScreen";
import AssessorProfile from "@/components/dashboard/AssessorProfile";
import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssessors } from "@/hooks/useAssessors";
import { useOpenTv } from "@/hooks/useOpenTv";
import { useSquads } from "@/hooks/useSquads";

const AssessorManager = lazy(
  () => import("@/components/dashboard/AssessorManager"),
);

/**
 * /assessores — grid de cards da mesa + modais (CRUD via AssessorManager,
 * detalhe via AssessorProfile).
 *
 * Topbar tem (alinha com `design/Assessores.html`):
 *   • Search input (filtro por nome)
 *   • Select squad (filtro por squad ou "Todos")
 *   • Botão "Gerenciar" (CTA primary)
 *
 * Botão "Gerenciar" inline removido do TeamScreen pra não duplicar.
 */
const Assessores = () => {
  const { assessors, addAssessor, removeAssessor } = useAssessors();
  const { data: squads = [] } = useSquads();
  const [showManager, setShowManager] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<
    Parameters<typeof AssessorProfile>[0]["assessor"] | null
  >(null);

  // Filtros locais (não persistem em URL — feedback rápido de busca)
  const [search, setSearch] = useState("");
  const [squadFilter, setSquadFilter] = useState<string>("all");

  // Map assessorId → squadId (lookup pra filtro)
  const squadByAssessor = useMemo(() => {
    const map = new Map<string, string>();
    for (const sq of squads) {
      for (const m of sq.members ?? []) {
        map.set(m.assessorId, sq.id);
      }
    }
    return map;
  }, [squads]);

  const filteredAssessors = useMemo(() => {
    let rows = assessors;
    if (squadFilter !== "all") {
      rows = rows.filter((a) => squadByAssessor.get(a.id) === squadFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((a) => a.name.toLowerCase().includes(q));
    }
    return rows;
  }, [assessors, squadFilter, squadByAssessor, search]);

  const openTv = useOpenTv();

  const openPresentation = useCallback(() => {
    window.open("/presentation", "_blank", "noopener,noreferrer");
  }, []);

  const searchInput = (
    <div className="relative w-[200px]">
      <MagnifyingGlass
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
      />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar AAI…"
        className="h-9 pl-8 text-[13px]"
      />
    </div>
  );

  const squadSelect = (
    <Select value={squadFilter} onValueChange={setSquadFilter}>
      <SelectTrigger className="w-[160px] h-9 text-[13px]">
        <SelectValue placeholder="Todos squads" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos squads</SelectItem>
        {squads.map((sq) => (
          <SelectItem key={sq.id} value={sq.id}>
            {sq.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const manageBtn = (
    <button
      onClick={() => setShowManager(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-ink text-white text-xs font-semibold hover:bg-ink/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GearSix size={14} weight="bold" />
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
            subtitle={`${filteredAssessors.length} de ${assessors.length} ativos`}
            actions={
              <>
                {searchInput}
                {squadSelect}
                {manageBtn}
              </>
            }
            onMenuClick={openMobileNav}
          />
        )}
      >
        <TeamScreen
          assessors={filteredAssessors}
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
