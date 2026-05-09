/**
 * Gestão de sons dos KPIs (admin).
 *
 * Separada de AdminGoals (bug #10 refinement): regra de pontuação + meta
 * ficam lá; som customizado fica aqui. Evita poluir o EditKpiDialog com
 * 3 contextos diferentes.
 *
 * Cada KPI tem uma linha com: nome + status (som cadastrado? ativado?
 * broadcast?) + ações (upload/toggle/remover). Tudo inline — não precisa
 * de dialog pra cada KPI.
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  CircleNotch,
  SpeakerHigh as Volume2,
  UploadSimple as Upload,
  Trash as Trash2,
  SpeakerSimpleSlash as VolumeX,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import {
  useUploadKpiSound,
  useUpdateKpiSound,
  useDeleteKpiSound,
  type ApiKpi,
} from "@/hooks/useKpis";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AdminSounds() {
  // Lista TODOS os KPIs (inclusive inativos) pra dar visibilidade completa
  // dos sons existentes no sistema. Reusa mesmo queryKey que useKpis.
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: () => apiFetch<ApiKpi[]>("/kpis"),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-3 mb-1">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink leading-none flex items-center gap-2">
          <Volume2 size={20} weight="fill" className="text-eqi" />
          Sons dos KPIs
        </h1>
        <p className="text-[12px] text-ink-3 mt-1.5 max-w-2xl">
          Carregue um arquivo MP3/WAV (até 2MB) por KPI. Quando marcado como{" "}
          <strong className="text-ink">broadcast</strong>, o som toca em todos
          dispositivos conectados (TV + dashboards abertos) assim que alguém registra o evento.
        </p>
      </div>

      {/* Lista */}
      <div className="rounded-[14px] border border-line bg-card divide-y divide-line">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <CircleNotch size={20} className="animate-spin text-ink-3" />
          </div>
        )}
        {kpis?.map((kpi) => (
          <KpiSoundRow key={kpi.id} kpi={kpi} />
        ))}
        {kpis && kpis.length === 0 && (
          <p className="text-sm text-ink-3 text-center py-12">
            Nenhum KPI cadastrado ainda.
          </p>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-lg bg-eqi/5 border border-eqi/20 p-4 space-y-2">
        <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <Volume2 size={16} weight="fill" /> Como funciona
        </h3>
        <ul className="text-xs text-ink-3 space-y-1 list-disc list-inside">
          <li>
            <strong>Ativar som</strong>: liga/desliga sem perder o arquivo. Útil
            pra silenciar temporariamente.
          </li>
          <li>
            <strong>Broadcast</strong>: quando marcado, o som toca em TODAS as
            telas conectadas (laptop, TV, abas extras). Sem broadcast, o som
            fica desativado pra esse KPI.
          </li>
          <li>
            KPIs sem som cadastrado ficam <strong>silenciosos</strong> — não há
            fallback sintético.
          </li>
          <li>
            O arquivo é guardado no R2 e servido via URL pública. Trocar o
            arquivo substitui o anterior automaticamente.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Linha por KPI ──────────────────────────────────────────────────────────

function KpiSoundRow({ kpi }: { kpi: ApiKpi }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadKpiSound();
  const update = useUpdateKpiSound();
  const remove = useDeleteKpiSound();

  const sound = kpi.sound;
  const busy = upload.isPending || update.isPending || remove.isPending;

  const [expanded, setExpanded] = useState(false);

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Arquivo precisa ser áudio (MP3/WAV/OGG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo excede 2MB");
      return;
    }
    try {
      await upload.mutateAsync({ kpiId: kpi.id, file });
      toast.success(`Som de ${kpi.label} carregado`);
      setExpanded(true); // abre auto após upload pra Felipe ativar broadcast
    } catch (err) {
      toast.error(`Erro no upload: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggle(field: "enabled" | "broadcast", value: boolean) {
    try {
      await update.mutateAsync({ kpiId: kpi.id, [field]: value });
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover som de "${kpi.label}"? O arquivo será excluído.`)) return;
    try {
      await remove.mutateAsync(kpi.id);
      toast.success("Som removido");
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  // Status visual: verde se tudo ok + broadcast, amarelo se só enabled, cinza
  // se sem som. Indica a visibilidade do estado sem precisar expandir.
  const statusBadge = !sound ? (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-ink-3">
      <VolumeX size={12} /> Sem som
    </span>
  ) : !sound.enabled ? (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-ink-3">
      Desativado
    </span>
  ) : sound.broadcast ? (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success font-semibold">
      <Volume2 size={11} weight="fill" /> Broadcast ativo
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-chart-yellow/20 text-chart-yellow font-semibold">
      Ativo (sem broadcast)
    </span>
  );

  return (
    <div className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Linha compacta */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted/20 flex items-center justify-center">
          <Volume2 size={16} className="text-ink-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              {kpi.label}
            </p>
            {!kpi.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-ink-3">
                inativo
              </span>
            )}
            {statusBadge}
          </div>
          <p className="text-[10px] font-mono text-ink-3">
            {kpi.key}
          </p>
        </div>

        {sound ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              disabled={busy}
            >
              {expanded ? "Fechar" : "Configurar"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {upload.isPending ? (
              <CircleNotch size={14} className="animate-spin mr-1.5" />
            ) : (
              <Upload size={14} className="mr-1.5" />
            )}
            Carregar som
          </Button>
        )}
      </div>

      {/* Painel expandido */}
      {sound && expanded && (
        <div className="mt-4 pl-12 space-y-3">
          {/* Player preview */}
          <div className="p-3 rounded-lg bg-muted/10 border border-line/20">
            <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-2">
              Arquivo atual
            </p>
            <audio controls src={sound.url} className="w-full h-8">
              Seu navegador não suporta áudio.
            </audio>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/10 border border-line/20">
              <Checkbox
                id={`sound-enabled-${kpi.id}`}
                checked={sound.enabled}
                disabled={busy}
                onCheckedChange={(v) => handleToggle("enabled", Boolean(v))}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor={`sound-enabled-${kpi.id}`}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Ativar som
                </Label>
                <p className="text-[10px] text-ink-3 mt-0.5">
                  Quando desativado, nada toca — mesmo com arquivo carregado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/10 border border-line/20">
              <Checkbox
                id={`sound-broadcast-${kpi.id}`}
                checked={sound.broadcast}
                disabled={busy || !sound.enabled}
                onCheckedChange={(v) => handleToggle("broadcast", Boolean(v))}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor={`sound-broadcast-${kpi.id}`}
                  className={`text-xs font-semibold cursor-pointer ${
                    !sound.enabled ? "text-ink-3" : ""
                  }`}
                >
                  Broadcast (todos dispositivos)
                </Label>
                <p className="text-[10px] text-ink-3 mt-0.5">
                  Toca em TV + laptop + qualquer dashboard aberto ao mesmo
                  tempo.
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {upload.isPending ? (
                <CircleNotch size={14} className="animate-spin mr-1.5" />
              ) : (
                <Upload size={14} className="mr-1.5" />
              )}
              Trocar arquivo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={busy}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} className="mr-1.5" />
              Remover som
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
