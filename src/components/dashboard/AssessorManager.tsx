import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Trash2, X, Users, Pencil, Camera, Loader2, Check } from "lucide-react";
import type { Assessor } from "@/types/assessor";
import { AssessorAvatar } from "@/components/ui/AssessorAvatar";
import { apiFetch, apiBaseUrl } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useModalDismiss } from "@/hooks/useModalDismiss";

interface AssessorManagerProps {
  assessors: Assessor[];
  onAdd: (input: { name: string }) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

interface EditingState {
  id: string;
  name: string;
  level: "bronze" | "silver" | "gold";
  totalLeads: number;
  totalClients: number;
  vacationUntil: string; // YYYY-MM-DD ou ""
}

const LEVELS: Array<{ value: "bronze" | "silver" | "gold"; label: string; color: string }> = [
  { value: "bronze", label: "Bronze", color: "text-bronze" },
  { value: "silver", label: "Silver", color: "text-silver" },
  { value: "gold",   label: "Gold",   color: "text-gold" },
];

const AssessorManager = ({ assessors, onAdd, onRemove, onClose }: AssessorManagerProps) => {
  const { onBackdropClick } = useModalDismiss(onClose);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim() });
    setName("");
  };

  const startEdit = (a: Assessor) => {
    setEditing({
      id: a.id,
      name: a.name,
      level: a.level,
      totalLeads: a.totalLeads ?? 0,
      totalClients: a.totalClients ?? 0,
      vacationUntil: a.vacationUntil ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch(`/assessors/${editing.id}`, {
        method: "PATCH",
        body: {
          name: editing.name,
          level: editing.level.toUpperCase(),
          totalLeads: editing.totalLeads,
          totalClients: editing.totalClients,
          vacationUntil: editing.vacationUntil ? editing.vacationUntil : null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["assessors"] });
      toast.success("Assessor atualizado");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = (assessorId: string) => {
    setUploading(assessorId);
    fileInputRef.current?.click();
  };

  // Reduz a imagem pra max 512px no maior lado + JPEG 0.85. Resolve o caso
  // de fotos de celular (3-10MB) que estouravam o limite do backend.
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 512;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas não suportado"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter imagem"))),
          "image/jpeg",
          0.85,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Arquivo inválido"));
      };
      img.src = url;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploading) return;

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Selecione um arquivo de imagem");
      }

      const blob = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");

      const url = `${apiBaseUrl}/assessors/${uploading}/photo`.replace("/api/api/", "/api/");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pp_token")}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let message = `Erro ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
          else if (data?.message) message = data.message;
        } catch {
          // body não é JSON
        }
        throw new Error(message);
      }

      queryClient.invalidateQueries({ queryKey: ["assessors"] });
      toast.success("Foto atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8"
    >
      <div className="card-glass rounded-2xl p-6 w-full max-w-lg mx-4 border border-primary/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Gerenciar Assessores</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add form */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do assessor..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {assessors.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20"
            >
              {/* Avatar com botão de foto */}
              <button
                onClick={() => handlePhotoClick(a.id)}
                className="relative group"
                title="Trocar foto"
              >
                <AssessorAvatar
                  initials={a.avatar}
                  photoUrl={a.photoUrl}
                  level={a.level}
                  size={44}
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Info / Edit form */}
              {editing?.id === a.id ? (
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-muted/30 border border-primary/30 text-sm text-foreground focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        onClick={() => setEditing({ ...editing, level: lvl.value })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                          editing.level === lvl.value
                            ? `${lvl.color} border-current bg-current/10`
                            : "text-muted-foreground border-border/30 hover:border-muted-foreground/50"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">Leads:</span>
                      <input
                        type="number"
                        min={0}
                        value={editing.totalLeads}
                        onChange={(e) => setEditing({ ...editing, totalLeads: parseInt(e.target.value) || 0 })}
                        className="w-14 px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/30 text-[10px] font-mono text-foreground text-center focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">Clientes:</span>
                      <input
                        type="number"
                        min={0}
                        value={editing.totalClients}
                        onChange={(e) => setEditing({ ...editing, totalClients: parseInt(e.target.value) || 0 })}
                        className="w-14 px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/30 text-[10px] font-mono text-foreground text-center focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground inline-flex items-center gap-1" title="Esconde do ranking até essa data">
                        Férias até:
                      </span>
                      <input
                        type="date"
                        value={editing.vacationUntil}
                        onChange={(e) => setEditing({ ...editing, vacationUntil: e.target.value })}
                        className="px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/30 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary/50"
                      />
                      {editing.vacationUntil && (
                        <button
                          onClick={() => setEditing({ ...editing, vacationUntil: "" })}
                          className="text-[9px] text-muted-foreground hover:text-destructive"
                          title="Limpar férias"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.points} pts • {a.level}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1">
                {editing?.id === a.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="w-8 h-8 rounded-lg bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(a)}
                      className="w-8 h-8 rounded-lg bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(a.id)}
                      className="w-8 h-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-all"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {assessors.length} assessor{assessors.length !== 1 ? "es" : ""} cadastrado
          {assessors.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default AssessorManager;
