import { useState } from "react";
import { UserPlus, Trash2, X, Users } from "lucide-react";
import type { Assessor } from "@/types/assessor";

interface AssessorManagerProps {
  assessors: Assessor[];
  /** Adiciona um assessor. ID e iniciais são gerados pelo backend (ou pelo hook em mock mode). */
  onAdd: (input: { name: string }) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const AssessorManager = ({ assessors, onAdd, onRemove, onClose }: AssessorManagerProps) => {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim() });
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="card-glass rounded-2xl p-6 w-full max-w-md mx-4 border border-primary/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Gerenciar Assessores</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted/30 hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add form */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Nome do assessor..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-40 transition-all hover:glow-primary"
          >
            <UserPlus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {assessors.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                a.level === "gold" ? "text-gold border-gold/30 bg-gold/10" :
                a.level === "silver" ? "text-silver border-silver/30 bg-silver/10" :
                "text-bronze border-bronze/30 bg-bronze/10"
              }`}>
                {a.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.points} pts • {a.level}</p>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                className="w-8 h-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {assessors.length} assessor{assessors.length !== 1 ? "es" : ""} cadastrado{assessors.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default AssessorManager;
